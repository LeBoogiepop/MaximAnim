import { availableEpisodeCount } from "@/lib/anilist/normalize";
import { ui } from "@/lib/i18n/translate";
import type { AnimeRecord, LibraryStateRecord, ProgressRecord } from "@/lib/db/types";
import { isInProgress, isStaleDismissal } from "@/lib/progress/logic";

/**
 * Smart views of the library: automatic filters over what the viewer did, never lists the viewer fills.
 *
 * - **À continuer** — a title really started, and neither finished nor abandoned, nor removed from Continuer.
 * - **Terminés** — declared finished, OR AniList says FINISHED and every episode is completed here. A title still airing
 *   (or on hiatus, or cancelled) is never finished merely because every episode that exists so far was watched.
 * - **Abandonnés** — the viewer said so. Progress and history stay; « Reprendre » removes the state.
 *
 * Pure: no IndexedDB, so the rules are unit-testable.
 */

export type SmartView = "continue" | "completed" | "abandoned";

export const SMART_VIEWS: readonly SmartView[] = ["continue", "completed", "abandoned"];

// Getters, so the label follows the interface language at render time (the keys already exist in the catalogue).
export const SMART_VIEW_LABELS: Record<SmartView, string> = { get continue() { return ui("À continuer"); }, get completed() { return ui("Terminés"); }, get abandoned() { return ui("Abandonnés"); } };


export interface LibraryEntry {
  anime: AnimeRecord;
  progress: ProgressRecord[];
  state: LibraryStateRecord | undefined;
}

export function lastWatchedAt(progress: readonly ProgressRecord[]): number {
  return progress.reduce((latest, p) => Math.max(latest, p.lastWatchedAt), 0);
}

/**
 * « Abandonné » stands until the viewer watches something again: playing an episode after abandoning a title is
 * « Reprendre » in all but name, and must not leave it out of Continuer. (« Reprendre » the action removes the state.)
 */
export function abandonedNow(state: LibraryStateRecord | undefined, progress: readonly ProgressRecord[]): boolean {
  return state?.state === "abandoned" && lastWatchedAt(progress) <= state.at;
}

/** Finished by the numbers: AniList says FINISHED and every episode (or the film) is completed here. */
export function completedByNumbers(entry: Pick<LibraryEntry, "anime" | "progress">): boolean {
  const summary = entry.anime.summary;
  if (summary.status !== "FINISHED") return false;
  const total = availableEpisodeCount(summary) ?? summary.episodeCount;
  if (total == null || total <= 0) return false;
  // Episodes 1…N each once: a recap numbered 6.5 or an episode 0 must not stand in for one that was skipped.
  const seen = new Set(entry.progress.filter((p) => p.completed && Number.isInteger(p.episodeNumber) && p.episodeNumber >= 1 && p.episodeNumber <= total).map((p) => p.episodeNumber));
  return seen.size >= total;
}

const started = (progress: readonly ProgressRecord[]) => progress.some((p) => p.completed || isInProgress(p));

/** « Retirer de Continuer » is made on the episode the viewer was at: it applies while playback is still around there. */
function dismissed(progress: readonly ProgressRecord[]): boolean {
  const latest = progress.reduce<ProgressRecord | undefined>((best, p) => (!best || p.lastWatchedAt > best.lastWatchedAt ? p : best), undefined);
  return latest?.continueDismissal != null && !isStaleDismissal(latest.continueDismissal, latest.currentTime);
}

/** The one view a title belongs to, or null (never started, removed from Continuer…). An explicit choice always speaks first. */
export function classify(entry: LibraryEntry): SmartView | null {
  if (abandonedNow(entry.state, entry.progress)) return "abandoned";
  if (entry.state?.state === "completed" || completedByNumbers(entry)) return "completed";
  if (started(entry.progress) && !dismissed(entry.progress)) return "continue";
  return null;
}

export function buildViews(entries: readonly LibraryEntry[]): Record<SmartView, LibraryEntry[]> {
  const views: Record<SmartView, LibraryEntry[]> = { continue: [], completed: [], abandoned: [] };
  for (const entry of entries) {
    const view = classify(entry);
    if (view) views[view].push(entry);
  }
  const recency = (e: LibraryEntry) => Math.max(lastWatchedAt(e.progress), e.state?.at ?? 0);
  for (const view of SMART_VIEWS) views[view].sort((a, b) => recency(b) - recency(a) || a.anime.id - b.anime.id);
  return views;
}
