"use client";

import { type RefObject, useEffect, useRef } from "react";
import { PROGRESS } from "@/config/app";
import { stashPendingSample } from "@/lib/db/pending-progress";
import { savePlaybackSample } from "@/lib/db/progress";
import type { PlaybackSample } from "@/lib/progress/logic";

export interface PersistenceContext {
  animeId: number;
  episodeNumber: number;
  providerId: string | null;
  providerEpisodeId: string | null;
  completionThreshold: number;
}

/**
 * Saves watch progress at the moments that matter — throttled while playing,
 * and immediately on pause, seek, end, backgrounding, page hide and unmount —
 * without ever writing IndexedDB per frame.
 */
export function useProgressPersistence(videoRef: RefObject<HTMLVideoElement | null>, ctx: PersistenceContext | null, allowDuration?: (seconds: number) => boolean) {
  const ctxRef = useRef(ctx);
  const allowRef = useRef(allowDuration);
  // Last position seen, kept outside the element: on unmount the source may
  // already be detached and `video.currentTime` reset to 0.
  const lastKnown = useRef<{ currentTime: number; duration: number } | null>(null);

  useEffect(() => {
    ctxRef.current = ctx;
    allowRef.current = allowDuration;
  });

  const ctxKey = ctx ? `${ctx.animeId}:${ctx.episodeNumber}` : null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ctxKey) return;
    lastKnown.current = null;
    let lastSaveAt = 0;
    let pending: Promise<unknown> = Promise.resolve();

    let savedMeaningful = false;

    const save = (ended = false, leaving = false) => {
      const c = ctxRef.current;
      const sample = lastKnown.current;
      if (!c || !sample || allowRef.current?.(sample.duration) === false) return;
      // Nothing worth remembering yet: avoids a history entry for an accidental tap.
      if (!ended && sample.currentTime < 1) return;
      lastSaveAt = Date.now();
      const record: PlaybackSample = {
        animeId: c.animeId,
        episodeNumber: c.episodeNumber,
        providerId: c.providerId,
        providerEpisodeId: c.providerEpisodeId,
        currentTime: ended ? sample.duration : sample.currentTime,
        duration: sample.duration,
        ended,
        now: lastSaveAt,
        completionThreshold: c.completionThreshold,
      };
      // The page may die before IndexedDB commits: keep a synchronous copy.
      if (leaving) stashPendingSample(record);
      // Serialize writes so an older sample can never land after a newer one.
      pending = pending.then(() => savePlaybackSample(record).catch(() => undefined));
    };

    const snapshot = () => {
      if (allowRef.current?.(video.duration) === false) { lastKnown.current = null; return; }
      if (Number.isFinite(video.duration) && video.duration > 0) {
        lastKnown.current = { currentTime: video.currentTime, duration: video.duration };
      }
    };

    const onTimeUpdate = () => {
      snapshot();
      if (video.paused) return;
      // First save as soon as the position becomes resumable, then throttled.
      const crossed = !savedMeaningful && video.currentTime >= PROGRESS.minMeaningfulSeconds;
      if (crossed || Date.now() - lastSaveAt >= PROGRESS.saveIntervalMs) {
        if (crossed) savedMeaningful = true;
        save();
      }
    };
    const onPause = () => {
      snapshot();
      // `pause` also fires right before `ended`; the ended handler records completion.
      if (!video.ended) save();
    };
    const onSeeked = () => {
      snapshot();
      save();
    };
    const onEnded = () => {
      snapshot();
      save(true);
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        snapshot();
        save(false, true);
      }
    };
    const onPageHide = () => {
      snapshot();
      save(false, true);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("ended", onEnded);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("ended", onEnded);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      // Leaving the page or switching episode: flush the final position.
      save();
    };
  }, [ctxKey, videoRef]);
}
