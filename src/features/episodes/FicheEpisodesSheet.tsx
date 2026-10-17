"use client";

import { ArrowDownWideNarrow, ArrowRight, ArrowUpNarrowWide, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { IconButton } from "@/components/ui/Button";
import { ConfirmSheet } from "@/components/ui/Sheet";
import { attachSheetDrag, SHEET_GRIP_ATTR } from "@/components/ui/sheet-drag";
import { useToast } from "@/components/ui/Toast";
import { EPISODE_NAV } from "@/config/app";
import { findEpisodeNumber, scrollTopFor, visibleWindow } from "@/features/player/episode-window";
import { episodePlaybackBlocked } from "@/lib/airing/availability";
import type { EpisodePreview } from "@/lib/anilist/episodes";
import { upsertAnimeSummary } from "@/lib/db/library";
import { markEpisodesCompleted } from "@/lib/db/progress";
import type { ProgressRecord } from "@/lib/db/types";
import { ui, localizeOwnedText } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { episodeArtworkAllowed, firstUnwatchedEpisode } from "@/lib/progress/logic";
import { formatEpisodeNumber, type EpisodeItem } from "@/lib/providers/episodes";
import { routes } from "@/lib/utils/routes";
import type { Anime, TitlePreference } from "@/types/anime";
import { EpisodeRow } from "./EpisodeRow";
import { useEpisodeSeenToggle } from "./EpisodeSheet";
import { useEpisodeWatchedAction } from "./useEpisodeWatchedAction";

export interface FicheEpisodesSheetProps {
  open: boolean;
  onClose: () => void;
  anime: Anime;
  /** Every episode of this entry (AniList's own next one is never part of it). */
  episodes: readonly EpisodeItem[];
  progress: readonly ProgressRecord[] | undefined;
  /** The airing clock the fiche already runs. */
  now: number;
  /** The episode to start or resume, and what its row says. */
  current: number | null;
  currentLabel: string | null;
  /** The previews the fiche already has: the sheet draws exactly what the fiche draws. */
  previews: readonly EpisodePreview[];
  settling: boolean;
  titleLanguage: TitlePreference;
  initialReverse?: boolean;
  /** A finger went down on a row: that episode starts preparing. */
  onIntent: (episodeNumber: number) => void;
}

/**
 * « Tous les épisodes » from the fiche: a real bottom sheet. Full width, stuck to the bottom edge, as tall as the screen allows
 * below the notch, round corners on top only; the list runs to the very bottom edge (the last row clears the home indicator by its
 * own padding). It draws the fiche's own rows (`EpisodeRow`), windowed, in a header of two lines: the title with the one quiet bulk
 * action, and the field that goes to an episode. Closing (cross, backdrop, Escape or a pull down) stays on the fiche.
 */
export function FicheEpisodesSheet(props: FicheEpisodesSheetProps) {
  useInterfaceLanguage();
  const { open, onClose, anime, episodes, progress, now } = props;
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // The native "close" event also fires when WE close the dialog because `open` went false: only a close the parent did not ask for
  // (Escape, a form method=dialog…) is reported back.
  const openRef = useRef(open);
  const onCloseRef = useRef(onClose);
  const toast = useToast();
  const markOne = useEpisodeSeenToggle(anime);
  const watched = useEpisodeWatchedAction(anime, episodes, progress, markOne);
  const [confirmAll, setConfirmAll] = useState(false);
  const [marking, setMarking] = useState(false);
  const markable = episodes.filter(e => !episodePlaybackBlocked(anime, e.number, now));
  const close = () => { watched.dismiss(); setConfirmAll(false); onClose(); };
  useEffect(() => { onCloseRef.current = close; });

  useEffect(() => {
    openRef.current = open;
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    // A reopened sheet starts clean, whatever a previous swipe left on it.
    dialog.style.transform = "";
    dialog.style.transition = "";
    return attachSheetDrag(dialog, () => onCloseRef.current());
  }, [open]);

  return <>
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => openRef.current && close()}
      onCancel={e => { e.preventDefault(); close(); }}
      // A click on the dialog box itself (not its content) is a tap on the backdrop.
      onClick={e => { if (e.target === e.currentTarget) close(); }}
      style={{ height: "calc(100dvh - var(--safe-top) - 0.75rem)" }}
      className="m-0 mt-auto max-h-none w-full max-w-none overflow-hidden rounded-t-[22px] rounded-b-none border-0 border-t border-line bg-raised p-0 text-paper backdrop:bg-black/60 open:animate-sheet-in sm:mx-auto sm:mb-6 sm:max-h-[46rem] sm:max-w-xl sm:rounded-[20px] sm:border"
    >
      {open && <div tabIndex={-1} autoFocus className="flex h-full min-h-0 flex-col outline-none" data-testid="episodes-sheet">
        <div {...{ [SHEET_GRIP_ATTR]: "" }} className="flex justify-center pb-1 pt-2.5" aria-hidden="true"><div className="h-1 w-9 rounded-full bg-line" /></div>
        <SheetBody {...props} titleId={titleId} markableCount={markable.length} marking={marking} onMarkAll={() => setConfirmAll(true)} onClose={close} onToggle={(n, completed) => void watched.toggle(n, completed)} />
      </div>}
    </dialog>
    {open && watched.confirmation}
    <ConfirmSheet open={open && confirmAll} onClose={() => setConfirmAll(false)} title={ui("Tout marquer comme vu ?")} message={ui("Les {0} épisodes disponibles de cette saison seront marqués comme vus. Les autres saisons, l'historique et les listes restent conservés.", markable.length)} confirmLabel={ui("Marquer comme vus")} onConfirm={() => {
      setConfirmAll(false); setMarking(true);
      void (async () => { try { await upsertAnimeSummary(anime); await markEpisodesCompleted(anime.id, markable.map(e => e.number)); toast(ui("Épisodes marqués comme vus")); } catch { toast(ui("Impossible de modifier le suivi"), "error"); } finally { setMarking(false); } })();
    }} />
  </>;
}

