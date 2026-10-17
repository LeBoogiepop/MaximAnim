"use client";

import { type RefObject, useEffect, useState } from "react";

export interface VideoState {
  paused: boolean;
  ended: boolean;
  waiting: boolean;
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  playbackRate: number;
  ready: boolean;
  /** A frame can be shown (readyState ≥ HAVE_CURRENT_DATA, or playing). Metadata alone is not a picture. */
  framed: boolean;
}

const INITIAL: VideoState = {
  paused: true,
  ended: false,
  waiting: false,
  currentTime: 0,
  duration: 0,
  bufferedEnd: 0,
  playbackRate: 1,
  ready: false,
  framed: false,
};

const EVENTS = [
  "play",
  "pause",
  "playing",
  "waiting",
  "seeking",
  "seeked",
  "timeupdate",
  "durationchange",
  "loadedmetadata",
  "loadeddata",
  "canplay",
  "progress",
  "ratechange",
  "ended",
  "emptied",
] as const;

/** Mirrors the <video> element's state into React at the rate the browser reports it (~4 Hz). */
export function useVideoState(videoRef: RefObject<HTMLVideoElement | null>): VideoState {
  const [state, setState] = useState(INITIAL);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const read = (e?: Event) => {
      const buffered = video.buffered;
      let bufferedEnd = 0;
      for (let i = 0; i < buffered.length; i++) {
        if (buffered.start(i) <= video.currentTime + 0.5) bufferedEnd = Math.max(bufferedEnd, buffered.end(i));
      }
      setState((prev) => ({
        paused: video.paused,
        ended: video.ended,
        waiting: e?.type === "waiting" || e?.type === "seeking" ? true : e?.type === "playing" || e?.type === "canplay" || e?.type === "seeked" || e?.type === "pause" ? false : prev.waiting,
        currentTime: video.currentTime,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        bufferedEnd,
        playbackRate: video.playbackRate,
        ready: e?.type === "emptied" ? false : prev.ready || video.readyState >= HTMLMediaElement.HAVE_METADATA,
        framed: e?.type === "emptied" ? false : prev.framed || e?.type === "playing" || video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA,
      }));
    };
    EVENTS.forEach((name) => video.addEventListener(name, read));
    read();
    return () => EVENTS.forEach((name) => video.removeEventListener(name, read));
  }, [videoRef]);

  return state;
}
