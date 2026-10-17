"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { PLAYER } from "@/config/app";

/** Vendor-prefixed APIs still needed for Safari. */
interface WebKitDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
}
interface WebKitElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}
export interface WebKitVideo extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
  /** iOS: false until the video's metadata is loaded. */
  webkitSupportsFullscreen?: boolean;
}
interface LockableOrientation extends ScreenOrientation {
  lock?: (orientation: "landscape") => Promise<void>;
}

export type FullscreenPath = "video" | "container" | "none";

/** What this browser can really do, by feature detection (the one user-agent test is iPhone, below). */
export interface FullscreenEnv {
  /** iPhone / iPod touch: only a <video> can go fullscreen, in Apple's own player. */
  iPhone: boolean;
  /** The Fullscreen API is enabled and the container can request it. */
  container: boolean;
  /** `video.webkitEnterFullscreen` exists. */
  video: boolean;
  /** `screen.orientation.lock` exists (absent on every iPhone Safari, present on Android Chrome). */
  orientationLock?: boolean;
}

/**
 * Which fullscreen to use. iPhone: Apple's native video player, always and
 * first — the container API may be advertised there, but a <div> is refused.
 * Everywhere else (desktop, Android, iPad): the container, so our controls stay;
 * the video-only API is the fallback.
 */
export function fullscreenPath(env: FullscreenEnv): FullscreenPath {
  if (env.iPhone && env.video) return "video";
  if (env.container) return "container";
  return env.video ? "video" : "none";
}

/**
 * An orientation lock is only attempted on the container path, and only where
 * the API exists. iPhone's native player turns with the phone; nothing here
 * pretends otherwise.
 */
export function shouldLockOrientation(path: FullscreenPath, env: FullscreenEnv): boolean {
  return path === "container" && env.orientationLock === true;
}

/** iPadOS reports itself as a Mac: only iPhone/iPod user agents count as iPhone. */
export function isIPhone(userAgent: string): boolean {
  return /\b(iPhone|iPod)\b/.test(userAgent);
}

