import { EXTERNAL_SUBTITLES, SUBTITLES } from "@/config/app";
import { detectSubtitleFormat, raiseCues, toWebVtt } from "../convert";
import { DEFAULT_CUE_LINE } from "../load";
import type { ExternalAnimeFacts, ExternalProviderId, ExternalSearchResult } from "./types";

/**
 * The browser's side of the external subtitle API: same-origin only (`/api/subtitles/external/*`), typed failures,
 * and the converted file as WebVTT. A failure of any kind is a value, never an exception the player has to survive.
 */

export type ExternalFetchFailure = "network" | "timeout" | "unavailable" | "unsupported" | "empty" | "too_large";

export type Fetched<T> = { ok: true; value: T } | { ok: false; reason: ExternalFetchFailure };

export interface ExternalSubtitleApi {
  search(facts: ExternalAnimeFacts, episode: number, signal: AbortSignal): Promise<Fetched<ExternalSearchResult>>;
  /** The provider file, normalised to the WebVTT the player mounts (SRT / ASS / VTT in, vertical placement raised). */
  file(provider: ExternalProviderId, id: string, signal: AbortSignal): Promise<Fetched<string>>;
}

function bounded(signal: AbortSignal): AbortSignal {
  return AbortSignal.any([signal, AbortSignal.timeout(SUBTITLES.readTimeoutMs)]);
}

async function call(url: string, signal: AbortSignal): Promise<Fetched<Response>> {
  try {
    const res = await fetch(url, { credentials: "same-origin", signal: bounded(signal) });
    if (!res.ok) return { ok: false, reason: res.status === 413 ? "too_large" : res.status === 415 ? "unsupported" : "unavailable" };
    return { ok: true, value: res };
  } catch (e) {
    if (signal.aborted) throw e;
    return { ok: false, reason: (e as Error)?.name === "TimeoutError" ? "timeout" : "network" };
  }
}

export const externalSubtitleApi: ExternalSubtitleApi = {
  async search(facts, episode, signal) {
    const query = new URLSearchParams({ anilistId: String(facts.anilistId), episode: String(episode), lang: EXTERNAL_SUBTITLES.language });
    if (facts.episodeCount) query.set("episodes", String(facts.episodeCount));
    if (facts.format) query.set("format", facts.format);
    const res = await call(`/api/subtitles/external/search?${query}`, signal);
    if (!res.ok) return res;
    try {
      const body = (await res.value.json()) as ExternalSearchResult;
      if (!Array.isArray(body?.candidates)) return { ok: false, reason: "unavailable" };
      return { ok: true, value: body };
    } catch {
      return { ok: false, reason: "unavailable" };
    }
  },

  async file(provider, id, signal) {
    const res = await call(`/api/subtitles/external/file?${new URLSearchParams({ provider, id })}`, signal);
    if (!res.ok) return res;
    const text = await res.value.text();
    return convertExternalSubtitle(text);
  },
};

/** SRT / ASS / VTT text → the player's WebVTT; a refusal is typed, never thrown. Shared with tests. */
export function convertExternalSubtitle(text: string): Fetched<string> {
  if (text.length > SUBTITLES.maxBytes) return { ok: false, reason: "too_large" };
  const format = detectSubtitleFormat(text);
  if (!format) return { ok: false, reason: "unsupported" };
  const vtt = toWebVtt(text);
  if (!vtt) return { ok: false, reason: "empty" };
  return { ok: true, value: raiseCues(vtt, DEFAULT_CUE_LINE) };
}
