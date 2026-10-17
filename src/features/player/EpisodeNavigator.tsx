"use client";


import { ui, localizeOwnedText } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { Check, Circle, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { EPISODE_NAV } from "@/config/app";
import type { ProgressRecord } from "@/lib/db/types";
import { EpisodeHeading, EpisodeTitleText } from "@/features/episodes/EpisodeHeading";
import { EpisodeThumbnail } from "@/features/episodes/EpisodeThumbnail";
import type { EpisodePreview } from "@/lib/anilist/episodes";
import type { AnimeSummary } from "@/types/anime";
import { episodeArtworkAllowed, episodeState, firstUnwatchedEpisode } from "@/lib/progress/logic";
import { type EpisodeItem, formatEpisodeNumber } from "@/lib/providers/episodes";
import { episodeAvailability, episodePlaybackBlocked } from "@/lib/airing/availability";
import { useAiringClock } from "@/lib/airing/useAiringClock";
import { UnavailableEpisode } from "@/features/episodes/UnavailableEpisode";
import { routes } from "@/lib/utils/routes";
import {
  findEpisodeNumber,
  scrollTopFor,
  visibleWindow,
} from "./episode-window";

/**
 * Every episode of the series in one scrollable, windowed list: the current
 * one is highlighted and scrolled into view, watched ones carry a check, a tap
 * opens the episode (same tab, the playback source is kept). Only the rows in
 * view exist in the DOM, so One Piece costs the same as a twelve-episode show.
 */
export function EpisodeList({
  animeId,
  episodes,
  current,
  progress,
  height,
  onNavigate,
  onToggleSeen,
  push = false,
  currentLabel = ui("en cours"),
  preserveScroll = false,
  artwork,
  simpleLabels = false,
  rich = false,
}: {
  animeId: number;
  episodes: readonly EpisodeItem[];
  /** The highlighted episode (the one playing, or the one to watch next). */
  current: number | null;
  progress: readonly ProgressRecord[] | undefined;
  /** CSS height of the scroll area. */
  height: string;
  onNavigate?: () => void;
  /** When given, the « vu » mark of every row is its own 44 px button (it never navigates). */
  onToggleSeen?: (episodeNumber: number, completed: boolean) => void;
  /** A tap adds a history entry (from the fiche: Back returns to it) instead of replacing the watch page in place. */
  push?: boolean;
  /** Said to screen readers on the highlighted row. */
  currentLabel?: string;
  /** An open picker keeps its reading position when progress changes its suggested episode. */
  preserveScroll?: boolean;
  /** Shared, permission-checked previews supplied by the open picker. */
  artwork?: { anime: AnimeSummary & { bannerImage?: string | null }; previews: readonly EpisodePreview[] };
  simpleLabels?: boolean;
  /** The fiche's full interface: taller rows with the number, a larger thumbnail, a title that wraps and the progress (the player keeps compact rows). */
  rich?: boolean;
}) {
  useInterfaceLanguage();
  const now = useAiringClock(artwork?.anime.nextAiring?.airingAt);
  const box = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(0);
  const { overscan } = EPISODE_NAV;
  const rowHeight = rich ? EPISODE_NAV.richRowHeight : EPISODE_NAV.rowHeight;
  const currentIndex = current == null ? -1 : episodes.findIndex((e) => e.number === current);
  const measured = viewport > 0;
  const positioned = useRef(false);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setViewport(el.clientHeight);
    measure();
    const observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, []);

  // The current episode comes into view on open and whenever it changes — never while the viewer scrolls.
  useEffect(() => {
    const el = box.current;
    if (!el || !measured || currentIndex < 0) return;
    if (preserveScroll && positioned.current) return;
    positioned.current = true;
    el.scrollTop = scrollTopFor(
      currentIndex,
      el.clientHeight,
      episodes.length,
      rowHeight,
    );
    setScrollTop(el.scrollTop);
  }, [current, currentIndex, measured, episodes.length, rowHeight, preserveScroll]);

  const seen = new Set(
    (progress ?? []).filter((p) => p.completed).map((p) => p.episodeNumber),
  );
  const previews = new Map(artwork?.previews.map(p => [p.number, p]));
  const records = new Map(progress?.map(p => [p.episodeNumber, p]));
  const nextUnwatched = firstUnwatchedEpisode(progress ?? []);
  // Before the first measure, render around the current episode so the list is never empty.
  const { start, end } = visibleWindow(
    measured ? scrollTop : Math.max(0, currentIndex) * rowHeight,
    measured ? viewport : 480,
    episodes.length,
    rowHeight,
    overscan,
  );

  return (
    <div
      ref={box}
      onScroll={(e) => { if (preserveScroll) positioned.current = true; setScrollTop(e.currentTarget.scrollTop); }}
      className="relative overflow-y-auto overscroll-contain"
      style={{ height, overflowAnchor: "none" }}
      data-testid="episode-list"
    >
      <ul
        aria-label={ui("Tous les épisodes")}
        style={{ height: episodes.length * rowHeight, position: "relative" }}
      >
        {episodes.slice(start, end).map((ep, offset) => {
          const availability = artwork ? episodeAvailability(artwork.anime, ep.number, now) : null;
          const blocked = availability?.kind === "future" || availability?.kind === "outside-entry";
          const i = start + offset;
          const isCurrent = ep.number === current;
          const watched = seen.has(ep.number);
          return (
            <li
              key={ep.number}
              style={{
                position: "absolute",
                top: i * rowHeight,
                left: 0,
                right: 0,
                height: rowHeight,
              }}
              aria-setsize={episodes.length}
              aria-posinset={i + 1}
            >
              {blocked && availability ? <UnavailableEpisode number={ep.number} availability={availability} /> : rich ? (
                <div className={`episode-row flex h-full items-center rounded-xl ${isCurrent ? "episode-next" : ""} ${watched ? "episode-watched" : ""}`}>
                  <Link
                    href={routes.watch(animeId, ep.number)}
                    replace={!push}
                    onClick={onNavigate}
                    aria-current={isCurrent ? "true" : undefined}
                    className="flex h-full min-w-0 flex-1 items-center gap-3 rounded-xl pl-1 active:bg-surface"
                    data-testid="episode-row"
                    data-episode={ep.number}
                    data-current={isCurrent ? "true" : "false"}
                  >
                    <span className="w-8 shrink-0 text-center text-[17px] font-bold tabular-nums text-muted" aria-hidden="true">{ep.number}</span>
                    {artwork && <span className="relative block w-[9.5rem] shrink-0" aria-hidden="true">
                      <EpisodeThumbnail preview={previews.get(ep.number)} concealed={!episodeArtworkAllowed(records.get(ep.number), ep.number, nextUnwatched)} quiet banner={artwork.anime.bannerImage} cover={artwork.anime.coverImage.extraLarge ?? artwork.anime.coverImage.large ?? artwork.anime.coverImage.medium} percentage={episodeState(records.get(ep.number)) === "partial" ? records.get(ep.number)?.percentage : undefined} number={ep.number} sizes="152px" />
                      {isCurrent && <span className="episode-glyph"><Play size={14} fill="currentColor" /></span>}
                    </span>}
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className={`line-clamp-3 text-[15.5px] leading-snug font-semibold ${watched && !isCurrent ? "text-soft" : ""}`}><EpisodeTitleText episode={ep} /></span>
                      {isCurrent && <span className="text-[12.5px] font-bold context-accent">{localizeOwnedText(currentLabel)}</span>}
                    </span>
                  </Link>
                  {onToggleSeen && (
                    <button type="button" aria-pressed={watched} aria-label={watched ? ui("Marquer l'épisode {0} comme non vu", formatEpisodeNumber(ep.number)) : ui("Marquer l'épisode {0} comme vu", formatEpisodeNumber(ep.number))} onClick={() => onToggleSeen(ep.number, !watched)} className={`flex h-full w-12 shrink-0 items-center justify-center active:opacity-60 ${watched ? "context-accent" : "text-muted"}`} data-testid="episode-seen">
                      {watched ? <Check size={20} strokeWidth={2.5} aria-hidden="true" /> : <Circle size={20} strokeWidth={1.5} aria-hidden="true" />}
                    </button>
                  )}
                </div>
              ) : (
              <div className={`flex h-full items-stretch border-b border-line border-l-2 lg:hover:bg-surface ${watched ? "episode-watched" : ""} ${isCurrent ? "border-l-accent bg-surface" : "border-l-transparent"}`}>
                  <Link
                    href={routes.watch(animeId, ep.number)}
                    replace={!push}
                    onClick={onNavigate}
                    aria-current={isCurrent ? "true" : undefined}
                    className="flex min-w-0 flex-1 items-center gap-2 px-3 active:bg-surface"
                    data-testid="episode-row"
                    data-episode={ep.number}
                    data-current={isCurrent ? "true" : "false"}
                  >
                    {artwork && <span className="w-16 shrink-0" aria-hidden="true">
                      <EpisodeThumbnail preview={previews.get(ep.number)} concealed={!episodeArtworkAllowed(records.get(ep.number), ep.number, nextUnwatched)} cover={artwork.anime.coverImage.large ?? artwork.anime.coverImage.medium} number={ep.number} sizes="64px" />
                    </span>}
                    {/* One piece of information: « 01 — Real title », or just « Épisode 1 » when there is no real title. */}
                    <span className={`min-w-0 flex-1 truncate text-[15px] ${isCurrent ? "font-medium text-accent" : ""}`}>
                      <EpisodeHeading episode={ep} simple={simpleLabels} />
                      {isCurrent && <span className="sr-only"> {localizeOwnedText(currentLabel)}</span>}
                    </span>
                    {!onToggleSeen && !isCurrent && watched && (
                      <span className="flex shrink-0 items-center text-accent">
                        <Check size={15} aria-hidden="true" />
                        <span className="sr-only">{ui("vu")}</span>
                      </span>
                    )}
                  </Link>
                  {/* A real target of its own (44 px): marking an episode seen is not opening it. */}
                  {onToggleSeen && (
                    <button
                      type="button"
                      aria-pressed={watched}
                      aria-label={watched ? ui("Marquer l'épisode {0} comme non vu", formatEpisodeNumber(ep.number)) : ui("Marquer l'épisode {0} comme vu", formatEpisodeNumber(ep.number))}
                      onClick={() => onToggleSeen(ep.number, !watched)}
                      className={`flex h-full w-12 shrink-0 items-center justify-center active:bg-surface ${watched ? "context-accent" : "text-soft"}`}
                      data-testid="episode-seen"
                    >
                      {watched ? <Check size={20} strokeWidth={2.5} aria-hidden="true" /> : <Circle size={20} strokeWidth={1.5} aria-hidden="true" />}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** « Aller à l'épisode »: type a number, open it — no scrolling through hundreds of rows. */
export function JumpToEpisode({
  anime,
  animeId,
  episodes,
  onNavigate,
  push = false,
}: {
  anime?: AnimeSummary | null;
  animeId: number;
  episodes: readonly EpisodeItem[];
  onNavigate?: () => void;
  push?: boolean;
}) {
  useInterfaceLanguage();
  const now = useAiringClock(anime?.nextAiring?.airingAt);
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const first = episodes[0]?.number;
  const last = episodes[episodes.length - 1]?.number;
  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const target = findEpisodeNumber(episodes, value);
        if (!target) {
          setError(
            value.trim()
              ? ui("Épisode {0} introuvable{1}", value.trim(), first != null ? ` (${formatEpisodeNumber(first)}–${formatEpisodeNumber(last!)})` : "")
              : ui("Saisis un numéro d'épisode"),
          );
          return;
        }
        if (anime && episodePlaybackBlocked(anime, target.number, now)) {
          setError(ui("Pas encore disponible"));
          return;
        }
        setError(null);
        onNavigate?.();
        const href = routes.watch(animeId, target.number);
        if (push) router.push(href);
        else router.replace(href);
      }}
    >
      <div className="flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 text-[15px] text-soft">
            {ui("Aller à l'épisode")}</span>
          <input
            type="text"
            inputMode="numeric"
            enterKeyHint="go"
            autoComplete="off"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            aria-invalid={error != null}
            placeholder={last != null ? String(last) : "N°"}
            className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-ink px-3 text-base tabular-nums placeholder:text-muted focus:border-accent focus:outline-none"
            data-testid="jump-input"
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-coral">
          {localizeOwnedText(error)}
        </p>
      )}
    </form>
  );
}
