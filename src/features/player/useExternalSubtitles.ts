"use client";


import { ui } from "@/lib/i18n/translate";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXTERNAL_SUBTITLES } from "@/config/app";
import { fileKey, getCachedFile, getCachedSearch, getOffset, offsetKey, putCachedFile, putCachedSearch, putOffset, searchKey } from "@/lib/db/external-subtitles";
import { clampOffset, cueSpans, estimateShift, lastCueEnd, shiftVtt } from "@/lib/subtitles/external/offset";
import { autoPick, plausibleDuration } from "@/lib/subtitles/external/rank";
import { type ExternalSubtitleApi, externalSubtitleApi } from "@/lib/subtitles/external/remote";
import { EXTERNAL_PROVIDER_LABELS, type ExternalSubtitleCandidate } from "@/lib/subtitles/external/types";
import type { AttachedTrack } from "./useSubtitleTracks";

/**
 * French subtitles from an independent provider, for a video whose own source has none.
 *
 * Order of preference (the player's mount order enforces it, native first): native French > external French > the
 * viewer's translation > English. The file goes through the same pipeline as every other track: provider bytes → the
 * server → SRT/ASS/VTT normalised to WebVTT → a blob URL → one real <track> (never an overlay, never a rebuilt
 * TextTrack, never crossOrigin on the <video>). Nothing here can stop playback: every step ends in a status.
 */

export type ExternalStatus = "off" | "searching" | "loading" | "ready" | "none" | "failed";

export interface ExternalSubtitleOption {
  key: string;
  /** What the menu line says: provider, release, and whether the release names this episode. */
  label: string;
  verified: boolean;
  machine: boolean;
}

export interface ExternalSubtitles {
  status: ExternalStatus;
  /** A real, normal French track; null until a file is ready. */
  track: AttachedTrack | null;
  options: ExternalSubtitleOption[];
  selectedKey: string | null;
  select: (key: string) => void;
  /** Seconds added to every cue (the file as downloaded is 0). */
  offset: number;
  /** The current offset was measured against the video source's own English track, not set by the viewer. */
  aligned: boolean;
  adjust: (delta: number) => void;
  resetOffset: () => void;
}

export interface ExternalSubtitleInput {
  /** The anime and episode as AniList knows them; absent = no external subtitles (standalone player, demo). */
  anime: { anilistId: number; episode: number; episodeCount: number | null; format: string | null } | null;
  /** French is wanted (Auto or Français) and no native French text track is attached. */
  wanted: boolean;
  /** The video source's own subtitles have settled (attached or failed): external ones never race them. */
  ready: boolean;
  /** video.duration when known, for the gross-mismatch gate. */
  duration: number | null;
  /** The source's own English WebVTT, the timing reference of the optional alignment. */
  reference: string | null;
  api?: ExternalSubtitleApi;
}

const keyOf = (c: Pick<ExternalSubtitleCandidate, "provider" | "id">) => `${c.provider}:${c.id}`;

function optionOf(c: ExternalSubtitleCandidate): ExternalSubtitleOption {
  const release = c.releaseName ? c.releaseName.replace(/\.(srt|ass|vtt)$/i, "") : null;
  const short = release && release.length > 38 ? `${release.slice(0, 36)}…` : release;
  const proof = c.match === "verified" ? ui("release vérifiée") : ui("épisode non confirmé");
  return {
    key: keyOf(c),
    label: [EXTERNAL_PROVIDER_LABELS[c.provider], short, c.origin === "machine" ? ui("traduction automatique") : proof].filter(Boolean).join(" · "),
    verified: c.match === "verified",
    machine: c.origin === "machine",
  };
}

type Offset = { seconds: number; by: "aligned" | "manual" | "none" };

