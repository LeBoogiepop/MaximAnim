"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { Captions, CaptionsOff, Check, ChevronRight, LoaderCircle, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, ShieldQuestion } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { PLAYER } from "@/config/app";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { useDelayedFlag } from "@/hooks/useDelayedFlag";
import { formatTime } from "@/lib/utils/format";
import { SubtitleSheet } from "./SubtitleSheet";
import type { VideoState } from "./useVideoState";

/**
 * Quality as the player can honestly present it: a menu when Maximanim
 * really controls the choice (separate streams from the source, or hls.js
 * levels), a plain label otherwise ("Auto" when the browser adapts by itself).
 */
export interface MenuControl {
  label: string;
  items: { key: string; label: string; checked: boolean; onSelect: () => void; /** Shown, not selectable (a state, not a choice). */ disabled?: boolean; /** Choosing it changes something in place: the menu stays open (offset buttons, a revealed list). */ keepOpen?: boolean }[] | null;
  /** Subtitles: whether a track is currently shown (the icon says so). */
  active?: boolean;
  /** Subtitles announced by the source but no real track yet: a visible, non-interactive CC. */
  loading?: boolean;
  /** Subtitles announced but never became usable within the display bound: a visible, inert, honest CC. */
  unavailable?: boolean;
  /** Titled groups after the choices (other subtitle files, timing offset): only present when they apply. The look is NOT here: it has its own sheet on the watch page. */
  extras?: { title: string; items: NonNullable<MenuControl["items"]> }[];
  /** Phone (touch): the same choices as a bottom sheet, in sections, instead of the popover. */
  sheet?: SubtitleSheetModel;
  /** « Apparence » (size, position, style, contour): the look is part of the CC flow, reached from here (sheet and popover alike). */
  appearance?: AppearanceEntry | null;
}

/** The CC's way into the look: what it says now (« Lisible ») and what opens it. */
export interface AppearanceEntry {
  summary: string;
  onOpen: () => void;
}

