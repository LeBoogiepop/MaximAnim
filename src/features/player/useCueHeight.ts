"use client";

import { type RefObject, useEffect } from "react";
import { applyCueHeight } from "@/lib/subtitles/cue-line";

/**
 * Keeps the viewer's subtitle height on the live cues (`VTTCue.line`, see `lib/subtitles/cue-line.ts`). Cues exist only
 * once a track has loaded, so it re-applies when a `<track>` finishes loading, when the list changes, and shortly after
 * (a browser may reload cues when a track becomes `showing`). Nothing is rebuilt, nothing is drawn over the video.
 */
export function useCueHeight(videoRef: RefObject<HTMLVideoElement | null>, height: number): void {
  useEffect(() => {
    const video = videoRef.current;
    const list = video?.textTracks;
    if (!video || typeof list?.addEventListener !== "function") return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const apply = () => applyCueHeight(Array.from(list), height);
    const bind = () => video.querySelectorAll("track").forEach((el) => el.addEventListener("load", apply));
    const onChange = () => {
      bind();
      apply();
      timers.push(setTimeout(apply, 0), setTimeout(apply, 300));
    };
    onChange();
    list.addEventListener("addtrack", onChange);
    list.addEventListener("change", apply);
    return () => {
      list.removeEventListener("addtrack", onChange);
      list.removeEventListener("change", apply);
      video.querySelectorAll("track").forEach((el) => el.removeEventListener("load", apply));
      timers.forEach(clearTimeout);
    };
  }, [videoRef, height]);
}
