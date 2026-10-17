"use client";

import type Hls from "hls.js";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { StreamSource } from "@/lib/providers/types";

export type PlaybackStrategy = "native-hls" | "hls.js" | "progressive";

export interface QualityLevel {
  /** hls.js level index. */
  index: number;
  height: number;
  bitrate: number;
  label: string;
}

export type SourceError = "unsupported" | "network" | "media";

export interface SourceState {
  strategy: PlaybackStrategy | null;
  error: SourceError | null;
  /** Only filled when qualities are genuinely controllable (hls.js). */
  levels: QualityLevel[];
  /** -1 = automatic. */
  selectedLevel: number;
  /** Level actually playing, for the "Auto (720p)" label. */
  activeLevel: number;
}

const INITIAL: SourceState = { strategy: null, error: null, levels: [], selectedLevel: -1, activeLevel: -1 };

const PROGRESSIVE_MIME: Record<Exclude<StreamSource["type"], "hls">, string[]> = {
  mp4: ['video/mp4; codecs="avc1.4D401E, mp4a.40.2"', "video/mp4"],
  webm: ['video/webm; codecs="vp9, opus"', 'video/webm; codecs="vp8, vorbis"', "video/webm"],
};

function canPlayNativeHls(video: HTMLVideoElement): boolean {
  return video.canPlayType("application/vnd.apple.mpegurl") !== "";
}

function isAppleWebKit(): boolean {
  return typeof navigator !== "undefined" && /Apple/i.test(navigator.vendor);
}

function playableProgressive(video: HTMLVideoElement, sources: StreamSource[]): StreamSource[] {
  return sources.filter((s) => s.type !== "hls" && PROGRESSIVE_MIME[s.type].some((mime) => video.canPlayType(mime) !== ""));
}

const MAX_NETWORK_RECOVERIES = 2;

/**
 * Attaches the best playable source to the <video>:
 * 1. Safari/iOS → native HLS (Apple's ABR, AirPlay, fullscreen all just work);
 * 2. elsewhere → hls.js, loaded on demand so it never weighs on other routes;
 * 3. otherwise → a progressive MP4/WebM the browser says it can decode.
 */
export function useVideoSource(videoRef: RefObject<HTMLVideoElement | null>, sources: StreamSource[] | null) {
  const [state, setState] = useState<SourceState>(INITIAL);
  const hlsRef = useRef<Hls | null>(null);
  const key = sources?.map((s) => `${s.type}:${s.url}`).join("|") ?? "";

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sources?.length) return;
    let cancelled = false;
    let progressiveQueue: StreamSource[] = [];

    const set = (patch: Partial<SourceState>) => {
      if (!cancelled) setState((s) => ({ ...s, ...patch }));
    };

    const playNextProgressive = (): boolean => {
      const next = progressiveQueue.shift();
      if (!next) return false;
      video.src = next.url;
      video.load();
      set({ strategy: "progressive", error: null, levels: [], selectedLevel: -1, activeLevel: -1 });
      return true;
    };

    const onVideoError = () => {
      // hls.js reports its own errors; this handles native HLS and progressive files.
      if (hlsRef.current) return;
      if (!playNextProgressive()) set({ error: video.error?.code === MediaError.MEDIA_ERR_NETWORK ? "network" : "media" });
    };
    video.addEventListener("error", onVideoError);

    const hlsSource = sources.find((s) => s.type === "hls");
    progressiveQueue = playableProgressive(video, sources);
    setState(INITIAL);

    const attachHlsJs = async (url: string): Promise<boolean> => {
      const { default: HlsCtor } = await import("hls.js");
      if (cancelled || !HlsCtor.isSupported()) return false;
      const hls = new HlsCtor({ enableWorker: true, backBufferLength: 60, capLevelToPlayerSize: true });
      hlsRef.current = hls;
      let networkRecoveries = 0;
      let mediaRecovered = false;
      hls.on(HlsCtor.Events.MANIFEST_PARSED, (_e, data) => {
        const levels = data.levels
          .map((l, index) => ({ index, height: l.height, bitrate: l.bitrate, label: l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)} kb/s` }))
          .sort((a, b) => b.height - a.height);
        set({ levels: levels.length > 1 ? levels : [] });
      });
      hls.on(HlsCtor.Events.LEVEL_SWITCHED, (_e, data) => set({ activeLevel: data.level }));
      hls.on(HlsCtor.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        if (data.type === HlsCtor.ErrorTypes.NETWORK_ERROR && networkRecoveries < MAX_NETWORK_RECOVERIES) {
          networkRecoveries++;
          hls.startLoad();
        } else if (data.type === HlsCtor.ErrorTypes.MEDIA_ERROR && !mediaRecovered) {
          mediaRecovered = true;
          hls.recoverMediaError();
        } else {
          hls.destroy();
          hlsRef.current = null;
          if (!playNextProgressive()) set({ error: data.type === HlsCtor.ErrorTypes.NETWORK_ERROR ? "network" : "media" });
        }
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      set({ strategy: "hls.js", error: null });
      return true;
    };

    void (async () => {
      if (hlsSource) {
        const native = canPlayNativeHls(video);
        if (native && (isAppleWebKit() || typeof MediaSource === "undefined")) {
          video.src = hlsSource.url;
          set({ strategy: "native-hls" });
          return;
        }
        try {
          if (await attachHlsJs(hlsSource.url)) return;
        } catch {
          // hls.js failed to load (offline chunk?) — fall through.
        }
        if (cancelled) return;
        if (native) {
          video.src = hlsSource.url;
          set({ strategy: "native-hls" });
          return;
        }
      }
      if (!playNextProgressive()) set({ error: "unsupported" });
    })();

    return () => {
      cancelled = true;
      video.removeEventListener("error", onVideoError);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
    // `key` captures the sources' identity; the array itself changes on every render upstream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, videoRef]);

  const setQuality = useCallback((index: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = index;
    setState((s) => ({ ...s, selectedLevel: index }));
  }, []);

  return { ...state, setQuality };
}
