"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronRight, Clock, Film } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconButton } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/Section";
import { RC10 } from "@/config/app";
import { useAnimeProgress } from "@/features/library/hooks";
import { TrackingRow } from "@/features/library/TrackingRow";
import { usePreferences } from "@/features/settings/PreferencesContext";
import { prefetchWatch } from "@/features/player/streams";
import { availableEpisodeCount, isSingleItem } from "@/lib/anilist/normalize";
import { buildEpisodeList, formatEpisodeNumber } from "@/lib/providers/episodes";
import { episodeArtworkAllowed, firstUnwatchedEpisode } from "@/lib/progress/logic";
import { upcomingEpisodeNumber } from "@/lib/airing/availability";
import { useAiringClock } from "@/lib/airing/useAiringClock";
import { primaryAction } from "@/lib/progress/primary-action";
import { routes } from "@/lib/utils/routes";
import type { Anime } from "@/types/anime";
import { EpisodeRow } from "./EpisodeRow";
import { FicheEpisodesSheet } from "./FicheEpisodesSheet";
import { useEpisodeSeenToggle } from "./EpisodeSheet";
import { useActiveProvider, useEpisodeList } from "./useEpisodes";
import { useEpisodeWatchedAction } from "./useEpisodeWatchedAction";
import { useEpisodeArtwork, useEpisodeArtworkSettled } from "./useEpisodeArtwork";
import { MEDIA } from "@/config/media";

/**
 * The fiche's episodes: a few compact rows around the one to start or resume — it IS the action, so there is no big start bar.
 * Thumbnail, number, title, the reading state worth saying; the « vu » mark stays its own 44 px target. Everything else is behind the
 * section's own « Tous les épisodes » (the full interface, its own scroll, loaded as it is read): no second « more » control and no
 * scroll area inside the page.
 */
