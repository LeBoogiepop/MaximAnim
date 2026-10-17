"use client";

import { type RefObject, useEffect, useRef } from "react";
import type { SubtitleReport } from "@/lib/subtitles/load";
import type { AttachedTrack } from "./useSubtitleTracks";

const TRACK_ERROR = 3;
const TRACK_LOADED = 2;

/**
 * Completes the retrieval report with what the element really did: is each
 * converted track on the <video>, did the engine accept it, is it showing.
 * Listens to the element's own events (track load/error, text-track changes);
 * nothing is polled.
 */
export function useSubtitleReport(videoRef: RefObject<HTMLVideoElement | null>, tracks: AttachedTrack[], base: SubtitleReport | null, onReport?: (report: SubtitleReport) => void): void {
  const reportRef = useRef(onReport);
  useEffect(() => {
    reportRef.current = onReport;
  }, [onReport]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !base) return;
    let last = "";
    const emit = () => {
      const elements = Array.from(video.querySelectorAll("track"));
      const report: SubtitleReport = {
        provided: base.provided,
        tracks: base.tracks.map((d, i) => {
          if (d.conversion !== "ok") return d;
          const el = elements.find((e) => e.dataset.index === String(i));
          if (!el) return { ...d, attached: false, visible: null, outcome: "pending" as const };
          // Engines without the track API (jsdom) cannot say more than "on the element".
          const readyState = typeof el.readyState === "number" ? el.readyState : null;
          if (readyState === TRACK_ERROR) return { ...d, attached: false, visible: false, outcome: "rejected" as const };
          const mode = el.track?.mode;
          const visible = mode == null || readyState == null ? null : mode === "showing" && readyState === TRACK_LOADED;
          return { ...d, attached: true, visible, outcome: "attached" as const };
        }),
      };
      const json = JSON.stringify(report);
      if (json === last) return;
      last = json;
      reportRef.current?.(report);
    };
    emit();
    // `load`/`error` of <track> do not bubble: listen in the capture phase.
    video.addEventListener("load", emit, true);
    video.addEventListener("error", emit, true);
    const list = video.textTracks;
    const canListen = typeof list?.addEventListener === "function";
    if (canListen) {
      list.addEventListener("change", emit);
      list.addEventListener("addtrack", emit);
    }
    return () => {
      video.removeEventListener("load", emit, true);
      video.removeEventListener("error", emit, true);
      if (canListen) {
        list.removeEventListener("change", emit);
        list.removeEventListener("addtrack", emit);
      }
    };
  }, [videoRef, tracks, base]);
}
