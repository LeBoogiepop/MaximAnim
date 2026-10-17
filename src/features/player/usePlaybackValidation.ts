"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { PLAYBACK_VALIDATION as LIMIT } from "@/config/app";
import { durationVerdict, positiveDuration } from "@/lib/sources/playback-validation";

/** One mounted stream. Seeing a frame and confirming useful playback are separate facts. */
export function usePlaybackValidation(videoRef: RefObject<HTMLVideoElement | null>, expectedSeconds?: number | null) {
  const [state, setState] = useState({ rejected: false, confirmed: false });
  const rejected = useRef(false);
  const expected = useRef(expectedSeconds);
  const recheck = useRef<(() => void) | null>(null);
  useEffect(() => { expected.current = expectedSeconds; recheck.current?.(); }, [expectedSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let played = 0;
    let confirmed = false;
    let waiting = false;
    let last: { at: number; position: number; running: boolean } | null = null;
    const inspect = (event?: Event) => {
      if (rejected.current) return;
      const duration = event?.type === "ended" && positiveDuration(video.duration) == null ? video.currentTime : video.duration;
      if (durationVerdict(duration, expected.current) === "incompatible") {
        rejected.current = true;
        setState({ rejected: true, confirmed: false });
        video.pause();
        return;
      }
      if (event?.type === "waiting" || event?.type === "stalled" || event?.type === "seeking") waiting = true;
      if (event?.type === "playing" || event?.type === "seeked") waiting = false;
      const at = performance.now();
      const running = !video.paused && !video.seeking && !waiting && !video.ended && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
      if (event?.type === "timeupdate" && last?.running && running) {
        const elapsed = Math.max(0, (at - last.at) / 1000);
        const moved = video.currentTime - last.position;
        const rate = video.playbackRate > 0 ? video.playbackRate : 1;
        if (moved > 0 && moved <= elapsed * rate + LIMIT.seekSlackSeconds) played += Math.min(elapsed, moved / rate);
      }
      last = { at, position: video.currentTime, running };
      const reference = positiveDuration(expected.current);
      const proof = reference == null ? LIMIT.successSeconds : Math.min(LIMIT.successSeconds, reference * LIMIT.shortRuntimeProofRatio);
      if (!confirmed && played >= proof) {
        confirmed = true;
        setState({ rejected: false, confirmed: true });
      }
    };
    const events = ["loadedmetadata", "durationchange", "playing", "waiting", "stalled", "pause", "seeking", "seeked", "timeupdate", "ended"];
    events.forEach(name => video.addEventListener(name, inspect));
    recheck.current = inspect;
    inspect();
    return () => { recheck.current = null; events.forEach(name => video.removeEventListener(name, inspect)); };
  }, [videoRef]);

  const isRejected = useCallback(() => rejected.current, []);
  const allowProgress = useCallback((duration: number) => !rejected.current && durationVerdict(duration, expected.current) !== "incompatible", []);
  return { ...state, isRejected, allowProgress };
}