/** One row of the phone subtitle sheet. */
export interface SheetChoice {
  key: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

/** What the phone subtitle sheet shows, in sections: language, timing (external file only), other files. */
export interface SubtitleSheetModel {
  languages: SheetChoice[];
  /** Only while an external file is the one shown. */
  sync: { offsetLabel: string; note: string | null; canReset: boolean; earlierLabel: string; laterLabel: string; earlier: () => void; later: () => void; reset: () => void } | null;
  others: { count: number; items: SheetChoice[] } | null;
  appearance?: AppearanceEntry | null;
}

export type QualityControl = MenuControl;

interface Props {
  visible: boolean;
  state: VideoState;
  onTogglePlay: () => void;
  onSeekBy: (delta: number) => void;
  onSeekTo: (time: number) => void;
  onInteract: () => void;
  quality: QualityControl | null;
  /** CC: only when the episode really has subtitles. */
  subtitles: MenuControl | null;
  /** Subtitles blocked only by an unapproved host: the CC becomes the place to authorise them (never a notice under the player). */
  subtitleAccess?: { onOpen: () => void } | null;
  /** `toggle` is synchronous: iPhone's native fullscreen must start inside the tap. */
  fullscreen: { active: boolean; toggle: () => void; supported: boolean; enabled: boolean };
  next: { label: string; onPlay: () => void } | null;
  /** Initial load (nothing decoded yet) or buffering: the centre shows it, in place of play/pause. */
  loading?: "initial" | "buffering" | null;
  /** What is playing, shown quietly at the top in immersive modes (the page header says it the rest of the time). */
  context?: { title: string; episode: string };
  /** Top-right slot (source switch). */
  topRight?: ReactNode;
  topLeft?: ReactNode;
}

/**
 * The player's only loading visual: a plain, discreet spinner, drawn only once a load has lasted long enough to be
 * noticed (a fast start flashes nothing). No logo, never under another icon.
 */
export function LoadingSpinner() {
  useInterfaceLanguage();
  const shown = useDelayedFlag(true, PLAYER.loadingSpinnerDelayMs);
  return shown ? <LoaderCircle size={28} strokeWidth={2} className="animate-spin text-paper/75" data-testid="loading-spinner" aria-hidden="true" /> : <span className="h-7 w-7" aria-hidden="true" />;
}

/**
 * The thin ring around the pause button while buffering mid-play, on the same delay. The button is 50 px on a phone and 62 px from
 * `sm` (the slot is always 62 px), so the ring is sized from the BUTTON, centred in the slot, 6 px wider (about 1.1x) — it used
 * to hug the slot (`-inset-1.5`), which made it about 1.5x the 50 px phone button.
 */
function BufferingRing() {
  useInterfaceLanguage();
  const shown = useDelayedFlag(true, PLAYER.loadingSpinnerDelayMs);
  return shown ? (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <span className="h-14 w-14 animate-spin rounded-full border-2 border-paper/15 border-t-paper/75 sm:h-[68px] sm:w-[68px]" data-testid="loading-spinner" />
    </span>
  ) : null;
}

/**
 * Only what watching needs: −10 / play / +10 in the centre; the timeline,
 * time, subtitles, quality and fullscreen at the bottom; the source in the corner; the
 * next episode once the end is near.
 */
export function PlayerControls(props: Props) {
  useInterfaceLanguage();
  const { visible, state, onInteract } = props;
  const [openMenu, setOpenMenu] = useState<"quality" | "subtitles" | null>(null);
  // Touch screens get the subtitle choices as a bottom sheet; a mouse keeps the popover.
  const coarse = useCoarsePointer();
  const sheetModel = props.subtitles?.sheet ?? null;
  const subtitleSheet = coarse && sheetModel != null;
  const sheetOpen = subtitleSheet && openMenu === "subtitles";
  const menus = { quality: { control: props.quality, title: ui("Qualité"), testId: "quality-menu" }, subtitles: { control: props.subtitles, title: ui("Sous-titres"), testId: "subtitles-menu" } };
  const shownMenu = visible && openMenu && !(openMenu === "subtitles" && subtitleSheet) && menus[openMenu].control?.items ? menus[openMenu] : null;
  const menu = shownMenu != null;
  const toggleMenu = (name: "quality" | "subtitles") => setOpenMenu((o) => (o === name ? null : name));
  // The desktop popover closes like any menu: a press anywhere else (not on the menu, not on a menu button — that one
  // toggles by itself) or Escape. The listeners live only while a popover is open.
  const popoverRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (popoverRef.current?.contains(target) || (target instanceof Element && target.closest("[data-menu-button]"))) return;
      setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  return (
    <>
    <div
      className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      onPointerDown={onInteract}
      data-testid="player-controls"
      data-visible={visible ? "true" : "false"}
      // Hidden controls must not be tappable, nor read out.
      aria-hidden={!visible}
      inert={!visible}
    >
      {/* A light, even scrim for the centre, deeper ones where text and the timeline sit: legible, never heavy. */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      {(props.context || props.topRight || props.topLeft) && (
        <div
          className="player-top absolute inset-x-0 top-0 items-start justify-between gap-3 bg-gradient-to-b from-black/70 via-black/25 to-transparent px-3 pb-10"
        >
          {props.topLeft && <span className="player-back pointer-events-auto shrink-0">{props.topLeft}</span>}
          {props.context ? (
            <div className="min-w-0 flex-1 pt-1.5" data-testid="player-context">
              <p className="truncate text-[12px] leading-4 font-medium tracking-wide text-paper/70">{props.context.episode}</p>
              <p className="truncate text-[16px] leading-6 font-semibold text-paper">{props.context.title}</p>
            </div>
          ) : (
            <span />
          )}
          {props.topRight && <div className="pointer-events-auto ml-auto shrink-0">{props.topRight}</div>}
        </div>
      )}

      <div className="player-bottom absolute inset-x-0 bottom-0 px-3 pb-1">
        <Timeline state={state} onSeekTo={props.onSeekTo} onInteract={onInteract} />
        <div className="flex items-center">
          <span className="px-1 text-[13px] font-medium text-paper tabular-nums" aria-hidden="true">
            {formatTime(state.currentTime)} <span className="text-paper/55">/ {formatTime(state.duration)}</span>
          </span>
          <div className="ml-auto flex items-center">
            {props.subtitleAccess && (!props.subtitles || props.subtitles.unavailable || props.subtitles.loading) ? (
              <BarButton label={ui("Autoriser les sous-titres")} onClick={props.subtitleAccess.onOpen}>
                <span className="flex" data-testid="subtitles-authorize">
                  <ShieldQuestion size={20} aria-hidden="true" />
                </span>
              </BarButton>
            ) : (
              props.subtitles &&
              (props.subtitles.unavailable ? (
                <BarButton label={ui("Sous-titres indisponibles")} onClick={() => undefined} disabled>
                  <span className="flex" data-testid="subtitles-unavailable">
                    <CaptionsOff size={20} aria-hidden="true" />
                  </span>
                </BarButton>
              ) : props.subtitles.loading ? (
                // Announced by the source, not yet a real track: visible, honest, not interactive.
                <BarButton label={ui("Sous-titres en cours de chargement")} onClick={() => undefined} disabled loading>
                  <span className="relative flex" data-testid="subtitles-loading">
                    <Captions size={20} aria-hidden="true" />
                    <LoaderCircle size={11} strokeWidth={3} className="absolute -right-1.5 -bottom-1 animate-spin text-paper" aria-hidden="true" />
                  </span>
                </BarButton>
              ) : (
                <BarButton menuButton label={ui("Sous-titres : {0}", props.subtitles.label)} onClick={() => toggleMenu("subtitles")} expanded={openMenu === "subtitles" && (menu || sheetOpen)}>
                  {props.subtitles.active ? <Captions size={20} aria-hidden="true" /> : <CaptionsOff size={20} aria-hidden="true" />}
                </BarButton>
              ))
            )}
            {props.quality &&
              (props.quality.items ? (
                <BarButton menuButton label={ui("Qualité : {0}", props.quality.label)} onClick={() => toggleMenu("quality")} expanded={openMenu === "quality" && menu}>
                  <span className="text-[13px] font-medium">{props.quality.label}</span>
                </BarButton>
              ) : (
                <span className="px-2 text-[13px] text-paper/70" aria-label={ui("Qualité : {0}", props.quality.label)} data-testid="quality-static">
                  {props.quality.label}
                </span>
              ))}
            {props.fullscreen.supported && (
              <BarButton label={props.fullscreen.active ? ui("Quitter le plein écran") : ui("Plein écran")} onClick={props.fullscreen.toggle} disabled={!props.fullscreen.enabled}>
                {props.fullscreen.active ? <Minimize size={20} aria-hidden="true" /> : <Maximize size={20} aria-hidden="true" />}
              </BarButton>
            )}
          </div>
        </div>
      </div>

      {/* After the bar in the DOM: the centre cluster wins the few pixels where they meet. It is centred on the whole picture, not on what is left above the bar. */}
      {/* A fixed three-column grid: the three slots exist in every state (loading, buffering, paused, playing), so the
          seek buttons never move when the centre goes from spinner to play/pause. Only what is inside a slot changes. */}
      <div
        className={`player-center pointer-events-none absolute inset-0 grid grid-cols-[48px_62px_48px] items-center justify-center justify-items-center gap-x-7 sm:gap-x-14 ${menu ? "invisible" : ""}`}
        data-testid="player-center"
      >
        <div className="flex h-12 w-12 items-center justify-center" data-testid="seek-back-slot">
          {props.loading !== "initial" && (
            <CenterButton label={ui("Reculer de {0} secondes", PLAYER.seekStepSeconds)} onClick={() => props.onSeekBy(-PLAYER.seekStepSeconds)}>
              <SeekGlyph direction={-1} />
            </CenterButton>
          )}
        </div>
        <div className="relative flex h-[62px] w-[62px] items-center justify-center" data-testid="play-slot">
          {props.loading === "initial" ? (
            <span role="status" aria-label={ui("Chargement de la vidéo")} className="flex h-16 w-16 items-center justify-center">
              <LoadingSpinner />
            </span>
          ) : (
            <>
              <CenterButton label={state.paused ? ui("Lecture") : ui("Pause")} onClick={props.onTogglePlay} big>
                {state.paused ? (
                  // Lucide's triangle already sits 1/24 right of the box centre — its optical centre. No extra nudge.
                  <Play size={28} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                ) : (
                  <Pause size={28} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                )}
              </CenterButton>
              {/* Buffering: a thin ring around the button — the control itself stays visible and tappable. */}
              {props.loading === "buffering" && <BufferingRing />}
            </>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center" data-testid="seek-forward-slot">
          {props.loading !== "initial" && (
            <CenterButton label={ui("Avancer de {0} secondes", PLAYER.seekStepSeconds)} onClick={() => props.onSeekBy(PLAYER.seekStepSeconds)}>
              <SeekGlyph direction={1} />
            </CenterButton>
          )}
        </div>
      </div>


      {shownMenu?.control?.items && (
        // Anchored above the bar and capped to the player height: a 16:9 portrait player is short.
        <div ref={popoverRef} className="pointer-events-auto absolute right-3 bottom-[4.75rem] z-20 flex max-h-[calc(100%-5.5rem)] w-48 flex-col overflow-y-auto overscroll-contain rounded-xl border border-hairline bg-raised/95" style={{ right: "max(0.75rem, var(--safe-right))" }} data-testid={shownMenu.testId}>
          {/* Language first; the advanced tools (other files, timing) come last and quieter. */}
          <MenuList title={shownMenu.title} items={shownMenu.control.items} onDone={() => setOpenMenu(null)} />
          {shownMenu.control.extras?.map((extra) => (
            <div key={extra.title} className="contents">
              <div className="mx-3 border-t border-hairline" role="presentation" />
              <MenuList title={extra.title} items={extra.items} onDone={() => setOpenMenu(null)} heading quiet />
            </div>
          ))}
          {shownMenu.control.appearance && (
            <>
              <div className="mx-3 border-t border-hairline" role="presentation" />
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null);
                  shownMenu.control?.appearance?.onOpen();
                }}
                className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-paper active:bg-surface"
                data-testid="subtitles-appearance"
              >
                <span>{ui("Apparence")}</span>
                <span className="flex items-center gap-1 text-soft">
                  {shownMenu.control.appearance.summary}
                  <ChevronRight size={15} aria-hidden="true" />
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
    {subtitleSheet && sheetModel && <SubtitleSheet open={sheetOpen} onClose={() => setOpenMenu(null)} model={sheetModel} />}
    </>
  );
}

function MenuList({ title, items, onDone, heading = false, quiet = false }: { title: string; items: NonNullable<MenuControl["items"]>; onDone: () => void; heading?: boolean; quiet?: boolean }) {
  useInterfaceLanguage();
  return (
    <ul role="menu" aria-label={title} className="py-1">
      {heading && (
        <li role="presentation" className="px-3 pt-1 pb-0.5 text-[11px] font-medium tracking-wide text-soft uppercase" aria-hidden="true">
          {title}
        </li>
      )}
      {items.map((item) => (
        <li role="none" key={item.key}>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={item.checked}
            disabled={item.disabled}
            onClick={() => {
              item.onSelect();
              if (!item.keepOpen) onDone();
            }}
            className={`flex w-full items-center justify-between gap-2 px-3 text-left leading-snug active:bg-surface disabled:text-soft ${quiet ? "min-h-9 py-1 text-[13px] text-soft" : "min-h-11 py-1.5 text-sm text-paper"}`}
          >
            {item.label}
            {item.checked && <Check size={16} className="text-accent" aria-hidden="true" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Timeline({ state, onSeekTo, onInteract }: { state: VideoState; onSeekTo: (t: number) => void; onInteract: () => void }) {
  useInterfaceLanguage();
  const [scrub, setScrub] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seekRef = useRef(onSeekTo);
  useEffect(() => {
    seekRef.current = onSeekTo;
  }, [onSeekTo]);
  const duration = state.duration || 0;
  const value = scrub ?? state.currentTime;
  const pct = duration ? (value / duration) * 100 : 0;
  const bufferedPct = duration ? Math.min(100, (state.bufferedEnd / duration) * 100) : 0;

  // Dragging only previews; the release commits one seek to the final value.
  // The gesture lives in a ref fed by the element's own `input` events, so the
  // commit never reads a React value one render behind. Release is caught
  // however the engine reports it (`change`, pointer/touch end or cancel) and
  // committed exactly once per gesture.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    let drag: number | null = null;
    let lastCommitAt = 0;
    const commit = (time: number) => {
      drag = null;
      lastCommitAt = performance.now();
      seekRef.current(time);
      setScrub(null);
    };
    const onInput = () => {
      drag = Number(input.value);
    };
    const onChange = () => {
      if (drag != null) commit(Number(input.value));
      // A `change` with no drag right after a release is that same gesture: already committed.
      else if (performance.now() - lastCommitAt > 500) commit(Number(input.value));
    };
    const onRelease = () => {
      if (drag != null) commit(drag);
    };
    input.addEventListener("input", onInput);
    input.addEventListener("change", onChange);
    const releases = ["pointerup", "pointercancel", "touchend", "touchcancel"] as const;
    releases.forEach((name) => input.addEventListener(name, onRelease));
    return () => {
      input.removeEventListener("input", onInput);
      input.removeEventListener("change", onChange);
      releases.forEach((name) => input.removeEventListener(name, onRelease));
    };
  }, []);

  // Desktop: the time under the pointer, before any click. Touch shows the dragged time instead (below).
  const [hover, setHover] = useState<number | null>(null);
  const hoverPct = hover != null && duration ? (hover / duration) * 100 : null;
  const bubble = scrub != null ? { pct, time: scrub } : hoverPct != null ? { pct: hoverPct, time: hover! } : null;

  return (
    <div
      className="group/timeline pointer-events-auto relative flex h-11 items-center px-1"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left - 4) / Math.max(1, rect.width - 8)));
        setHover(ratio * duration);
      }}
      onPointerLeave={() => setHover(null)}
      data-testid="timeline"
    >
      <div className="player-timeline-track pointer-events-none absolute inset-x-1 top-1/2 h-[3px] sm:h-1 -translate-y-1/2 overflow-hidden rounded-full bg-paper/25 transition-[height] duration-150 sm:group-hover/timeline:h-1.5">
        <div className="absolute inset-y-0 left-0 bg-paper/35" style={{ width: `${bufferedPct}%` }} data-testid="timeline-buffered" />
        {hoverPct != null && scrub == null && <div className="absolute inset-y-0 left-0 bg-paper/25" style={{ width: `${hoverPct}%` }} />}
        <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${pct}%` }} data-testid="timeline-played" />
      </div>
      <input
        ref={inputRef}
        type="range"
        min={0}
        max={duration || 1}
        step={1}
        value={Math.min(value, duration || 1)}
        disabled={!duration}
        aria-label={ui("Position de lecture")}
        aria-valuetext={ui("{0} sur {1}", formatTime(value), formatTime(duration))}
        onChange={(e) => {
          setScrub(Number(e.target.value));
          onInteract();
        }}
        className="player-range relative h-11 w-full cursor-pointer appearance-none bg-transparent"
      />
      {bubble && (
        <span
          className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-md border border-white/10 bg-ink/90 px-2 py-0.5 text-xs text-paper tabular-nums"
          style={{ left: `clamp(1.5rem, calc(${bubble.pct}% * 0.98 + 1%), calc(100% - 1.5rem))` }}
          data-testid="timeline-time"
        >
          {formatTime(bubble.time)}
        </span>
      )}
    </div>
  );
}

/** ±10: the circular arrow with the step inside it, the convention viewers already read. */
function SeekGlyph({ direction }: { direction: -1 | 1 }) {
  useInterfaceLanguage();
  const Icon = direction < 0 ? RotateCcw : RotateCw;
  return (
    <span className="relative flex items-center justify-center" aria-hidden="true">
      <Icon size={30} strokeWidth={1.6} />
      <span className="absolute pt-[3px] text-[10px] font-semibold tabular-nums">{PLAYER.seekStepSeconds}</span>
    </span>
  );
}

function CenterButton({ label, onClick, children, big = false }: { label: string; onClick: () => void; children: ReactNode; big?: boolean }) {
  useInterfaceLanguage();
  return (
    <button
      type="button"
      aria-label={label}
      data-primary={big || undefined}
      onClick={onClick}
      className={`pointer-events-auto flex items-center justify-center rounded-full transition-[transform,background-color] duration-150 active:scale-95 ${
        big ? "h-[50px] w-[50px] sm:h-[62px] sm:w-[62px] bg-paper text-ink shadow-[0_2px_20px_rgba(0,0,0,0.5)] hover:bg-white" : "h-12 w-12 text-paper drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] hover:bg-white/8"
      }`}
    >
      {children}
    </button>
  );
}

function BarButton({ label, onClick, children, expanded, disabled, loading, menuButton }: { label: string; onClick: () => void; children: ReactNode; expanded?: boolean; disabled?: boolean; loading?: boolean; menuButton?: boolean }) {
  useInterfaceLanguage();
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={expanded}
      data-menu-button={menuButton ? "" : undefined}
      disabled={disabled}
      onClick={onClick}
      aria-busy={loading || undefined}
      className={`pointer-events-auto flex h-11 min-w-11 items-center justify-center px-2 text-paper active:opacity-70 ${loading ? "opacity-70" : "disabled:opacity-40"}`}
    >
      {children}
    </button>
  );
}
