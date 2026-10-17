"use client";

import { useEffect, useRef, useState } from "react";
import type { SubtitleTrack } from "@/lib/providers/types";
import { loadSubtitles, type SubtitleRelay, type SubtitleReport } from "@/lib/subtitles/load";

/**
 * Presentation only: none announced, announced and still being fetched, or settled.
 * Read by the CC button; nothing here drives retrieval, retries or tracks.
 */
export type SubtitleStatus = "none" | "loading" | "settled";

/** A usable track, with its position in the provider's list (and in the report). */
export type AttachedTrack = SubtitleTrack & { index: number; /** The converted WebVTT behind the blob URL (input of a translation). */ vtt?: string };

/**
 * The source's subtitles, ready for <track>: fetched here (directly, else
 * through the source-bound relay), converted to WebVTT when the source hands
 * out SubRip or ASS/SSA, and attached as blob URLs. The viewer never touches a
 * subtitle file, and a track that cannot be used is reported, never dropped
 * silently (`report`).
 *
 * Why fetch instead of pointing <track> at the URL: cross-origin <track>
 * elements only load when the <video> itself is `crossorigin` — which then
 * forces CORS on every playlist and segment of the stream, and silently breaks
 * native HLS on CDNs that do not send CORS headers. So the video never gets
 * `crossorigin`. Subtitle trouble never touches the video.
 */
export function useSubtitleTracks(subtitles: SubtitleTrack[], relay: SubtitleRelay | null = null, attempt = 0): { tracks: AttachedTrack[]; report: SubtitleReport | null; status: SubtitleStatus } {
  const list = subtitles.map((s) => s.url).join("|");
  // `attempt` retries retrieval only (after a host was approved): the video is not touched,
  // and tracks already attached stay on until the new result replaces them.
  const key = `${attempt}#${list}`;
  const [state, setState] = useState<{ key: string; list: string; tracks: AttachedTrack[]; report: SubtitleReport | null }>({ key: "", list: "", tracks: [], report: null });
  const relayRef = useRef(relay);
  useEffect(() => {
    relayRef.current = relay;
  }, [relay]);
  // Blob URLs currently on the element: revoked once replaced (or on unmount), never while shown.
  const live = useRef<string[]>([]);
  useEffect(
    () => () => {
      for (const u of live.current) URL.revokeObjectURL(u);
      live.current = [];
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    const current = relayRef.current;
    void loadSubtitles(subtitles, { relay: current ? (urls, signal) => current(urls, signal) : null, signal: controller.signal })
      .then(({ loaded, report }) => {
        if (controller.signal.aborted) return;
        const created: string[] = [];
        const tracks = loaded.flatMap((l, index) => {
          if (!l) return [];
          const blob = URL.createObjectURL(new Blob([l.vtt], { type: "text/vtt" }));
          created.push(blob);
          return [{ ...l.track, url: blob, index, vtt: l.vtt }];
        });
        const previous = live.current;
        live.current = created;
        setState({ key, list, tracks, report });
        // After React has swapped the <track> elements.
        setTimeout(() => previous.forEach((u) => URL.revokeObjectURL(u)), 0);
      })
      .catch(() => undefined);
    return () => controller.abort();
    // `key` captures the subtitle list's identity and the retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (state.list !== list) return { tracks: [], report: null, status: subtitles.length ? "loading" : "none" };
  // A retry in flight (after an approval) keeps the tracks already attached; it only counts as loading while there are none.
  const status: SubtitleStatus = !subtitles.length ? "none" : state.key !== key && !state.tracks.length ? "loading" : "settled";
  return { tracks: state.tracks, report: state.report, status };
}