/** Mounted only while the sheet is open: its scroll, its field and its position start clean on every opening. */
function SheetBody({ titleId, anime, episodes, progress, now, current, currentLabel, previews, settling, titleLanguage, initialReverse = false, onIntent, markableCount, marking, onMarkAll, onClose, onToggle }: FicheEpisodesSheetProps & { titleId: string; markableCount: number; marking: boolean; onMarkAll: () => void; onToggle: (episode: number, completed: boolean) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(0);
  const [rootPx, setRootPx] = useState(16);
  const [reverse, setReverse] = useState(initialReverse);
  const ordered = useMemo(() => reverse ? [...episodes].reverse() : episodes, [episodes, reverse]);
  // Rows are laid out in rem (as the fiche's are), so the windowing maths follow the same root size.
  const pitch = EPISODE_NAV.ficheRowPitchRem * rootPx;
  const measured = viewport > 0;
  const positioned = useRef(false);
  const currentIndex = reverse ? 0 : current == null ? -1 : ordered.findIndex(e => e.number === current);
  const records = useMemo(() => new Map((progress ?? []).map(p => [p.episodeNumber, p])), [progress]);
  const previewOf = useMemo(() => new Map(previews.map(p => [p.number, p])), [previews]);
  // Only a consecutive watched prefix advances spoiler access, exactly as on the fiche.
  const nextUnwatched = firstUnwatchedEpisode(progress ?? [], episodes.map(e => e.number));

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      setRootPx(parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
      setViewport(el.clientHeight);
    };
    measure();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, []);

  // The episode to watch comes into view once, on opening — never while the viewer scrolls, never when a mark moves it.
  useEffect(() => {
    const el = box.current;
    if (!el || !measured || positioned.current) return;
    positioned.current = true;
    if (currentIndex < 0) return;
    el.scrollTop = scrollTopFor(currentIndex, el.clientHeight, episodes.length, pitch);
    setScrollTop(el.scrollTop);
  }, [measured, currentIndex, episodes.length, pitch]);

  // Before the first measure, render around the episode to watch so the list is never empty.
  const { start, end } = visibleWindow(measured ? scrollTop : Math.max(0, currentIndex) * pitch, measured ? viewport : EPISODE_NAV.sheetFirstPaintPx, episodes.length, pitch, EPISODE_NAV.ficheOverscan);

  return <>
    <header {...{ [SHEET_GRIP_ATTR]: "" }} className={`px-safe flex shrink-0 items-center gap-2 pb-1 transition-shadow duration-150 motion-reduce:transition-none ${scrollTop > 0 ? "shadow-[0_1px_0_var(--color-line)]" : ""}`}>
      <h2 id={titleId} className="min-w-0 flex-1 truncate text-[17px] font-semibold">{ui("Épisodes")}<span className="ml-2 text-[14px] font-medium tabular-nums text-muted" aria-hidden="true">{episodes.length}</span></h2>
      {markableCount > 0 && <button type="button" disabled={marking} onClick={onMarkAll} className="min-h-11 shrink-0 rounded-full px-2.5 text-[13.5px] font-semibold whitespace-nowrap text-soft active:opacity-60 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent" data-testid="episodes-mark-all">{ui("Tout marquer comme vu")}</button>}
      <IconButton label={ui("Fermer")} variant="ghost" onClick={onClose} className="-mr-2"><X size={22} aria-hidden="true" /></IconButton>
    </header>
    <div className="px-safe flex shrink-0 items-start gap-2 pb-2">
      <JumpField anime={anime} episodes={episodes} now={now} onNavigate={onClose} />
      {episodes.length > 1 && <IconButton label={reverse ? ui("Épisodes du dernier au premier, inverser") : ui("Épisodes du premier au dernier, inverser")} aria-pressed={reverse} onClick={() => { setReverse(!reverse); positioned.current = true; if (box.current) box.current.scrollTop = 0; setScrollTop(0); }} data-testid="sheet-episode-order">{reverse ? <ArrowDownWideNarrow size={20} /> : <ArrowUpNarrowWide size={20} />}</IconButton>}
    </div>
    <div ref={box} onScroll={e => setScrollTop(e.currentTarget.scrollTop)} className="px-safe relative min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ overflowAnchor: "none" }} data-testid="episode-list">
      {/* Windowed: only the rows in view exist. The list ends with the home indicator's clearance, so nothing sits under it. */}
      <ol aria-label={ui("Tous les épisodes")} className="relative" style={{ height: `calc(${episodes.length * EPISODE_NAV.ficheRowPitchRem}rem + max(1rem, var(--safe-bottom)))` }}>
        {ordered.slice(start, end).map((ep, offset) => {
          const index = start + offset;
          const record = records.get(ep.number);
          return <EpisodeRow key={ep.number} surface="sheet" anime={anime} episode={ep} now={now} record={record} preview={previewOf.get(ep.number)} revealed={episodeArtworkAllowed(record, ep.number, nextUnwatched)} next={current === ep.number} nextLabel={currentLabel} titleLanguage={titleLanguage} settling={settling} position={index + 1} size={episodes.length} onToggle={onToggle} onIntent={onIntent} onOpen={onClose} style={{ top: `${index * EPISODE_NAV.ficheRowPitchRem}rem` }} />;
        })}
      </ol>
    </div>
  </>;
}

