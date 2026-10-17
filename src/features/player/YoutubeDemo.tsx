"use client";
import { useEffect, useRef, useState } from "react";
import type { DemoSession } from "@/lib/portfolio/demo";
import { savePlaybackSample } from "@/lib/db/progress";
type Player = { getCurrentTime(): number; getDuration(): number; destroy(): void };
type Youtube = { Player: new (element: HTMLElement, config: { videoId: string; width: string; height: string; playerVars: Record<string, string | number>; events: { onReady(): void; onStateChange(event: { data: number }): void; onError(event: { data: number }): void } }) => Player };
declare global { interface Window { YT?: Youtube; onYouTubeIframeAPIReady?: () => void } }
let api: Promise<Youtube> | null = null;
function loadYoutube(): Promise<Youtube> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!api) api = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); if (window.YT) resolve(window.YT); };
    const script = document.createElement("script"); script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => { api = null; script.remove(); reject(new Error("YouTube unavailable")); }; document.head.append(script);
  });
  return api;
}
export function YoutubeDemo({ session, animeId, episodeNumber, onProgress, onUnavailable }: { session: DemoSession; animeId: number; episodeNumber: number; onProgress: (next: DemoSession) => void; onUnavailable?: (code: number) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onProgress);
  const unavailable = useRef(onUnavailable);
  const [failed, setFailed] = useState<number | null>(null);
  const [playerState, setPlayerState] = useState(-1);
  useEffect(() => { callback.current = onProgress; unavailable.current = onUnavailable; });
  useEffect(() => {
    let live = true; let player: Player | undefined; let timer: ReturnType<typeof setInterval> | undefined;
    let pending: Promise<unknown> = Promise.resolve();
    const save = (ended = false) => {
      if (!player) return;
      const position = player.getCurrentTime(); const duration = player.getDuration();
      if (!Number.isFinite(position) || !Number.isFinite(duration) || duration <= 0) return;
      callback.current({ ...session, position, duration, updatedAt: Date.now() });
      if (position >= 1) pending = pending.then(() => savePlaybackSample({ animeId, episodeNumber, providerId: "portfolio-youtube", providerEpisodeId: session.id, currentTime: position, duration, ended, now: Date.now(), completionThreshold: 0.9 })).catch(() => undefined);
    };
    const hidden = () => { if (document.visibilityState === "hidden") save(); };
    const leaving = () => save();
    void loadYoutube().then(YT => {
      if (!live || !host.current) return;
      const mount = document.createElement("div"); host.current.append(mount);
      player = new YT.Player(mount, { videoId: session.id, width: "100%", height: "100%", playerVars: { controls: 1, playsinline: 1, fs: 1, autoplay: 0, origin: window.location.origin, start: Math.floor(session.position) }, events: {
        onReady() { if (live) timer = setInterval(() => save(), 5000); },
        onStateChange(event) { if (live) setPlayerState(event.data); save(event.data === 0); }, onError(event) { if (live) { setFailed(event.data); unavailable.current?.(event.data); } },
      } });
    }).catch(() => { if (live) { setFailed(0); unavailable.current?.(0); } });
    document.addEventListener("visibilitychange", hidden); window.addEventListener("pagehide", leaving);
    return () => { live = false; clearInterval(timer); save(); player?.destroy(); document.removeEventListener("visibilitychange", hidden); window.removeEventListener("pagehide", leaving); };
  }, [session, animeId, episodeNumber]);
  return <><div ref={host} data-youtube-state={playerState} className="aspect-video min-h-[200px] min-w-[200px] w-full bg-black [&_iframe]:h-full [&_iframe]:w-full" aria-label={`YouTube · ${session.title}`} />{failed !== null && <p role="status" data-youtube-error={failed} className="py-3 text-sm text-soft">YouTube est indisponible ici. <a className="text-accent" href={`https://www.youtube.com/watch?v=${session.id}`}>Ouvrir ce vlog sur YouTube</a>, ou choisir la démo HTML5 ci-dessus.</p>}</>;
}
