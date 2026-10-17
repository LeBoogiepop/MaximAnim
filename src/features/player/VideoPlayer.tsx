"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { type ReactNode, type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { FRENCH_HUNT, PLAYER, SUBTITLES } from "@/config/app";
import type { StreamSource, SubtitleTrack } from "@/lib/providers/types";
import type { SubtitleRelay, SubtitleReport } from "@/lib/subtitles/load";
import type { SubtitleChoice } from "@/lib/subtitles/select";
import { clampSubtitleHeight, clampSubtitleSize, DEFAULT_SUBTITLE_STYLE, effectiveOutline, normalizeSubtitleStyle, SUBTITLE_STYLE_LABELS, type SubtitleStyle } from "@/lib/subtitles/style";
import { LoadingSpinner, type MenuControl, PlayerControls, type QualityControl } from "./PlayerControls";
import { type SubtitleLook, SubtitleStyleSheet, type TranslationRow } from "./SubtitleStyleSheet";
import { playerQuality } from "./quality";
import { useCueHeight } from "./useCueHeight";
import { useFullscreen } from "./useFullscreen";
import { useSeek } from "./useSeek";
import { type ExternalSubtitleApi } from "@/lib/subtitles/external/remote";
import { useExternalSubtitles } from "./useExternalSubtitles";
import { useSubtitleReport } from "./useSubtitleReport";
import { useSubtitleSelection } from "./useSubtitleSelection";
import { mark } from "@/lib/perf/marks";
import { useDelayedFlag } from "@/hooks/useDelayedFlag";
import { useSubtitleTracks } from "./useSubtitleTracks";
import { useSubtitleTranslation } from "./useSubtitleTranslation";
import { type PersistenceContext, useProgressPersistence } from "./useProgressPersistence";
import { useVideoSource } from "./useVideoSource";
import { useVideoState } from "./useVideoState";
import { usePlaybackValidation } from "./usePlaybackValidation";

