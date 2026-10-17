"use client";

import { Check, Circle, Clock, Play } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ui } from "@/lib/i18n/translate";
import type { EpisodePreview } from "@/lib/anilist/episodes";
import { availabilityDay, episodeAvailability } from "@/lib/airing/availability";
import type { ProgressRecord } from "@/lib/db/types";
import { episodeState } from "@/lib/progress/logic";
import { episodeLabel, formatEpisodeNumber, paddedEpisodeNumber, realEpisodeTitle, type EpisodeItem } from "@/lib/providers/episodes";
import { routes } from "@/lib/utils/routes";
import type { Anime, TitlePreference } from "@/types/anime";
import { EpisodeThumbnail } from "./EpisodeThumbnail";

/**
 * Where a row is drawn. Both surfaces draw the SAME row (thumbnail, number, title, the reading state, the « vu » mark); only what
 * the surrounding code needs to find differs:
 * - `fiche`: a plain list item carrying the episode's data attributes (`inline-episode-*` test ids).
 * - `sheet`: the item is placed by a windowed list (`style`), and the link itself carries the episode (`episode-row`, `episode-seen`).
 */
export type EpisodeRowSurface = "fiche" | "sheet";

export interface EpisodeRowProps {
  surface: EpisodeRowSurface;
  anime: Anime;
  episode: EpisodeItem;
  /** The airing clock (`useAiringClock`): an episode AniList puts ahead is said, never offered. */
  now: number;
  record: ProgressRecord | undefined;
  preview: EpisodePreview | undefined;
  /** The still and the real title may be shown (watched, started, or the one to watch). */
  revealed: boolean;
  /** The episode to start or resume: framed in the work's colour, with a play mark on its thumbnail. */
  next: boolean;
  /** What the row says for the episode to watch (« À suivre », « Reprendre »…). */
  nextLabel: string | null;
  titleLanguage: TitlePreference;
  /** The exact-still sources have not answered yet: the thumbnail waits in a neutral frame. */
  settling: boolean;
  /** 1-based place in the list, and the list's size, for assistive technology. */
  position: number;
  size: number;
  onToggle: (episode: number, completed: boolean) => void;
  /** A finger went down on the row: that episode starts preparing. */
  onIntent: (episode: number) => void;
  /** Opening the episode leaves the list the row is in (the sheet closes). */
  onOpen?: () => void;
  /** Placement by a windowed list. */
  style?: CSSProperties;
}

/** The fiche's episode row, shared with the full interface that « Tous les épisodes » opens. */
export function EpisodeRow({ surface, anime, episode: ep, now, record, preview, revealed, next, nextLabel, titleLanguage, settling, position, size, onToggle, onIntent, onOpen, style }: EpisodeRowProps) {
  const fiche = surface === "fiche";
  // The sheet's windowed list places the item itself; the fiche's list lets it flow.
  const place = fiche ? "relative" : "absolute inset-x-0";
  // AniList says this one has not aired: said, not offered. Its date is only ever AniList's own, for its next episode.
  const availability = episodeAvailability(anime, ep.number, now);
  if (availability.kind === "future" || availability.kind === "outside-entry") return <li style={style} className={`episode-row ${place} flex items-center rounded-xl`} aria-posinset={position} aria-setsize={size} {...(fiche ? { "data-episode": ep.number, "data-watched": "false", "data-next": "false" } : {})} data-upcoming={availability.kind === "future"}>
    <div className="flex min-h-[5.25rem] min-w-0 flex-1 items-center gap-3 p-1.5" data-testid={fiche ? "inline-episode-upcoming" : "episode-row"} {...(fiche ? {} : { "data-episode": ep.number, "aria-disabled": "true" })}>
      <span className="relative block w-32 shrink-0"><span className="flex aspect-video w-full items-center justify-center rounded-[var(--radius-poster)] bg-gradient-to-br from-raised to-ink" aria-hidden="true"><Clock size={20} className="opacity-40" /></span></span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="line-clamp-2 text-[15px] leading-snug font-semibold text-soft">{episodeLabel(ep)}</span>
        <span className="text-[12.5px] text-muted" data-testid={fiche ? "inline-episode-availability" : "episode-availability"}>{availability.kind === "outside-entry" ? ui("Vérifie la saison ou la partie sur la fiche de l'anime.") : availability.airingAt != null ? ui("Disponible le {0}", availabilityDay(availability.airingAt)) : ui("Pas encore disponible")}</span>
      </span>
    </div>
  </li>;
  const state = episodeState(record);
  // A title can say as much as a still: it is shown on the same terms (the episode to watch and the ones already seen), the rest is « Épisode N ».
  const title = revealed ? realEpisodeTitle(ep, titleLanguage) : null;
  const seen = state === "completed";
  return <li style={style} className={`episode-row ${place} flex items-center rounded-xl ${next ? "episode-next" : ""}`} aria-posinset={position} aria-setsize={size} {...(fiche ? { "data-episode": ep.number, "data-watched": seen, "data-next": next } : {})}>
    <Link prefetch={false} href={routes.watch(anime.id, ep.number)} aria-label={ui("Lire l'épisode ") + formatEpisodeNumber(ep.number)} aria-current={!fiche && next ? "true" : undefined} onPointerDown={() => onIntent(ep.number)} onClick={onOpen} className="flex min-h-[5.25rem] min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 focus-visible:outline-2 focus-visible:outline-accent" data-testid={fiche ? "inline-episode-play" : "episode-row"} {...(fiche ? {} : { "data-episode": ep.number, "data-current": next ? "true" : "false" })}>
      <span className="relative block w-32 shrink-0">
        <EpisodeThumbnail key={preview?.thumbnail ?? "none"} settling={settling} preview={revealed ? preview : undefined} concealed={!revealed} quiet banner={anime.bannerImage} cover={anime.coverImage.extraLarge ?? anime.coverImage.large ?? anime.coverImage.medium} percentage={state === "partial" ? record?.percentage : undefined} number={ep.number} sizes="128px" />
        {next && <span className="episode-glyph" aria-hidden="true"><Play size={14} fill="currentColor" /></span>}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`line-clamp-2 text-[15px] leading-snug font-semibold ${seen ? "text-soft" : ""}`}>
          {title ? <><span className="mr-1.5 tabular-nums text-muted">{paddedEpisodeNumber(ep.number)}</span>{title}</> : episodeLabel(ep)}
        </span>
        {next && nextLabel && <span className="text-[12.5px] font-bold context-accent" data-testid={fiche ? "inline-episode-state" : "episode-state"}>{nextLabel}</span>}
      </span>
    </Link>
    <button type="button" aria-pressed={seen} aria-label={seen ? ui("Marquer l'épisode {0} comme non vu", formatEpisodeNumber(ep.number)) : ui("Marquer l'épisode {0} comme vu", formatEpisodeNumber(ep.number))} onClick={() => onToggle(ep.number, !seen)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-paper active:opacity-60" data-testid={fiche ? "inline-episode-seen" : "episode-seen"}>{seen ? <Check size={20} className="context-accent" /> : <Circle size={20} className="text-muted" />}</button>
  </li>;
}
