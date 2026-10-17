"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TRANSLATION } from "@/config/app";
import { getCachedTranslation, putCachedTranslation, translationCacheKey } from "@/lib/db/translations";
import { createRemoteTranslator } from "@/lib/translation/remote";
import { translateVtt } from "@/lib/translation/translate-vtt";
import { type SubtitleTranslator, TranslationError, type TranslationErrorCode } from "@/lib/translation/types";
import type { AttachedTrack } from "./useSubtitleTracks";

/**
 * "unavailable": nothing to translate (a native French track exists, or no English text track).
 * "idle": possible, not started (translation off, or waiting for the viewer).
 * "checking": looking in the device cache.
 */
export type TranslationStatus = "unavailable" | "idle" | "checking" | "translating" | "ready" | "failed";

export interface SubtitleTranslation {
  status: TranslationStatus;
  /** A real, normal French track generated from the English one; null until ready. */
  track: AttachedTrack | null;
  error: TranslationErrorCode | null;
  /** Start (or retry) now, whatever the preference. */
  request: () => void;
}

const remote = createRemoteTranslator();

/**
 * French subtitles by translation of the English text track, as one more normal <track>: same timings, same
 * settings, label « Français (traduit) ». Native French always wins (nothing is translated then). The device cache
 * is looked up first, whatever the preference; the API is only called when `auto` (translation on and French
 * wanted) or when the viewer asks — once per source file, so a failure never loops.
 */
export function useSubtitleTranslation(
  tracks: AttachedTrack[],
  options: {
    auto: boolean;
    title?: string | null;
    translator?: SubtitleTranslator;
  },
): SubtitleTranslation {
  const translator = options.translator ?? remote;
  const hasNativeFrench = tracks.some((t) => t.lang === "fr");
  const source = useMemo(() => (hasNativeFrench ? null : (tracks.find((t) => t.lang === "en" && t.vtt) ?? null)), [tracks, hasNativeFrench]);
  const vtt = source?.vtt ?? null;

  const [state, setState] = useState<{
    vtt: string;
    status: TranslationStatus;
    result: string | null;
    track: AttachedTrack | null;
    error: TranslationErrorCode | null;
  }>({ vtt: "", status: "idle", result: null, track: null, error: null });
  const [ask, setAsk] = useState<{ vtt: string; n: number } | null>(null);
  // Files already tried automatically, with how it ended: one automatic try per file, so a failure never loops.
  const attempted = useRef(new Map<string, TranslationErrorCode | null>());
  const titleRef = useRef(options.title);
  useEffect(() => {
    titleRef.current = options.title;
  }, [options.title]);
  const translatorRef = useRef(translator);
  useEffect(() => {
    translatorRef.current = translator;
  }, [translator]);

  const auto = options.auto;
  const asks = ask && ask.vtt === vtt ? ask.n : 0;
  useEffect(() => {
    if (!vtt) return;
    const controller = new AbortController();
    const set = (
      patch: Partial<{
        status: TranslationStatus;
        result: string | null;
        error: TranslationErrorCode | null;
      }>,
    ) => {
      if (!controller.signal.aborted)
        setState((prev) => {
          const base = prev.vtt === vtt ? prev : { vtt, status: "idle" as const, result: null, track: null, error: null };
          const next = { ...base, ...patch, vtt };
          // A new blob only for a new result: the real <track> stays put across re-checks.
          if (patch.result && patch.result !== base.result) {
            const url = URL.createObjectURL(new Blob([patch.result], { type: "text/vtt" }));
            next.track = { url, lang: TRANSLATION.targetLang, label: TRANSLATION.trackLabel, default: false, index: -1 };
          }
          return next;
        });
    };
    void (async () => {
      set({ status: "checking", error: null });
      const key = await translationCacheKey(vtt);
      const cached = await getCachedTranslation(key);
      if (cached) return set({ status: "ready", result: cached });
      if (!asks && !auto) return set({ status: "idle" });
      if (!asks && attempted.current.has(key)) {
        const error = attempted.current.get(key) ?? null;
        return set({ status: error ? "failed" : "idle", error });
      }
      attempted.current.set(key, null);
      set({ status: "translating" });
      try {
        const translated = await translateVtt(vtt, {
          translator: translatorRef.current,
          title: titleRef.current ?? null,
          signal: controller.signal,
        });
        await putCachedTranslation(key, translated);
        set({ status: "ready", result: translated });
      } catch (e) {
        if (controller.signal.aborted) return;
        const error = e instanceof TranslationError ? e.code : "upstream";
        attempted.current.set(key, error);
        set({ status: "failed", error });
      }
    })();
    return () => controller.abort();
    // `asks` bumps on a request; the file, the auto switch and the request are the only triggers.
  }, [vtt, auto, asks]);

  // The blob URL is revoked once replaced (or on unmount), never while shown.
  const blobUrl = state.track?.url;
  useEffect(
    () => () => {
      if (blobUrl) setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
    },
    [blobUrl],
  );

  const request = useCallback(() => {
    if (vtt) setAsk((prev) => ({ vtt, n: prev && prev.vtt === vtt ? prev.n + 1 : 1 }));
  }, [vtt]);

  if (!vtt) return { status: "unavailable", track: null, error: null, request };
  const current = state.vtt === vtt ? state : null;
  const ready = current?.track ?? null;
  const status: TranslationStatus = ready ? "ready" : current?.status === "ready" ? "checking" : (current?.status ?? "idle");
  return { status, track: ready, error: current?.error ?? null, request };
}