function fullscreenElement(): Element | null {
  const d = document as WebKitDocument;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

function orientation(): LockableOrientation | undefined {
  return typeof screen === "undefined" ? undefined : (screen.orientation as LockableOrientation | undefined);
}

/** Best effort, never fatal: a refused or unsupported lock leaves plain fullscreen. Resolves whether it locked. */
export async function lockLandscape(): Promise<boolean> {
  try {
    const o = orientation();
    if (typeof o?.lock !== "function") return false;
    await o.lock("landscape");
    return true;
  } catch {
    return false;
  }
}

/** Best effort; only called for a lock this fullscreen took. */
export function unlockOrientation(): void {
  try {
    orientation()?.unlock?.();
  } catch {
    // Nothing to undo.
  }
}

function environment(container: WebKitElement | null, video: WebKitVideo | null): FullscreenEnv {
  const d = document as WebKitDocument;
  return {
    iPhone: typeof navigator !== "undefined" && isIPhone(navigator.userAgent),
    container: Boolean(container && (d.fullscreenEnabled || d.webkitFullscreenEnabled) && (container.requestFullscreen || container.webkitRequestFullscreen)),
    video: typeof video?.webkitEnterFullscreen === "function",
    orientationLock: typeof orientation()?.lock === "function",
  };
}

/** Native video fullscreen; false when the element refuses (e.g. before metadata on iOS). */
function enterVideoFullscreen(video: WebKitVideo | null): boolean {
  if (!video?.webkitEnterFullscreen || video.webkitSupportsFullscreen === false) return false;
  try {
    video.webkitEnterFullscreen();
    return true;
  } catch {
    return false;
  }
}

/**
 * Fullscreen that works on every device: `toggle` is synchronous so, on
 * iPhone, `webkitEnterFullscreen()` runs inside the tap itself (no await
 * before it: the user activation is kept). A refused standard request falls
 * back to the video's own fullscreen, or reports it unavailable — never a
 * silent no-op. A landscape lock is a bonus taken only after the container is
 * really fullscreen, where the API exists; it never decides anything.
 */
export function useFullscreen(containerRef: RefObject<HTMLElement | null>, videoRef: RefObject<HTMLVideoElement | null>, onUnavailable?: () => void) {
  const [active, setActive] = useState(false);
  const [path, setPath] = useState<FullscreenPath>("none");
  // iOS answers `webkitSupportsFullscreen = false` until metadata is loaded.
  const [ready, setReady] = useState(false);
  // An enter request is in flight until the browser confirms it (or this long): a double tap must not toggle twice.
  const settling = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Whether this fullscreen took an orientation lock (only then is it released).
  const locked = useRef(false);

  useEffect(() => {
    const video = videoRef.current as WebKitVideo | null;
    setPath(fullscreenPath(environment(containerRef.current as WebKitElement | null, video)));
    const release = () => {
      if (!locked.current) return;
      locked.current = false;
      unlockOrientation();
    };
    const sync = () => {
      if (settling.current) clearTimeout(settling.current);
      settling.current = null;
      const isActive = fullscreenElement() != null || Boolean(video?.webkitDisplayingFullscreen);
      setActive(isActive);
      if (!isActive) release();
    };
    const onMeta = () => setReady(video?.webkitSupportsFullscreen !== false);
    onMeta();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    video?.addEventListener("webkitbeginfullscreen", sync);
    video?.addEventListener("webkitendfullscreen", sync);
    video?.addEventListener("loadedmetadata", onMeta);
    video?.addEventListener("emptied", onMeta);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      video?.removeEventListener("webkitbeginfullscreen", sync);
      video?.removeEventListener("webkitendfullscreen", sync);
      video?.removeEventListener("loadedmetadata", onMeta);
      video?.removeEventListener("emptied", onMeta);
      if (settling.current) clearTimeout(settling.current);
      settling.current = null;
      release();
    };
  }, [containerRef, videoRef]);

  const toggle = useCallback((): void => {
    const d = document as WebKitDocument;
    const container = containerRef.current as WebKitElement | null;
    const video = videoRef.current as WebKitVideo | null;
    const settle = () => {
      if (settling.current) clearTimeout(settling.current);
      settling.current = setTimeout(() => {
        settling.current = null;
      }, PLAYER.fullscreenSettleMs);
    };
    const unsettle = () => {
      if (settling.current) clearTimeout(settling.current);
      settling.current = null;
    };

    // Leaving.
    if (video?.webkitDisplayingFullscreen) {
      video.webkitExitFullscreen?.();
      return;
    }
    if (fullscreenElement()) {
      void Promise.resolve(d.exitFullscreen?.() ?? d.webkitExitFullscreen?.()).catch(() => undefined);
      return;
    }
    // Entering: the browser has not answered the previous request yet.
    if (settling.current) return;

    const env = environment(container, video);
    const plan = fullscreenPath(env);
    if (plan === "video") {
      // Synchronous, straight from the gesture.
      if (enterVideoFullscreen(video)) settle();
      else onUnavailable?.();
      return;
    }
    if (plan === "none" || !container) {
      onUnavailable?.();
      return;
    }
    const fallback = () => {
      unsettle();
      if (enterVideoFullscreen(video)) settle();
      else onUnavailable?.();
    };
    let request: Promise<void> | void;
    try {
      request = container.requestFullscreen ? container.requestFullscreen({ navigationUI: "hide" }) : container.webkitRequestFullscreen?.();
    } catch {
      fallback();
      return;
    }
    settle();
    void Promise.resolve(request).then(async () => {
      if (!shouldLockOrientation(plan, env) || !fullscreenElement()) return;
      locked.current = await lockLandscape();
      // The exit came while the lock was settling: release it now.
      if (locked.current && !fullscreenElement()) {
        locked.current = false;
        unlockOrientation();
      }
    }, fallback);
  }, [containerRef, videoRef, onUnavailable]);

  return { active, toggle, supported: path !== "none", enabled: path !== "video" || ready, path };
}
