"use client";

import { ui } from "@/lib/i18n/translate";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { PLAYER } from "@/config/app";

/** What a <video> exposes that a seek decision needs (a fake in tests). */
export interface SeekableMedia {
  duration: number;
  readyState: number;
  seekable: TimeRanges;
}

export type SeekPlan = { kind: "seek"; time: number } | { kind: "defer"; time: number } | { kind: "unreachable"; time: number; limit: number };

const HAVE_METADATA = 1;
const HAVE_CURRENT_DATA = 2;

/**
 * Where a requested position can go. The decision is on `seekable`, not
 * `buffered`: an HLS VOD (native or hls.js) and a progressive file served
 * with byte ranges can seek anywhere in their duration, loaded or not. A
 * progressive file without range support is only seekable where it has
 * downloaded — beyond that the seek would be ignored, so it is refused
 * explicitly instead.
 */
export function planSeek(media: SeekableMedia, requested: number): SeekPlan {
  const time = Math.max(0, requested);
  if (media.readyState < HAVE_METADATA || !Number.isFinite(media.duration) || media.duration <= 0) return { kind: "defer", time };
  const target = Math.min(time, Math.max(0, media.duration - PLAYER.seekEndMarginSeconds));
  const ranges = media.seekable;
  // No ranges reported yet (some engines, right after metadata): let the element try.
  if (!ranges || ranges.length === 0) return { kind: "seek", time: target };
  let limit = 0;
  for (let i = 0; i < ranges.length; i++) {
    const start = ranges.start(i);
    const end = ranges.end(i);
    if (target >= start - PLAYER.seekToleranceSeconds && target <= end + PLAYER.seekToleranceSeconds) return { kind: "seek", time: Math.min(Math.max(target, start), end) };
    limit = Math.max(limit, end);
  }
  return { kind: "unreachable", time: target, limit };
}

interface Pending {
  target: number;
  tries: number;
}

type Ref<T> = { current: T };

/** Retry an idle dropped seek once, without restarting an active seek or starving media load. */
function issueSeek(video: HTMLVideoElement, p: Pending, pending: Ref<Pending | null>, timer: Ref<ReturnType<typeof setTimeout> | null>): void {
  p.tries++;
  video.currentTime = p.target;
  if (timer.current) clearTimeout(timer.current);
  let waited = 0;
  const check = () => {
    if (pending.current !== p || p.tries >= 2) return;
    waited += PLAYER.seekRetryMs;
    // A far seek may still be fetching/decoding. A second currentTime write
    // can supersede that work; elapsed wall time alone is not a dropped seek.
    // But an active seek that has shown nothing for the whole patience window is stuck: it is issued once more.
    if ((video.seeking || video.readyState < HAVE_CURRENT_DATA) && waited < PLAYER.seekPatienceMs) {
      timer.current = setTimeout(check, PLAYER.seekRetryMs);
      return;
    }
    issueSeek(video, p, pending, timer);
  };
  timer.current = setTimeout(check, PLAYER.seekRetryMs);
}

/**
 * One robust seek at a time:
 * - the requested position is what the UI shows until the element gets there
 *   (no snapping back to the old time while a far seek loads);
 * - a seek the engine drops (iOS, far into an unloaded area) or lands far
 *   from is issued once more, then reported instead of silently ignored;
 * - a seek asked before metadata, or across a source reload (failover,
 *   quality switch), is applied as soon as the new media can take it;
 * - nothing is issued per slider movement: callers commit once.
 */
export function useSeek(videoRef: RefObject<HTMLVideoElement | null>, notify: (message: string) => void) {
  const pending = useRef<Pending | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  const clear = useCallback(() => {
    pending.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setTarget(null);
  }, []);

  const issue = useCallback((video: HTMLVideoElement, p: Pending) => issueSeek(video, p, pending, timer), []);

  const seekTo = useCallback(
    (requested: number) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(requested)) return;
      const plan = planSeek(video, requested);
      if (plan.kind === "unreachable") {
        notifyRef.current(ui("Cette source ne permet pas encore d'aller à cette position."));
        return;
      }
      const p: Pending = { target: plan.time, tries: 0 };
      pending.current = p;
      setTarget(plan.time);
      if (plan.kind === "seek") issue(video, p);
    },
    [videoRef, issue],
  );

  /** Relative to where the viewer asked to be (two quick +10 make +20, even mid-seek). */
  const seekBy = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video) return;
      seekTo((pending.current?.target ?? video.currentTime) + delta);
    },
    [videoRef, seekTo],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const near = () => pending.current != null && Math.abs(video.currentTime - pending.current.target) <= PLAYER.seekToleranceSeconds;
    const onSeeked = () => {
      const p = pending.current;
      if (!p) return;
      // A queued event can belong to the seek superseded by a newer user request.
      if (video.seeking) return;
      // Close enough (the engine snapped to a keyframe or segment): landed.
      if (Math.abs(video.currentTime - p.target) <= PLAYER.seekAcceptSeconds) return clear();
      // A temporary landing without current data is not yet a stable failure.
      if (video.readyState < HAVE_CURRENT_DATA) return;
      // Landed far from it (the engine jumped back): once more, then say so.
      if (p.tries < 2) return issue(video, p);
      clear();
      notifyRef.current(ui("La source n'a pas pu aller à cette position."));
    };
    const onTime = () => {
      if (!video.seeking && near()) clear();
    };
    // New media (first metadata, failover, quality switch): a requested position still applies.
    const onMetadata = () => {
      const p = pending.current;
      if (!p) return;
      const plan = planSeek(video, p.target);
      if (plan.kind === "unreachable") {
        clear();
        notifyRef.current(ui("Cette source ne permet pas encore d'aller à cette position."));
      } else if (plan.kind === "seek") {
        p.target = plan.time;
        p.tries = 0;
        issue(video, p);
      }
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onMetadata);
    return () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onMetadata);
    };
  }, [videoRef, clear, issue]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const pendingTarget = useCallback(() => pending.current?.target ?? null, []);

  return { seekTo, seekBy, target, pendingTarget };
}