export interface VideoPlayerProps {
  /** Independent catalogue runtime in seconds, when known. */
  expectedDurationSeconds?: number | null;
  sources: StreamSource[];
  subtitles: SubtitleTrack[];
  /** CC menu choice (the viewer's preference) and where a new choice goes. */
  subtitleChoice?: SubtitleChoice;
  onSubtitleChoice?: (choice: SubtitleChoice) => void;
  /** The subtitle look (global preferences, edited in the watch page's own sheet): style, size and height. */
  subtitleStyle?: SubtitleStyle;
  subtitleSize?: number;
  subtitleHeight?: number;
  /** The contour: an index into the contour steps, null = the look's own. */
  subtitleOutline?: number | null;
  /** « Apparence » in the CC flow: the stored look, how it changes, and the translation switch (null: no translator, nothing said). */
  appearance?: { look: SubtitleLook; onChange: (patch: Partial<SubtitleLook>) => void; translation: TranslationRow | null } | null;
  /** Source-bound relay for subtitle files the browser cannot read directly (null: none for this playback). */
  /** « Traduire en français si nécessaire »: translate the English track automatically when no French one exists. */
  translateSubtitles?: boolean;
  /** A translator backend really exists. Without one the translation is neither offered nor tried (no action that can only fail). */
  translatorAvailable?: boolean;
  /** French wanted: whether this playback has any (native, external, translated) or definitely none. Reported once decided. */
  onFrenchOutcome?: (outcome: "found" | "none", via: "native" | "external" | "translated" | null) => void;
  subtitleRelay?: SubtitleRelay | null;
  /** What happened to each subtitle track: retrieval, conversion, attached, shown. */
  onSubtitleReport?: (report: SubtitleReport) => void;
  /** Bumped to fetch the subtitles again (a host was just approved) — the video keeps playing. */
  subtitleAttempt?: number;
  /** The anime and episode as AniList knows them: lets an independent provider supply French when the source has none (null: never). */
  externalSubtitles?: { anilistId: number; episode: number; episodeCount: number | null; format: string | null } | null;
  /** Test seam: the external subtitle API. */
  externalSubtitleApi?: ExternalSubtitleApi;
  title: string;
  episodeLabel: string;
  startAt: number;
  playbackRate: number;
  /** Where progress is saved; null = nothing is saved (playback benchmark). */
  persistence: PersistenceContext | null;
  /** Start muted (a benchmark measures, it does not play sound; muted autoplay is also allowed on iOS). */
  muted?: boolean;
  next: { label: string; onPlay: () => void } | null;
  /** Said under the spinner while the first picture is awaited (« Préparation de l'épisode 6… »): a start is never a bare black screen. */
  preparingText?: string;
  /** Countdown UI lives below the picture; playback mechanics stay here. */
  onCountdown?: (seconds: number | null) => void;
  cancelNextRef?: RefObject<(() => void) | null>;
  /** Offered once the start has dragged on: prepares this episode again from scratch (the position is kept by the page). */
  onRecover?: () => void;
  /** Near the end (once per mount), the page refreshes the next episode's preparation. */
  onNearEnd?: () => void;
  /** Offered when this stream cannot play (e.g. another server of the same source). */
  fallback?: { label: string; onSelect: () => void } | null;
  /**
   * The stream's outcome, always reported for each source: it played (native
   * HLS / hls.js / progressive) or it failed (timeout / network / media /
   * unsupported). A stream that played can still fail later (once): that is
   * reported too, so the caller can move on while keeping the position.
   * `detail` is the media-event timeline.
   */
  onStatus?: (status: "ok" | "error", outcome: PlayerOutcome, detail: string) => void;
  /** Current position, reported with each timeupdate (no re-render) — the requested one while a seek is pending. */
  onPosition?: (seconds: number) => void;
  /** Extra control in the overlay's top-right corner (source switch). */
  topRight?: ReactNode;
  topLeft?: ReactNode;
  /** Subtitles blocked only by an unapproved host: the CC opens the authorisation (set by the page, never a notice under the player). */
  subtitleAccess?: { onOpen: () => void } | null;
  /** Separate streams of genuinely different qualities offered by the source (Maximanim controls them). */
  qualityOptions?: QualityControl | null;
  /** Quality the source declared for this single stream, shown as-is. */
  declaredHeight?: number | null;
  /** First decoded frame of this source (time-to-first-frame). */
  onFirstFrame?: () => void;
  /**
   * Decoded resolution, measured on the element (not the source's label):
   * reported when known and whenever it changes during the first
   * `PLAYER.qualityWindowMs` (adaptive HLS may start low and climb).
   */
  onMeasure?: (measure: DecodedQuality) => void;
}

export interface DecodedQuality {
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
  mode: PlayerOutcome;
}

/** A touch that went up and quickly, far enough, mostly vertically: « swipe up ». Pure. */
export function isSwipeUp(from: { x: number; y: number; at: number }, to: { x: number; y: number; at: number }): boolean {
  const dy = from.y - to.y;
  const dx = Math.abs(to.x - from.x);
  return dy >= PLAYER.swipeUpMinPx && to.at - from.at <= PLAYER.swipeUpMaxMs && dx <= dy * PLAYER.swipeUpMaxDrift;
}

export type PlayerOutcome = "native-hls" | "hls.js" | "progressive" | "timeout" | "network" | "media" | "unsupported" | "invalid-media";

const STRATEGY_LABEL: Record<string, string> = { get "native-hls"() { return ui("HLS natif"); }, "hls.js": "hls.js", progressive: "progressif" };
/** Media events worth a line in the diagnostics timeline. */
const TIMELINE_EVENTS = ["loadstart", "loadedmetadata", "canplay", "playing", "waiting", "stalled", "suspend", "error", "emptied"] as const;

type SeekFlash = { side: "left" | "right"; amount: number; id: number } | null;

