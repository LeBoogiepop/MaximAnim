import { EXTERNAL_SUBTITLES } from "@/config/app";
import type { ExternalEpisodeRef, ExternalSubtitleCandidate, SubtitleOrigin } from "./types";

/**
 * Validating and ranking what providers returned. Never "first result", never "biggest file", never "first French
 * track": the episode evidence comes first, then who wrote it, then small tie-breakers.
 */

const ORIGIN_RANK: Record<SubtitleOrigin, number> = { human: 0, unknown: 1, machine: 2 };
const MATCH_RANK = { verified: 0, unknown: 1, contradicted: 2 } as const;
const PROVIDER_RANK = { gestdown: 0, opensubtitles: 1 } as const;

/** The most common frame rate among candidates that declare one: a file at another rate is another cut. */
function consensusFps(list: ExternalSubtitleCandidate[]): number | null {
  const counts = new Map<number, number>();
  for (const c of list) if (c.fps) counts.set(c.fps, (counts.get(c.fps) ?? 0) + 1);
  let best: [number, number] | null = null;
  for (const entry of counts) if (!best || entry[1] > best[1]) best = entry;
  return best && best[1] >= 2 ? best[0] : null;
}

/** Same file twice (same provider and id), or the same release from the same provider: one stays. */
function dedupe(list: ExternalSubtitleCandidate[]): ExternalSubtitleCandidate[] {
  const seen = new Set<string>();
  const out: ExternalSubtitleCandidate[] = [];
  for (const c of list) {
    const release = c.releaseName ? c.releaseName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() : null;
    const keys = [`${c.provider}|${c.id}`, release ? `${c.provider}|${c.language}|${release}|${c.hearingImpaired ? "hi" : ""}` : null].filter((k): k is string => !!k);
    if (keys.some((k) => seen.has(k))) continue;
    keys.forEach((k) => seen.add(k));
    out.push(c);
  }
  return out;
}

export function rankCandidates(candidates: ExternalSubtitleCandidate[], ref: ExternalEpisodeRef, limit: number = EXTERNAL_SUBTITLES.maxCandidates): ExternalSubtitleCandidate[] {
  // 1. Contradicted: another episode's file, dropped from every language.
  let kept = candidates.filter((c) => c.match !== "contradicted");
  // 2. Absolute numbering has no season structure to lean on: only a release that names the number is kept.
  if (ref.kind === "absolute") kept = kept.filter((c) => c.match === "verified");
  kept = dedupe(kept);
  const fps = consensusFps(kept);
  const off = (c: ExternalSubtitleCandidate) => (fps && c.fps && c.fps !== fps ? 1 : 0);
  return kept
    .map((c, order) => ({ c, order }))
    .sort(
      (a, b) =>
        // A machine-translated file never outranks a person's, whatever its episode evidence.
        Number(a.c.origin === "machine") - Number(b.c.origin === "machine") ||
        MATCH_RANK[a.c.match] - MATCH_RANK[b.c.match] ||
        ORIGIN_RANK[a.c.origin] - ORIGIN_RANK[b.c.origin] ||
        Number(a.c.hearingImpaired === true) - Number(b.c.hearingImpaired === true) ||
        off(a.c) - off(b.c) ||
        PROVIDER_RANK[a.c.provider] - PROVIDER_RANK[b.c.provider] ||
        a.order - b.order,
    )
    .slice(0, limit)
    .map((x) => x.c);
}

/**
 * The file a French preference may pick on its own (best first): never a machine-translated one — that waits behind
 * the viewer's own translation — and never one contradicted by its name.
 */
export function autoPick(candidates: ExternalSubtitleCandidate[]): ExternalSubtitleCandidate | null {
  return candidates.find((c) => c.match !== "contradicted" && c.origin !== "machine") ?? null;
}

/**
 * Gross-mismatch gate: another cut of the episode, or another episode, ends far from the video's end. Deliberately
 * wide — a file may stop before the credits — so only clear mismatches are rejected. `null` duration: no verdict.
 */
export function plausibleDuration(lastCueEndSeconds: number | null, durationSeconds: number | null): boolean {
  if (lastCueEndSeconds == null || !durationSeconds || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return true;
  const { maxOverrun, overrunSlackSeconds, minCoverage } = EXTERNAL_SUBTITLES.durationGate;
  if (lastCueEndSeconds > durationSeconds * maxOverrun + overrunSlackSeconds) return false;
  return lastCueEndSeconds >= durationSeconds * minCoverage;
}