export function InlineEpisodes({ anime }: { anime: Anime }) {
  useInterfaceLanguage();
  const { titleLanguage } = usePreferences();
  const box = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");
  const [reverse, setReverse] = useState(false);
  const [picker, setPicker] = useState(false);
  const progress = useAnimeProgress(anime.id, { seed: true });
  const { provider } = useActiveProvider(anime.id, anime);
  const list = useEpisodeList(visible ? anime : undefined, provider);
  const now = useAiringClock(anime.nextAiring?.airingAt);
  const count = availableEpisodeCount(anime, now);
  const artwork = useEpisodeArtwork(anime.id, visible && count !== 0);
  const answered = useEpisodeArtworkSettled(anime.id, visible && count !== 0);
  // Bounded: a slow or missing answer ends in the series stand-in, never in an endless placeholder.
  const [waitedOut, setWaitedOut] = useState(false);
  useEffect(() => {
    if (answered || waitedOut || !visible) return;
    const timer = setTimeout(() => setWaitedOut(true), MEDIA.thumbnailSettleBudgetMs);
    return () => clearTimeout(timer);
  }, [answered, waitedOut, visible]);
  const settling = !answered && !waitedOut;
  const toggle = useEpisodeSeenToggle(anime);
  const qc = useQueryClient();
  const episodes = useMemo(() => list.data?.episodes ?? buildEpisodeList(count, null), [list.data, count]);
  const watched = useEpisodeWatchedAction(anime, episodes, progress, toggle);
  const metadata = new Map(artwork.map(e => [e.number, e]));
  const records = useMemo(() => new Map((progress ?? []).map(p => [p.episodeNumber, p])), [progress]);
  // Only a consecutive watched prefix advances spoiler access; resume may point beyond a gap.
  const nextUnwatched = firstUnwatchedEpisode(progress ?? [], episodes.map(ep => ep.number));
  // The episode to start or resume (the same decision the big bar used to make), and the few rows around it.
  const action = progress ? primaryAction({ single: false, records: progress, available: count, total: count ?? anime.episodeCount }) : null;
  // AniList's next episode, while its slot is ahead, is said in the list but is never part of it: not counted, not in the full
  // interface, not playable (`lib/airing/availability.ts` is the one contract).
  const upcoming = upcomingEpisodeNumber(anime, now);
  const shownList = useMemo(() => upcoming != null && !episodes.some(ep => ep.number === upcoming) ? [...episodes, { number: upcoming, title: null, thumbnail: null, providerEpisode: null }] : episodes, [episodes, upcoming]);
  const ordered = reverse ? [...shownList].reverse() : shownList;
  const focus = Math.max(0, ordered.findIndex(ep => ep.number === (action?.episode ?? ordered[0]?.number)));
  // The rows start at the episode to watch and stay put while it moves inside them: marking one seen moves the highlight down a row,
  // it does not make the row that was just touched vanish. They move only when the episode to watch would leave them (and never
  // before the viewing is known, or the first paint would pin the first episodes). Reversed, the list opens on its own top: the
  // LAST episode of this season or part (each entry lists its own episodes), whatever the episode to watch is.
  const [anchor, setAnchor] = useState<number | null>(null);
  const held = progress !== undefined && anchor != null ? ordered.findIndex(ep => ep.number === anchor) : -1;
  const kept = held >= 0 && focus >= held && focus < held + RC10.episodeInlineRows;
  const first = reverse ? 0 : Math.min(kept ? held : focus, Math.max(0, ordered.length - RC10.episodeInlineRows));
  const shown = ordered.slice(first, first + RC10.episodeInlineRows);
  const top = progress !== undefined ? shown[0]?.number ?? null : null;
  if (top !== anchor) setAnchor(top);
  const actionLabel = action ? (action.label === "Lire" ? ui("À suivre") : ui(action.label)) : null;
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { setVisible(true); observer.disconnect(); } });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  if (isSingleItem(anime)) return null;
  return <section ref={box} id="anime-episodes" className="px-safe scroll-mt-20" aria-labelledby="inline-episodes-title" data-testid="inline-episodes">
    <div className="mb-2 flex min-h-11 items-center gap-1">
      <SectionTitle id="inline-episodes-title">{ui("Épisodes")}</SectionTitle>
      {episodes.length > 1 && <IconButton label={reverse ? ui("Épisodes du dernier au premier, inverser") : ui("Épisodes du premier au dernier, inverser")} aria-pressed={reverse} onClick={() => { setReverse(!reverse); setAnchor(null); }} data-testid="inline-episode-order">{reverse ? <ArrowDownWideNarrow size={20} /> : <ArrowUpNarrowWide size={20} />}</IconButton>}
      <span className="ml-auto"><TrackingRow anime={anime} compact bell={false} /></span>
    </div>
    {shown.length > 0 && <ol className="flex flex-col gap-1" aria-label={ui("Épisodes de la saison")} data-testid="inline-episode-list" data-total={episodes.length}>
      {shown.map((ep, index) => <EpisodeRow key={ep.number} surface="fiche" anime={anime} episode={ep} now={now} record={records.get(ep.number)} preview={metadata.get(ep.number)} revealed={episodeArtworkAllowed(records.get(ep.number), ep.number, nextUnwatched)} next={action?.episode === ep.number} nextLabel={actionLabel} titleLanguage={titleLanguage} settling={settling} position={first + index + 1} size={ordered.length} onToggle={(n, completed) => void watched.toggle(n, completed)} onIntent={number => void prefetchWatch(qc, anime, provider, number, { prepare: true })} />)}
    </ol>}
    {/* The ONE way to the rest, closing the list it continues: one row of the section, not a second button next to a header link. */}
    {episodes.length > 0 && <button type="button" aria-label={ui("Tous les épisodes")} onClick={() => { setVisible(true); setPicker(true); }} className="mt-1 flex min-h-12 w-full items-center gap-2 rounded-xl px-1.5 text-left text-[15px] font-semibold text-paper transition-colors duration-150 active:bg-raised motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-accent" data-testid="episodes-open">
      <span className="flex-1" aria-hidden="true">{ui("Tous les épisodes")}</span>
      <span className="text-[14px] font-medium tabular-nums text-muted" aria-hidden="true">{episodes.length}</span>
      <ChevronRight size={18} className="context-accent" aria-hidden="true" />
    </button>}
    {episodes.length === 0 && <EpisodesEmpty unreleased={count === 0} onRetry={() => void list.refetch()} action={action ? { href: routes.watch(anime.id, action.episode), label: ui(action.label), episode: formatEpisodeNumber(action.episode) } : null} />}
    {watched.confirmation}
    <FicheEpisodesSheet open={picker} onClose={() => setPicker(false)} anime={anime} episodes={episodes} current={action && action.label !== "Revoir" ? action.episode : null} currentLabel={actionLabel} progress={progress} now={now} previews={artwork} settling={settling} titleLanguage={titleLanguage} initialReverse={reverse} onIntent={number => void prefetchWatch(qc, anime, provider, number, { prepare: true })} />
  </section>;
}

/**
 * No episode to list: said in the page's own greys, with what is true — the work has not aired yet, or the list could not be had.
 * Nothing is invented: no placeholder rows, no fake count. When the list is merely unavailable the way into the episode to watch stays.
 */
function EpisodesEmpty({ unreleased, onRetry, action }: { unreleased: boolean; onRetry: () => void; action: { href: string; label: string; episode: string } | null }) {
  return <div className="episodes-empty" data-testid="episodes-empty" data-kind={unreleased ? "unreleased" : "unavailable"}>
    <span className="episodes-empty-icon" aria-hidden="true">{unreleased ? <Clock size={24} /> : <Film size={24} />}</span>
    <p className="text-[17px] font-bold">{unreleased ? ui("Pas encore diffusé") : ui("La liste des épisodes n'est pas encore disponible.")}</p>
    {unreleased
      ? <p className="max-w-[28ch] text-[14px] text-muted">{ui("Les épisodes apparaîtront ici dès leur diffusion.")}</p>
      : <div className="mt-1 flex flex-col items-center gap-2">
        <button type="button" onClick={onRetry} className="min-h-11 rounded-full border border-line px-5 text-[14.5px] font-semibold active:opacity-60" data-testid="episodes-retry">{ui("Réessayer")}</button>
        {action && <Link href={action.href} className="min-h-11 content-center text-[14px] font-semibold context-accent" data-testid="episodes-empty-play">{action.label}{" · "}{ui("Ép.")}{" "}{action.episode}</Link>}
      </div>}
  </div>;
}