export function useExternalSubtitles(input: ExternalSubtitleInput): ExternalSubtitles {
  const api = input.api ?? externalSubtitleApi;
  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const anime = input.anime;
  const animeId = anime?.anilistId ?? 0;
  const episode = anime?.episode ?? 0;
  const episodeCount = anime?.episodeCount ?? null;
  const format = anime?.format ?? null;
  const scope = `${animeId}|${episode}`;
  // French wanted starts the lookup; once begun for this episode the track stays mounted (switching the CC to English or Off
  // only changes which one is shown, exactly like the native tracks).
  const [began, setBegan] = useState<string | null>(null);
  const start = !!anime && input.wanted && input.ready;
  if (start && began !== scope) setBegan(scope);
  const active = !!anime && (start || began === scope);

  // ---- 1. Candidates (device cache first, then the network; a stale cache beats nothing) ----
  const [found, setFound] = useState<{ scope: string; candidates: ExternalSubtitleCandidate[]; settled: boolean } | null>(null);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    void (async () => {
      const key = searchKey(animeId, episode);
      const cached = await getCachedSearch(key);
      if (controller.signal.aborted) return;
      if (cached) setFound({ scope, candidates: cached.search.candidates, settled: cached.fresh });
      if (cached?.fresh) return;
      try {
        const result = await apiRef.current.search({ anilistId: animeId, episodeCount, format }, episode, controller.signal);
        if (controller.signal.aborted) return;
        if (result.ok) {
          const search = { candidates: result.value.candidates, notApplicable: result.value.notApplicable };
          // A search that could not even ask (dataset unreachable) is not remembered as "nothing found".
          if (result.value.notApplicable !== "ID dataset unavailable" && !result.value.providers.some((p) => p.status === "failed")) await putCachedSearch(key, search);
          setFound({ scope, candidates: search.candidates, settled: true });
        } else if (!cached) setFound({ scope, candidates: [], settled: true });
      } catch {
        // Aborted: the next scope takes over.
      }
    })();
    return () => controller.abort();
  }, [active, animeId, episode, episodeCount, format, scope]);

  const candidates = useMemo(() => (found?.scope === scope ? found.candidates : []), [found, scope]);
  const searchSettled = found?.scope === scope && found.settled;

  // ---- 2. Which one: the viewer's pick, else the best the policy allows that has not been refused ----
  const [picked, setPicked] = useState<{ scope: string; key: string } | null>(null);
  const [refused, setRefused] = useState<{ scope: string; keys: string[] }>({ scope: "", keys: [] });
  const refusedKeys = useMemo(() => (refused.scope === scope ? refused.keys : []), [refused, scope]);
  const refuse = useCallback((key: string) => setRefused((prev) => ({ scope, keys: [...(prev.scope === scope ? prev.keys : []), key] })), [scope]);
  const userKey = picked?.scope === scope ? picked.key : null;
  const chosen = useMemo(() => {
    if (userKey) return candidates.find((c) => keyOf(c) === userKey) ?? null;
    return autoPick(candidates.filter((c) => !refusedKeys.includes(keyOf(c))));
  }, [candidates, userKey, refusedKeys]);
  const chosenKey = chosen ? keyOf(chosen) : null;

  // ---- 3. The file ----
  const [file, setFile] = useState<{ key: string; vtt: string } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  useEffect(() => {
    if (!active || !chosen || !chosenKey) return;
    const controller = new AbortController();
    void (async () => {
      const cacheKey = fileKey(animeId, episode, chosen.provider, chosen.id);
      const cached = await getCachedFile(cacheKey);
      if (controller.signal.aborted) return;
      if (cached) return setFile({ key: chosenKey, vtt: cached });
      try {
        const result = await apiRef.current.file(chosen.provider, chosen.id, controller.signal);
        if (controller.signal.aborted) return;
        if (!result.ok) throw new Error(result.reason);
        await putCachedFile(cacheKey, result.value);
        setFile({ key: chosenKey, vtt: result.value });
      } catch {
        if (controller.signal.aborted) return;
        // An automatic pick that cannot be read yields to the next candidate; the viewer's own pick just reports it.
        setFailedKey(chosenKey);
        if (!userKey) refuse(chosenKey);
      }
    })();
    return () => controller.abort();
  }, [active, chosen, chosenKey, animeId, episode, userKey, refuse]);

  const vtt = file && file.key === chosenKey ? file.vtt : null;

  // ---- 4. Gross mismatch: another cut or another episode ends far from the video's end ----
  // Derived while rendering (guarded, so it settles at once): the refusal feeds the choice above.
  if (vtt && chosenKey && !userKey && !refusedKeys.includes(chosenKey) && !plausibleDuration(lastCueEnd(vtt), input.duration)) refuse(chosenKey);

  // ---- 5. Offset: the viewer's, else the optional alignment on the source's English track ----
  const [offsetState, setOffsetState] = useState<{ key: string; offset: Offset } | null>(null);
  const storeKey = chosen ? offsetKey(animeId, episode, chosen.provider, chosen.id) : null;
  useEffect(() => {
    if (!storeKey || !chosenKey) return;
    let live = true;
    void getOffset(storeKey).then((stored) => {
      if (live) setOffsetState({ key: chosenKey, offset: stored ? { seconds: stored.seconds, by: stored.by } : { seconds: 0, by: "none" } });
    });
    return () => {
      live = false;
    };
  }, [storeKey, chosenKey]);
  const offset: Offset = offsetState?.key === chosenKey ? offsetState.offset : { seconds: 0, by: "none" };
  const offsetLoaded = offsetState?.key === chosenKey;

  const reference = input.reference;
  useEffect(() => {
    // Only when nothing was decided yet (no stored value), and only with a clear peak: otherwise the file stays as downloaded.
    if (!vtt || !reference || !storeKey || !chosenKey || !offsetLoaded || offset.by !== "none") return;
    // Off the render path, and after the track is on: the estimate is a few milliseconds of arithmetic, never a wait.
    const timer = setTimeout(() => {
      const estimate = estimateShift(cueSpans(reference), cueSpans(vtt));
      if (!estimate) return;
      const seconds = clampOffset(estimate.shift);
      if (!seconds) return;
      setOffsetState({ key: chosenKey, offset: { seconds, by: "aligned" } });
      void putOffset(storeKey, { seconds, by: "aligned" });
    }, 0);
    return () => clearTimeout(timer);
  }, [vtt, reference, storeKey, chosenKey, offsetLoaded, offset.by]);

  const adjust = useCallback(
    (delta: number) => {
      if (!storeKey || !chosenKey) return;
      const seconds = clampOffset(offset.seconds + delta);
      setOffsetState({ key: chosenKey, offset: { seconds, by: "manual" } });
      void putOffset(storeKey, { seconds, by: "manual" });
    },
    [storeKey, chosenKey, offset.seconds],
  );
  const resetOffset = useCallback(() => {
    if (!storeKey || !chosenKey) return;
    setOffsetState({ key: chosenKey, offset: { seconds: 0, by: "manual" } });
    void putOffset(storeKey, { seconds: 0, by: "manual" });
  }, [storeKey, chosenKey]);

  // ---- 6. The track: one blob per (file, offset), revoked once replaced ----
  const shifted = useMemo(() => (vtt ? shiftVtt(vtt, offset.seconds) : null), [vtt, offset.seconds]);
  const [blob, setBlob] = useState<{ key: string; url: string } | null>(null);
  useEffect(() => {
    if (!shifted || !chosenKey) return;
    let url: string | null = null;
    let live = true;
    void Promise.resolve().then(() => {
      if (!live) return;
      url = URL.createObjectURL(new Blob([shifted], { type: "text/vtt" }));
      setBlob({ key: chosenKey, url });
    });
    return () => {
      live = false;
      // Revoked once replaced (or on unmount), never while shown.
      const old = url;
      if (old) setTimeout(() => URL.revokeObjectURL(old), 0);
    };
  }, [shifted, chosenKey]);

  const label = chosen ? ui("Français · {0}", EXTERNAL_PROVIDER_LABELS[chosen.provider]) : "";
  const track: AttachedTrack | null = useMemo(
    () => (active && blob && blob.key === chosenKey && shifted ? { url: blob.url, lang: EXTERNAL_SUBTITLES.language, label, default: false, index: -2, vtt: shifted } : null),
    [active, blob, chosenKey, shifted, label],
  );

  const options = useMemo(() => candidates.map(optionOf), [candidates]);
  const select = useCallback((key: string) => setPicked({ scope, key }), [scope]);

  let status: ExternalStatus;
  if (!active) status = "off";
  else if (!searchSettled && !candidates.length) status = "searching";
  else if (track) status = "ready";
  else if (!chosen) status = candidates.length && refusedKeys.length ? "failed" : "none";
  else if (failedKey === chosenKey) status = "failed";
  else status = "loading";

  return { status, track, options, selectedKey: chosenKey, select, offset: offset.seconds, aligned: offset.by === "aligned" && offset.seconds !== 0, adjust, resetOffset };
}
