import { ui } from "@/lib/i18n/translate";
import { SUBTITLES } from "@/config/app";
import type { SubtitleTrack } from "@/lib/providers/types";
import { detectSubtitleFormat, raiseCues, type SubtitleFormat, toWebVtt } from "./convert";

/**
 * Getting a source's subtitle file into the player, and saying exactly what
 * happened when it does not work — a track never disappears silently.
 *
 * 1. Direct: the browser reads the file (works when the host sends CORS).
 * 2. Relay: when the direct read is refused (CORS, hotlink protection, an
 *    error page), the same URL goes through the source-bound playback relay
 *    — only for the enabled, pinned source and its approved hosts. A track the
 *    relay refuses stays refused: nothing here widens network access.
 * 3. Converted to WebVTT (SRT, ASS/SSA; VTT as is), served as a blob URL.
 */

/** The relay's answer per URL, in order: a same-origin URL, or null when it may not relay it (host not approved). */
export type SubtitleRelay = (urls: string[], signal: AbortSignal) => Promise<(string | null)[]>;

export type RetrievalPath = "direct" | "relay";

/**
 * Per-track outcome:
 * - attached: converted and on the <video>;
 * - directFailed: the browser could not read it and no relay could be tried;
 * - relayFailed: direct refused, then the relay refused or failed too;
 * - unsupported: the file was read but is not VTT/SRT/ASS/SSA;
 * - conversionFailed: recognised, but no usable cue came out;
 * - rejected: attached, but the player refused to parse it.
 */
export type SubtitleOutcome = "pending" | "attached" | "directFailed" | "relayFailed" | "unsupported" | "conversionFailed" | "rejected";

export interface SubtitleDiagnostic {
  label: string;
  lang: string;
  /** Host only — never the URL, its query or its tokens. */
  host: string | null;
  format: SubtitleFormat | null;
  path: RetrievalPath | null;
  /** null = not attempted. */
  direct: string | null;
  relay: string | null;
  conversion: "ok" | "unsupported" | "failed" | null;
  attached: boolean;
  /** Loaded and currently shown by the element; null when the engine cannot tell. */
  visible: boolean | null;
  outcome: SubtitleOutcome;
  /**
   * The relay refused this file only because its exact host is not approved
   * for this source: the user can grant it (never automatic). Absent on older reports.
   */
  needsApproval?: boolean;
}

export interface SubtitleReport {
  /** Tracks the provider returned for the option that plays. */
  provided: number;
  tracks: SubtitleDiagnostic[];
}

export interface LoadedSubtitle {
  track: SubtitleTrack;
  vtt: string;
}

/** WebVTT line of an ordinary cue: its bottom edge on this share of the picture height (about 9 % of margin below). */
export const DEFAULT_CUE_LINE = `${SUBTITLES.defaultCueLinePercent}%,end`;

export const RELAY_PATH_PREFIX = "/api/playback/";

class Unreadable extends Error {
  constructor(readonly reason: string) {
    super(reason);
  }
}

function hostOf(url: string, base: string): string | null {
  try {
    return new URL(url, base).hostname || null;
  } catch {
    return null;
  }
}

function isRelayUrl(url: string, base: string): boolean {
  try {
    const u = new URL(url, base);
    return u.origin === new URL(base).origin && u.pathname.startsWith(RELAY_PATH_PREFIX);
  } catch {
    return false;
  }
}

/**
 * Third-party subtitle hosts never see our cookies ("omit"). A signed relay URL
 * is our own origin: it needs the browser's own cookies back (a protected Vercel
 * preview rejects the cookie-less request). Never "include": nothing cross-origin.
 */
export function subtitleFetchCredentials(url: string, base: string): "omit" | "same-origin" {
  return isRelayUrl(url, base) ? "same-origin" : "omit";
}

/** The caller's signal, plus a bound on one file read. */
function withTimeout(signal: AbortSignal): AbortSignal {
  return AbortSignal.any([signal, AbortSignal.timeout(SUBTITLES.readTimeoutMs)]);
}

async function read(fetchImpl: typeof fetch, url: string, signal: AbortSignal, base: string): Promise<string> {
  let res: Response;
  try {
    // As given: a relay URL stays relative (same origin), the browser resolves it.
    res = await fetchImpl(url, { credentials: subtitleFetchCredentials(url, base), referrerPolicy: "no-referrer", signal: withTimeout(signal) });
  } catch (e) {
    // The caller's own abort ends the load; the read timeout (also an abort, of our making) is just an unreadable file.
    if (signal.aborted) throw e;
    // The browser does not say why: a missing CORS header and a network failure look the same.
    throw new Unreadable("refusé (CORS ou réseau)");
  }
  if (!res.ok) throw new Unreadable(`HTTP ${res.status}`);
  if (Number(res.headers.get("content-length") ?? 0) > SUBTITLES.maxBytes) throw new Unreadable("fichier trop gros");
  const text = await res.text();
  if (text.length > SUBTITLES.maxBytes) throw new Unreadable("fichier trop gros");
  return text;
}