export function VideoPlayer({ expectedDurationSeconds, sources, subtitles, subtitleChoice = "auto", onSubtitleChoice, subtitleStyle = DEFAULT_SUBTITLE_STYLE, subtitleSize, subtitleHeight, subtitleOutline = null, appearance = null, translateSubtitles = false, translatorAvailable = false, onFrenchOutcome, subtitleRelay = null, onSubtitleReport, subtitleAttempt = 0, externalSubtitles = null, externalSubtitleApi, muted = false, title, episodeLabel, preparingText, onRecover, onNearEnd, onCountdown, cancelNextRef, startAt, playbackRate, persistence, next, fallback = null, onStatus, onPosition, topRight, topLeft, subtitleAccess = null, qualityOptions = null, declaredHeight = null, onFirstFrame, onMeasure }: VideoPlayerProps) {
  useInterfaceLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const source = useVideoSource(videoRef, sources);
  const state = useVideoState(videoRef);
  const validation = usePlaybackValidation(videoRef, expectedDurationSeconds);
  const { isRejected } = validation;
  const toast = useToast();
  const fullscreenUnavailable = useCallback(() => toast(ui("Plein écran indisponible sur cet appareil"), "error"), [toast]);
  const fullscreen = useFullscreen(containerRef, videoRef, fullscreenUnavailable);
  const { tracks, report: subtitleReport, status: subtitleStatus } = useSubtitleTracks(subtitles, subtitleRelay, subtitleAttempt);
  useSubtitleReport(videoRef, tracks, subtitleReport, onSubtitleReport);
  const [observed, setObserved] = useState<{ key: string; width: number; height: number } | null>(null);
  const [notice, setNotice] = useState<{ text: string; id: number } | null>(null);
  const showNotice = useCallback((text: string) => setNotice({ text, id: performance.now() }), []);
  const seek = useSeek(videoRef, showNotice);
  const [localChoice, setLocalChoice] = useState<SubtitleChoice | null>(null);
  const activeChoice = localChoice ?? subtitleChoice;
  // French wanted = Auto (French first) or French: the translation preference only applies then.
  const frenchWanted = activeChoice === "auto" || activeChoice === "fr";
  // An independent provider's French, only when the source has no native French text track and its own subtitles have settled.
  const external = useExternalSubtitles({
    anime: externalSubtitles,
    wanted: frenchWanted && !tracks.some((t) => t.lang === "fr"),
    ready: subtitleStatus !== "loading",
    duration: state.duration || null,
    reference: tracks.find((t) => t.lang === "en" && t.vtt)?.vtt ?? null,
    api: externalSubtitleApi,
  });
  // Native French > external French > the viewer's translation > English. A translation never starts while an external file is still being looked for.
  const withExternal = external.track ? [...tracks, external.track] : tracks;
  const translation = useSubtitleTranslation(withExternal, { auto: translateSubtitles && translatorAvailable && frenchWanted && external.status !== "searching" && external.status !== "loading", title });
  const shownTracks = translation.track ? [...withExternal, translation.track] : withExternal;
  const subtitleMenu = useSubtitleSelection(
    videoRef,
    activeChoice,
    (choice) => {
      setLocalChoice(choice);
      onSubtitleChoice?.(choice);
    },
    translation,
    external,
    translatorAvailable,
  );
  const cueSize = clampSubtitleSize(subtitleSize);
  useCueHeight(videoRef, clampSubtitleHeight(subtitleHeight));
  // Announced (or attached) but not yet a real TextTrack: the CC says "loading" — for a bounded time only. Past
  // SUBTITLES.loadingDisplayMs it says "unavailable" (display only: retrieval goes on, and a track that arrives
  // later still turns this into the real menu).
  const subtitleWaiting = !subtitleMenu && (subtitleStatus === "loading" || (subtitleStatus === "settled" && tracks.length > 0));
  const waitKey = `${subtitleAttempt}#${subtitles.length}`;
  const [expiredKey, setExpiredKey] = useState<string | null>(null);
  useEffect(() => {
    if (!subtitleWaiting) return;
    const timer = setTimeout(() => setExpiredKey(waitKey), SUBTITLES.loadingDisplayMs);
    return () => clearTimeout(timer);
  }, [subtitleWaiting, waitKey]);
  const subtitleExpired = subtitleWaiting && expiredKey === waitKey;
  // A real text track: the menu, with the look group. Announced or attached but not yet a TextTrack: a visible,
  // inert CC (never a fake track). Nothing announced, or settled without a track: no CC.
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const appearanceEntry = appearance ? { summary: SUBTITLE_STYLE_LABELS[normalizeSubtitleStyle(subtitleStyle)], onOpen: () => setAppearanceOpen(true) } : null;
  const subtitleControl: MenuControl | null = subtitleMenu
    ? { ...subtitleMenu, appearance: appearanceEntry, sheet: subtitleMenu.sheet ? { ...subtitleMenu.sheet, appearance: appearanceEntry } : undefined }
    : subtitleExpired
      ? { label: ui("Indisponibles"), items: null, unavailable: true }
      : subtitleWaiting
        ? { label: ui("Chargement"), items: null, loading: true }
        : null;
  // French wanted: does this playback have any, or definitely none? Decided once the source's own subtitles and the
  // external lookup have settled (or the budget lapsed); the caller may then look for French on another source.
  const [frenchBudgetSpent, setFrenchBudgetSpent] = useState(false);
  useEffect(() => {
    if (!onFrenchOutcome || !frenchWanted) return;
    const timer = setTimeout(() => setFrenchBudgetSpent(true), FRENCH_HUNT.settleBudgetMs);
    return () => clearTimeout(timer);
  }, [onFrenchOutcome, frenchWanted]);
  const frenchVia: "native" | "external" | "translated" | null = tracks.some((t) => t.lang === "fr") ? "native" : external.track ? "external" : translation.track ? "translated" : null;
  const hasFrench = frenchVia != null;
  const frenchSettled = subtitleStatus !== "loading" && external.status !== "searching" && external.status !== "loading";
  const frenchOutcome: "found" | "none" | null = !frenchWanted ? null : hasFrench ? "found" : frenchSettled || frenchBudgetSpent ? "none" : null;
  const outcomeRef = useRef(onFrenchOutcome);
  const reportedOutcome = useRef<string | null>(null);
  useEffect(() => {
    outcomeRef.current = onFrenchOutcome;
  }, [onFrenchOutcome]);
  useEffect(() => {
    if (!frenchOutcome || reportedOutcome.current === frenchOutcome) return;
    reportedOutcome.current = frenchOutcome;
    outcomeRef.current?.(frenchOutcome, frenchVia);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frenchOutcome]);
  useProgressPersistence(videoRef, persistence, validation.allowProgress);

  const [controlsVisible, setControlsVisible] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [startupTimeout, setStartupTimeout] = useState(false);
  const timeline = useRef<{ t0: number; lines: string[] }>({ t0: 0, lines: [] });
  const reported = useRef({ ok: false, error: false });
  const statusRef = useRef(onStatus);
  const frameRef = useRef(onFirstFrame);
  const measureRef = useRef(onMeasure);
  useEffect(() => {
    statusRef.current = onStatus;
    frameRef.current = onFirstFrame;
    measureRef.current = onMeasure;
  }, [onStatus, onFirstFrame, onMeasure]);

  // --- Real decoded resolution: element events only (`resize` fires on a rendition
  // change), a running maximum in a closure, no React state — nothing per frame.
  useEffect(() => {
    const video = videoRef.current;
    const mode = source.strategy;
    if (!video || !mode) return;
    let maxWidth = 0;
    let maxHeight = 0;
    let firstAt: number | null = null;
    const measure = () => {
      const { videoWidth: width, videoHeight: height } = video;
      if (!height) return;
      firstAt ??= performance.now();
      if (performance.now() - firstAt > PLAYER.qualityWindowMs) return;
      if (height > maxHeight) {
        maxHeight = height;
        maxWidth = width;
        // Adaptive playback can climb during the window: the label follows, a few updates at most.
        setObserved({ key: mode, width, height });
      }
      measureRef.current?.({ width, height, maxWidth, maxHeight, mode });
    };
    video.addEventListener("loadedmetadata", measure);
    video.addEventListener("resize", measure);
    measure();
    return () => {
      video.removeEventListener("loadedmetadata", measure);
      video.removeEventListener("resize", measure);
    };
  }, [source.strategy]);

  // --- Media-event timeline (diagnostics) + position reporting.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    timeline.current = { t0: performance.now(), lines: [] };
    reported.current = { ok: false, error: false };
    const note = (e: Event) => {
      const tl = timeline.current;
      if (e.type === "loadedmetadata") mark("video-metadata", "player", ui("{0} ms après l'attache", Math.round(performance.now() - tl.t0)));
      if (tl.lines.length < 24) tl.lines.push(`${e.type}${e.type === "error" && video.error ? `(${video.error.code})` : ""} ${Math.round(performance.now() - tl.t0)} ms`);
    };
    // While a seek is pending the requested position is the one to keep (a failover resumes there).
    const onTime = () => { if (!validation.isRejected()) onPosition?.(seek.pendingTarget() ?? video.currentTime); };
    let framed = false;
    const onFrame = () => {
      if (framed || validation.isRejected()) return;
      framed = true;
      frameRef.current?.();
    };
    TIMELINE_EVENTS.forEach((n) => video.addEventListener(n, note));
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadeddata", onFrame);
    video.addEventListener("playing", onFrame);
    return () => {
      TIMELINE_EVENTS.forEach((n) => video.removeEventListener(n, note));
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadeddata", onFrame);
      video.removeEventListener("playing", onFrame);
    };
    // One timeline per attached source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.strategy]);

  const failure: PlayerOutcome | null = validation.rejected ? "invalid-media" : source.error ?? (startupTimeout ? "timeout" : null);

  // --- One "played" and at most one failure per source (a failure can follow a start).
  useEffect(() => {
    const done = reported.current;
    const lines = timeline.current.lines.join(" → ");
    if (failure) {
      if (done.error) return;
      done.error = true;
      statusRef.current?.("error", failure, ui("échec {0}{1} {2}", failure, done.ok ? " en cours de lecture" : "", lines));
      return;
    }
    if (done.ok || !validation.confirmed || !source.strategy) return;
    done.ok = true;
    statusRef.current?.("ok", source.strategy, `${STRATEGY_LABEL[source.strategy]} ${lines}`);
  }, [failure, validation.confirmed, source.strategy]);

  // --- Startup watchdog: a resolved stream must reach metadata, or fail explicitly.
  // Waiting for the user's tap (iOS refused autoplay) is not a failure: the clock restarts on the tap.
  useEffect(() => {
    if (!source.strategy || state.ready || source.error || autoplayBlocked) return;
    const timer = setTimeout(() => setStartupTimeout(true), PLAYER.startupTimeoutMs);
    return () => clearTimeout(timer);
  }, [source.strategy, state.ready, source.error, autoplayBlocked]);
  const [seekFlash, setSeekFlash] = useState<SeekFlash>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapRef = useRef<{ time: number; zone: "left" | "right" | "center"; timer: ReturnType<typeof setTimeout> | null } | null>(null);
  const startedRef = useRef(false);

  // --- Start: ask to play as soon as a source is attached. iOS Safari may not
  // load anything (not even metadata) before playback is requested, so waiting
  // for loadedmetadata could wait forever. Position and speed are applied once
  // metadata arrives.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source.strategy) return;
    startedRef.current = false;
    const onMeta = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      video.defaultPlaybackRate = playbackRate;
      video.playbackRate = playbackRate;
      if (startAt > 0 && startAt < video.duration) seek.seekTo(startAt);
    };
    video.addEventListener("loadedmetadata", onMeta);
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) onMeta();
    video.play().then(
      () => setAutoplayBlocked(false),
      (e: unknown) => {
        // NotAllowedError: iOS refuses unmuted autoplay outside a gesture → big play button.
        // Anything else surfaces through the element's error event.
        if ((e as DOMException)?.name === "NotAllowedError") setAutoplayBlocked(true);
      },
    );
    return () => video.removeEventListener("loadedmetadata", onMeta);
    // Only for a new source: changing speed mid-episode is handled by the controls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.strategy]);

  // --- Controls auto-hide while playing.
  const pokeControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
    }, PLAYER.controlsHideDelayMs);
  }, []);

  // Playing schedules auto-hide. Paused controls remain manually hideable.
  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!state.paused) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), PLAYER.controlsHideDelayMs);
    }
  }, [state.paused]);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (tapRef.current?.timer) clearTimeout(tapRef.current.timer);
    },
    [],
  );

  // --- Actions.
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      setCountdown(null);
      // A tap is a user gesture: loading may start now, so the startup watchdog runs again.
      setAutoplayBlocked(false);
      video.play().catch((e: unknown) => (e as DOMException)?.name === "NotAllowedError" && setAutoplayBlocked(true));
    } else video.pause();
  }, []);

  const positionRef = useRef(onPosition);
  useEffect(() => {
    positionRef.current = onPosition;
  }, [onPosition]);
  const { seekTo: seekToRaw, seekBy: seekByRaw, pendingTarget } = seek;
  const seekTo = useCallback(
    (time: number) => {
      seekToRaw(time);
      const target = pendingTarget();
      if (target != null) positionRef.current?.(target);
    },
    [seekToRaw, pendingTarget],
  );
  const seekBy = useCallback(
    (delta: number) => {
      seekByRaw(delta);
      const target = pendingTarget();
      if (target != null) positionRef.current?.(target);
    },
    [seekByRaw, pendingTarget],
  );

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), PLAYER.noticeMs);
    return () => clearTimeout(t);
  }, [notice]);

  // --- Gestures: single tap toggles controls, double tap on a side seeks.
  // Where the finger went down: a touch that drifted is a drag, not a tap (the surface takes no pan, so it still ends in a pointerup).
  const downAt = useRef<{ x: number; y: number; at: number } | null>(null);
  const overlayShown = useRef(true);
  const modalOpen = () => document.querySelector("dialog[open]") != null;
  const onSurfacePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (modalOpen()) return;
    downAt.current = { x: e.clientX, y: e.clientY, at: performance.now() };
  };
  const onSurfacePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (modalOpen()) { downAt.current = null; return; }
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const down = downAt.current;
    downAt.current = null;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > PLAYER.tapSlopPx) {
      // A touch swipe UP on the picture is the fullscreen button (the same action, started inside this gesture — iPhone needs
      // that). Quick, long enough and mostly vertical: a slow pan or a sideways drag is nothing, and never a tap.
      if (e.pointerType !== "mouse" && isSwipeUp(down, { x: e.clientX, y: e.clientY, at: performance.now() }) && !fullscreen.active && fullscreen.supported && fullscreen.enabled) fullscreen.toggle();
      return;
    }
    // What the viewer SAW when they tapped decides what the tap does: reading the state when the timer fires would flip a tap
    // that landed just as the auto-hide did (hidden by the timer, then « shown » by the tap).
    const hide = overlayShown.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const zone = x < PLAYER.doubleTapZone ? "left" : x > 1 - PLAYER.doubleTapZone ? "right" : "center";
    const now = performance.now();
    const last = tapRef.current;

    if (last && now - last.time < PLAYER.doubleTapWindowMs && last.zone === zone && zone !== "center") {
      if (last.timer) clearTimeout(last.timer);
      const step = zone === "left" ? -PLAYER.seekStepSeconds : PLAYER.seekStepSeconds;
      seekBy(step);
      setSeekFlash((f) => ({ side: zone, amount: f && f.side === zone ? f.amount + PLAYER.seekStepSeconds : PLAYER.seekStepSeconds, id: now }));
      tapRef.current = { time: now, zone, timer: null };
      return;
    }
    if (last?.timer) clearTimeout(last.timer);
    const timer = setTimeout(() => {
      tapRef.current = null;
      if (modalOpen()) return;
      if (hide) {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setControlsVisible(false);
      } else pokeControls();
    }, PLAYER.doubleTapWindowMs);
    tapRef.current = { time: now, zone, timer };
  };

  useEffect(() => {
    if (!seekFlash) return;
    const t = setTimeout(() => setSeekFlash(null), PLAYER.seekHintMs);
    return () => clearTimeout(t);
  }, [seekFlash]);

  // --- End of episode: short, cancellable countdown to the next one.
  const hasNext = next != null;
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasNext) return;
    const onEnded = () => { if (!isRejected()) setCountdown(PLAYER.nextEpisodeCountdownSeconds); };
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, [hasNext, isRejected]);

  useEffect(() => {
    if (countdown == null) return;
    if (countdown <= 0) {
      next?.onPlay();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c == null ? c : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, next]);

  useEffect(() => { onCountdown?.(countdown); }, [countdown, onCountdown]);
  useEffect(() => () => onCountdown?.(null), [onCountdown]);
  useEffect(() => {
    if (!cancelNextRef) return;
    const cancel = () => setCountdown(null);
    cancelNextRef.current = cancel;
    return () => { if (cancelNextRef.current === cancel) cancelNextRef.current = null; };
  }, [cancelNextRef]);

  // The larger « Épisode suivant » treatment appears from here: the page refreshes the next episode's preparation once.
  const nearEnd = hasNext && state.duration > 0 && state.currentTime / state.duration >= PLAYER.nextVisibleFrom;
  const nearEndReported = useRef(false);
  useEffect(() => {
    if (!nearEnd || nearEndReported.current) return;
    nearEndReported.current = true;
    onNearEnd?.();
  }, [nearEnd, onNearEnd]);

  // --- Keyboard (desktop, iPad with keyboard).
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (modalOpen() || e.target instanceof HTMLInputElement || (e.target instanceof Element && e.target.closest("dialog")) || e.altKey || e.metaKey || e.ctrlKey) return;
    const handled: Record<string, () => void> = {
      " ": togglePlay,
      k: togglePlay,
      ArrowLeft: () => seekBy(-PLAYER.seekStepSeconds),
      ArrowRight: () => seekBy(PLAYER.seekStepSeconds),
      j: () => seekBy(-PLAYER.seekStepSeconds),
      l: () => seekBy(PLAYER.seekStepSeconds),
      f: fullscreen.toggle,
    };
    const action = handled[e.key];
    if (action) {
      e.preventDefault();
      action();
      pokeControls();
    }
  };

  // Until the first frame the controls stay up (the source can still be changed while the start drags on); the hide timer
  // only counts once there is a picture to look at.
  const showOverlay = controlsVisible || (!state.framed && !failure && !autoplayBlocked);
  // Touch can arrive immediately after the visibility attribute changes. A passive
  // effect left this snapshot stale, so a tap on hidden controls could hide them again.
  useLayoutEffect(() => {
    overlayShown.current = showOverlay;
  }, [showOverlay]);
  // First load lasts until a frame can be drawn (metadata alone is a black screen); later stalls are "buffering".
  const loading = (state.waiting || !state.framed) && !failure && !autoplayBlocked;
  // A far seek shows where the viewer asked to go, not the old position, until the element gets there.
  const shownState = seek.target != null ? { ...state, currentTime: seek.target } : state;

  // Until the first picture: never a bare black screen. The episode being prepared is named, a long start admits it and offers
  // a fresh try (the source control stays reachable in the corner: the controls are up until the first frame).
  const awaitingPicture = !state.framed && !failure && !autoplayBlocked;
  const startDragging = useDelayedFlag(awaitingPicture, PLAYER.slowPreparationMs);

  const quality = playerQuality({ sourceOptions: qualityOptions, strategy: source.strategy, levels: source.levels, selectedLevel: source.selectedLevel, onLevel: source.setQuality, declaredHeight, observed: observed && observed.key === source.strategy ? observed : null });

  return (
    <div
      ref={containerRef}
      className="player-root relative h-full w-full overflow-hidden bg-black select-none"
      onKeyDown={onKeyDown}
      onPointerMove={(e) => e.pointerType === "mouse" && pokeControls()}
      data-testid="player"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        playsInline
        onPause={() => { setControlsVisible(true); if (hideTimer.current) clearTimeout(hideTimer.current); }}
        muted={muted}
        preload="auto"
        aria-label={`${title}, ${episodeLabel}`}
        data-strategy={source.strategy ?? ""}
        data-cue-style={normalizeSubtitleStyle(subtitleStyle)}
        data-cue-size={cueSize}
        data-cue-outline={effectiveOutline(subtitleStyle, subtitleOutline)}
        x-webkit-airplay="allow"
      >
        {/* No `default` attribute, ever: a provider's default flag is only a hint for Auto (data-source-default). The browser would show a default track by itself, next to the one Maximanim chose. */}
        {shownTracks.map((t) => (
          <track key={t.url} kind="subtitles" src={t.url} srcLang={t.lang} label={t.label} data-source-default={t.default ? "1" : undefined} data-index={t.index} />
        ))}
      </video>

      {/* Gesture surface sits above the video, below the controls. */}
      {/* touch-none: with a pan allowed, a finger that drifts a few points makes iOS start a scroll and cancel the pointer, so the tap never arrives. */}
      <div className="absolute inset-0 touch-none" onPointerDown={onSurfacePointerDown} onPointerUp={onSurfacePointerUp} data-testid="player-surface" aria-hidden="true" />

      {seekFlash && (
        // Just the amount, as quiet text on the side that was tapped: no disc, no gradient, no animation over the picture.
        <p
          key={seekFlash.id}
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm font-medium text-paper/90 tabular-nums drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${seekFlash.side === "left" ? "left-[14%]" : "right-[14%]"}`}
          aria-hidden="true"
          data-testid="seek-hint"
        >
          {seekFlash.side === "left" ? "−" : "+"}
          {seekFlash.amount} s
        </p>
      )}

      {/* One loading state at a time: with the controls shown, the centre button itself becomes the loader. */}
      {loading && !showOverlay && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true" data-testid="player-loading">
          <LoadingSpinner />
        </div>
      )}

      {awaitingPicture && preparingText && (
        <div className="pointer-events-none absolute inset-x-0 top-[calc(50%+2.9rem)] z-[5] flex flex-col items-center gap-1.5 px-6 text-center" role="status" data-testid="player-preparing">
          <p className="text-[13px] text-paper/80">{preparingText}</p>
          {startDragging && (
            <>
              <p className="text-[13px] text-paper/60" data-testid="player-slow">
                {ui("Ça prend un peu plus de temps que prévu.")}</p>
              {onRecover && (
                <button type="button" onClick={onRecover} className="pointer-events-auto min-h-11 rounded-xl border border-white/15 bg-black/50 px-4 text-[14px] font-medium text-paper active:opacity-70" data-testid="player-recover">
                  {ui("Réessayer")}</button>
              )}
            </>
          )}
        </div>
      )}

      {failure && (
        <div role="alert" className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-ink/90 p-6 text-center" data-testid="player-error">
          <p className="font-semibold">
            {failure === "timeout"
              ? ui("Le flux ne démarre pas.")
              : failure === "unsupported" || failure === "media"
                ? typeof navigator !== "undefined" && /Apple/i.test(navigator.vendor)
                  ? ui("La source a renvoyé un flux incompatible avec Safari.")
                  : ui("Ce flux n'est pas lisible sur cet appareil.")
                : ui("Le flux ne se charge pas.")}
          </p>
          <p className="text-sm text-soft">{fallback ? ui("Essaie un autre serveur de cette source.") : ui("Réessaie plus tard ou choisis une autre source.")}</p>
          {fallback && (
            <button type="button" onClick={fallback.onSelect} className="tactile mt-1 min-h-11 rounded-xl bg-accent px-4 text-[15px] font-semibold text-ink">
              {fallback.label}
            </button>
          )}
        </div>
      )}

      {notice && (
        <p key={notice.id} role="status" className="pointer-events-none absolute inset-x-0 top-3 z-30 mx-auto w-fit max-w-[90%] animate-fade-in rounded-lg bg-ink/90 px-3 py-1.5 text-center text-[13px] text-paper" data-testid="player-notice">
          {notice.text}
        </p>
      )}

      {failure && topLeft && <div className="player-top absolute inset-x-0 top-0 z-30 items-start justify-between gap-3 px-3 pb-2">
        <span className="player-back pointer-events-auto">{topLeft}</span>
        {topRight && <span className="pointer-events-auto">{topRight}</span>}
      </div>}
      <PlayerControls
        visible={showOverlay && !failure}
        state={shownState}
        onTogglePlay={togglePlay}
        onSeekBy={seekBy}
        onSeekTo={seekTo}
        onInteract={pokeControls}
        quality={quality}
        subtitles={subtitleControl}
        subtitleAccess={subtitleAccess}
        fullscreen={fullscreen}
        next={next}
        loading={loading ? (state.framed ? "buffering" : "initial") : null}
        context={{ title, episode: episodeLabel }}
        topRight={topRight}
        topLeft={topLeft}
      />

      {appearance && <SubtitleStyleSheet open={appearanceOpen} onClose={() => setAppearanceOpen(false)} look={appearance.look} onChange={appearance.onChange} translation={appearance.translation} />}


    </div>
  );
}
