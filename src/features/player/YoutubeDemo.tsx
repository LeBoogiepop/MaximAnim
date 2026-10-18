"use client";
import { useEffect, useRef, useState } from "react";
import { isCurrentDemo, type DemoSession } from "@/lib/portfolio/demo";
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
export function YoutubeDemo({ session, animeId, episodeNumber, onProgress, onUnavailable }: { session: DemoSession; animeId: number; episodeNumber: number; onProgress: (next: DemoSession) => boolean; onUnavailable?: (code: number) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onProgress);
  const unavailable = useRef(onUnavailable);
  const [playerState, setPlayerState] = useState(-1);
  useEffect(() => { callback.current = onProgress; unavailable.current = onUnavailable; });
  useEffect(() => {
    let live = true; let rejected = false; let ready = false; let player: Player | undefined; let timer: ReturnType<typeof setInterval> | undefined;
    let pending: Promise<unknown> = Promise.resolve();
    // The object returned by `new YT.Player` only gets its methods at `onReady`: leaving the screen before that (Next or Back right
    // after opening an episode) must not read a position from it.
    const save = (ended = false) => {
      if (!player || !ready || rejected) return;
      const position = player.getCurrentTime(); const duration = player.getDuration();
      if (!Number.isFinite(position) || !Number.isFinite(duration) || duration <= 0) return;
      if (!callback.current({ ...session, position, duration, updatedAt: Date.now() })) return;
      if (position >= 1) pending = pending.then(() => isCurrentDemo(session) ? savePlaybackSample({ animeId, episodeNumber, providerId: "portfolio-youtube", providerEpisodeId: session.id, currentTime: position, duration, ended, now: Date.now(), completionThreshold: 0.9 }) : undefined).catch(() => undefined);
    };
    const hidden = () => { if (document.visibilityState === "hidden") save(); };
    const leaving = () => save();
    void loadYoutube().then(YT => {
      if (!live || !host.current) return;
      const mount = document.createElement("div"); host.current.append(mount);
      player = new YT.Player(mount, { videoId: session.id, width: "100%", height: "100%", playerVars: { controls: 1, playsinline: 1, fs: 1, autoplay: 0, origin: window.location.origin, start: Math.floor(session.position) }, events: {
        onReady() { if (live) { ready = true; timer = setInterval(() => save(), 5000); } },
        onStateChange(event) { if (live && !rejected) { setPlayerState(event.data); save(event.data === 0); } },
        onError(event) { if (live && !rejected) { rejected = true; clearInterval(timer); unavailable.current?.(event.data); } },
      } });
    }).catch(() => { if (live && !rejected) { rejected = true; unavailable.current?.(0); } });
    document.addEventListener("visibilitychange", hidden); window.addEventListener("pagehide", leaving);
    return () => { live = false; clearInterval(timer); save(); if (typeof player?.destroy === "function") player.destroy(); document.removeEventListener("visibilitychange", hidden); window.removeEventListener("pagehide", leaving); };
  }, [session, animeId, episodeNumber]);
  return <div ref={host} data-youtube-state={playerState} className="aspect-video min-h-[200px] min-w-[200px] w-full bg-black [&_iframe]:h-full [&_iframe]:w-full" aria-label={`YouTube · ${session.title}`} />;
}