/** Relay failures, as the diagnostics show them. */
export function relayFailureLabel(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === "needsAccount") return "indisponible sans compte";
  if (code === "permission") return "hôte non approuvé";
  if (code === "codeUnavailable") return "source non activée";
  return "relais injoignable";
}

interface Parsed {
  format: SubtitleFormat | null;
  vtt: string | null;
}

function parse(text: string): Parsed {
  const format = detectSubtitleFormat(text);
  const vtt = format ? toWebVtt(text) : null;
  return { format, vtt: vtt ? raiseCues(vtt, DEFAULT_CUE_LINE) : null };
}

/**
 * Loads every track (direct first, relay for the ones the browser could not
 * read, in one relay call) and reports each one. `relay` is null when this
 * playback has no source-bound relay (demo stream, no extension).
 */
export async function loadSubtitles(
  subtitles: readonly SubtitleTrack[],
  options: { fetch?: typeof fetch; relay: SubtitleRelay | null; signal: AbortSignal; base?: string },
): Promise<{ loaded: (LoadedSubtitle | null)[]; report: SubtitleReport }> {
  const fetchImpl = options.fetch ?? fetch;
  const base = options.base ?? (typeof window === "undefined" ? "http://localhost/" : window.location.href);
  const { signal } = options;
  const diags: SubtitleDiagnostic[] = subtitles.map((s) => ({
    label: s.label,
    lang: s.lang,
    host: isRelayUrl(s.url, base) ? null : hostOf(s.url, base),
    format: null,
    path: null,
    direct: null,
    relay: null,
    conversion: null,
    attached: false,
    visible: null,
    outcome: "pending",
  }));
  const texts: (Parsed | null)[] = subtitles.map(() => null);

  // 1. Direct (or an URL the relay already signed when the stream itself is relayed).
  await Promise.all(
    subtitles.map(async (s, i) => {
      const d = diags[i]!;
      const viaRelay = isRelayUrl(s.url, base);
      try {
        const parsed = parse(await read(fetchImpl, s.url, signal, base));
        if (viaRelay) d.relay = "ok";
        else d.direct = "ok";
        d.path = viaRelay ? "relay" : "direct";
        d.format = parsed.format;
        texts[i] = parsed;
      } catch (e) {
        if ((e as Error)?.name === "AbortError") throw e;
        const reason = e instanceof Unreadable ? e.reason : "échec";
        if (viaRelay) d.relay = reason;
        else d.direct = reason;
      }
    }),
  );

  // 2. Relay for what the browser could not read (or read as something that is not a subtitle file).
  const retry = subtitles.map((s, i) => i).filter((i) => !isRelayUrl(subtitles[i]!.url, base) && (texts[i] == null || texts[i]!.format == null));
  if (retry.length && options.relay) {
    let relayed: (string | null)[] | null = null;
    try {
      relayed = await options.relay(
        retry.map((i) => subtitles[i]!.url),
        signal,
      );
    } catch (e) {
      if ((e as Error)?.name === "AbortError") throw e;
      const refusedHosts = (e as { code?: string; detail?: { hosts?: string[] } } | null)?.code === "permission" ? ((e as { detail?: { hosts?: string[] } }).detail?.hosts ?? []) : [];
      for (const i of retry) {
        diags[i]!.relay = relayFailureLabel(e);
        if (diags[i]!.host && refusedHosts.includes(diags[i]!.host!)) diags[i]!.needsApproval = true;
      }
    }
    if (relayed) {
      await Promise.all(
        retry.map(async (i, k) => {
          const d = diags[i]!;
          const url = relayed![k];
          if (!url) {
            d.relay = "hôte non approuvé";
            // The relay answers null only for a host outside this source's approved list.
            if (d.host) d.needsApproval = true;
            return;
          }
          try {
            const parsed = parse(await read(fetchImpl, url, signal, base));
            d.relay = "ok";
            d.path = "relay";
            d.format = parsed.format;
            texts[i] = parsed;
          } catch (e) {
            if ((e as Error)?.name === "AbortError") throw e;
            d.relay = e instanceof Unreadable ? e.reason : "échec";
          }
        }),
      );
    }
  }

  // 3. Conversion.
  const loaded = subtitles.map((s, i): LoadedSubtitle | null => {
    const d = diags[i]!;
    const parsed = texts[i];
    if (!parsed) {
      d.outcome = d.relay != null ? "relayFailed" : "directFailed";
      return null;
    }
    if (!parsed.format) {
      d.conversion = "unsupported";
      d.outcome = "unsupported";
      return null;
    }
    if (!parsed.vtt) {
      d.conversion = "failed";
      d.outcome = "conversionFailed";
      return null;
    }
    d.conversion = "ok";
    return { track: s, vtt: parsed.vtt };
  });
  return { loaded, report: { provided: subtitles.length, tracks: diags } };
}