/** « Aller à l'épisode »: a number, Enter, and the episode opens (never the nearest one). One compact line, not a labelled row. */
function JumpField({ anime, episodes, now, onNavigate }: { anime: Anime; episodes: readonly EpisodeItem[]; now: number; onNavigate: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const first = episodes[0]?.number;
  const last = episodes[episodes.length - 1]?.number;
  return <form
    className="min-w-0 flex-1"
    onSubmit={e => {
      e.preventDefault();
      const target = findEpisodeNumber(episodes, value);
      if (!target) {
        setError(value.trim() ? ui("Épisode {0} introuvable{1}", value.trim(), first != null ? ` (${formatEpisodeNumber(first)}–${formatEpisodeNumber(last!)})` : "") : ui("Saisis un numéro d'épisode"));
        return;
      }
      if (episodePlaybackBlocked(anime, target.number, now)) { setError(ui("Pas encore disponible")); return; }
      setError(null);
      onNavigate();
      router.push(routes.watch(anime.id, target.number));
    }}
  >
    <label className="flex h-11 items-center rounded-full bg-surface pl-4 pr-1 focus-within:outline-2 focus-within:outline-accent">
      <input
        type="text"
        inputMode="numeric"
        enterKeyHint="go"
        autoComplete="off"
        value={value}
        onChange={e => { setValue(e.target.value); setError(null); }}
        aria-invalid={error != null}
        aria-label={ui("Aller à l'épisode")}
        placeholder={last != null ? `${ui("Aller à l'épisode")} (${formatEpisodeNumber(first!)}–${formatEpisodeNumber(last)})` : ui("Aller à l'épisode")}
        className="h-full min-w-0 flex-1 bg-transparent text-base tabular-nums outline-none placeholder:text-[14.5px] placeholder:text-muted"
        // The wrapping field owns the focus ring; the global :focus-visible
        // rule must not draw a second rectangular outline inside it.
        style={{ outline: "none" }}
        data-testid="jump-input"
      />
      <button type="submit" aria-label={ui("Aller à l'épisode")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-soft active:opacity-60"><ArrowRight size={18} aria-hidden="true" /></button>
    </label>
    {error && <p role="alert" className="mt-1.5 px-1 text-[13px] text-coral">{localizeOwnedText(error)}</p>}
  </form>;
}