export interface BlockedSubtitles {
  /** Exact hosts the relay refused (not approved for this source), in track order. */
  hosts: string[];
  /** The tracks waiting for them: what the permission request is about. */
  tracks: { label: string; lang: string }[];
}

/**
 * Tracks the source did return for this playback but that only an approval
 * would unlock: direct read failed, then the relay refused the exact host.
 * Hosts come from the returned subtitle URLs themselves — nothing else.
 */
export function blockedSubtitles(report: SubtitleReport | null | undefined): BlockedSubtitles | null {
  const blocked = report?.tracks.filter((t) => t.needsApproval && t.host && t.outcome !== "attached") ?? [];
  if (!blocked.length) return null;
  return { hosts: [...new Set(blocked.map((t) => t.host!))], tracks: blocked.map((t) => ({ label: t.label, lang: t.lang })) };
}

// ---------- Wording (Source Lab, diagnostics) ----------

const FORMAT_LABELS: Record<SubtitleFormat, string> = { vtt: "WebVTT", srt: "SRT", ass: "ASS/SSA" };

export const OUTCOME_LABELS: Record<SubtitleOutcome, string> = {
  get pending() { return ui("en cours"); },
  get attached() { return ui("attachée"); },
  get directFailed() { return ui("lecture directe refusée"); },
  get relayFailed() { return ui("relais refusé"); },
  unsupported: "format non pris en charge",
  conversionFailed: "conversion impossible",
  get rejected() { return ui("refusée par le lecteur"); },
};

/** One sanitized line per track: label, language, format, path, each step's result. */
export function describeSubtitleTrack(d: SubtitleDiagnostic): string {
  const parts = [`${d.label || "sans nom"} (${d.lang}${d.format ? `, ${FORMAT_LABELS[d.format]}` : ""})`];
  if (d.direct != null) parts.push(`direct : ${d.direct}`);
  if (d.relay != null) parts.push(`relais : ${d.relay}`);
  if (d.conversion) parts.push(`conversion : ${d.conversion === "ok" ? "ok" : d.conversion === "unsupported" ? "format inconnu" : ui("échec")}`);
  parts.push(ui("attachée : {0}", d.attached ? "oui" : "non"));
  if (d.attached) parts.push(ui("affichée : {0}", d.visible == null ? "?" : d.visible ? "oui" : "non"));
  if (d.path) parts.push(`via ${d.path === "relay" ? "relais" : "direct"}`);
  if (d.host && d.outcome !== "attached") parts.push(d.host);
  if (d.needsApproval && d.outcome !== "attached") parts.push(ui("autorisation requise"));
  return parts.join(" ");
}

export type SubtitleVerdict = "none" | "pending" | "shown" | "attachedHidden" | "failed";

/** The whole playback's subtitle result, in the terms the Source Lab keeps apart. */
export function subtitleVerdict(report: SubtitleReport): { verdict: SubtitleVerdict; text: string } {
  if (report.provided === 0) return { verdict: "none", get text() { return ui("La source n'a fourni aucune piste de sous-titres"); } };
  if (report.tracks.some((t) => t.outcome === "pending")) return { verdict: "pending", get text() { return ui("Sous-titres en cours de chargement"); } };
  const attached = report.tracks.filter((t) => t.outcome === "attached");
  const langs = [...new Set(attached.map((t) => t.lang.toUpperCase()))].join(", ");
  const failed = report.tracks.filter((t) => t.outcome !== "attached");
  const failure = failed.length ? ui(" · {0} en échec ({1})", failed.length, [...new Set(failed.map((t) => OUTCOME_LABELS[t.outcome]))].join(", ")) : "";
  if (!attached.length) return { verdict: "failed", text: `${report.provided} piste${report.provided > 1 ? "s" : ""} fournie${report.provided > 1 ? "s" : ""}, aucune utilisable${failure}` };
  if (attached.some((t) => t.visible === true)) return { verdict: "shown", text: ui("Sous-titres affichés · {0}{1}", langs, failure) };
  if (attached.every((t) => t.visible === false)) return { verdict: "attachedHidden", text: ui("Sous-titres attachés mais non affichés · {0}{1}", langs, failure) };
  return { verdict: "shown", text: ui("Sous-titres attachés · {0}{1}", langs, failure) };
}
