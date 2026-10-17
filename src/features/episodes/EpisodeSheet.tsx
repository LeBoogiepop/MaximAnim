"use client";


import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { useCallback, useState } from "react";
import { ConfirmSheet, Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { EPISODE_NAV } from "@/config/app";
import { EpisodeList, JumpToEpisode } from "@/features/player/EpisodeNavigator";
import { upsertAnimeSummary } from "@/lib/db/library";
import { markEpisodesCompleted, setEpisodeCompleted } from "@/lib/db/progress";
import type { ProgressRecord } from "@/lib/db/types";
import { buildEpisodeList, type EpisodeItem, formatEpisodeNumber } from "@/lib/providers/episodes";
import { useAnime } from "@/features/anime/useAnime";
import { useAnimeProgress } from "@/features/library/hooks";
import { firstUnwatchedEpisode } from "@/lib/progress/logic";
import { SeasonPicker, type SeasonOption } from "./SeasonPicker";
import type { AnimeSummary } from "@/types/anime";
import { episodePlaybackBlocked } from "@/lib/airing/availability";
import { useAiringClock } from "@/lib/airing/useAiringClock";
import { availableEpisodeCount } from "@/lib/anilist/normalize";
import { useEpisodeWatchedAction } from "./useEpisodeWatchedAction";
import { useEpisodeArtwork } from "./useEpisodeArtwork";

/** « Vu » / « pas vu » from an episode row: the manual mark, with a toast, never a navigation. */
export function useEpisodeSeenToggle(anime: AnimeSummary | null | undefined) {
  const toast = useToast();
  return useCallback(
    async (episodeNumber: number, completed: boolean) => {
      if (!anime) return;
      await upsertAnimeSummary(anime);
      await setEpisodeCompleted(anime.id, episodeNumber, completed);
      toast(completed ? ui("Épisode {0} marqué comme vu", formatEpisodeNumber(episodeNumber)) : ui("Épisode {0} marqué comme non vu", formatEpisodeNumber(episodeNumber)));
    },
    [anime, toast],
  );
}

/**
 * THE episode picker on a phone, from the player and from the fiche: every episode of the series (provider-independent
 * numbering), the highlighted one in view, a tap opens it, the « vu » mark is a 44 px button of its own. `push`: opening an
 * episode adds a history entry, so Back returns to the page the sheet was opened from (the fiche); the player replaces itself.
 */
export function EpisodeSheet({
  open,
  onClose,
  anime,
  animeId,
  episodes,
  current,
  progress,
  push = false,
  currentLabel,
  onIntent,
  seasons,
  immersive = false,
}: {
  open: boolean;
  onClose: () => void;
  anime: AnimeSummary | null | undefined;
  animeId: number;
  episodes: readonly EpisodeItem[];
  current: number | null;
  progress: readonly ProgressRecord[] | undefined;
  push?: boolean;
  currentLabel?: string;
  /** A finger went down on a row: that episode starts preparing (the stream of the tapped one only). */
  onIntent?: (episodeNumber: number) => void;
  /** Identified seasons/parts of the franchise (exact ids, watching order). With two or more, the sheet can switch between them. */
  seasons?: readonly SeasonOption[];
  /** The fiche's full episode interface: nearly the whole screen and richer rows. The player's sheet stays low, so its picture stays visible. */
  immersive?: boolean;
}) {
  useInterfaceLanguage();
  // The season being looked at: the one playing, or another one of the franchise. Nothing of the playing position is carried over.
  const [picked, setPicked] = useState<number | null>(null);
  const viewId = picked ?? animeId;
  const other = viewId !== animeId;
  const otherAnime = useAnime(other ? viewId : null);
  const otherProgress = useAnimeProgress(viewId);
  const shownAnime = other ? otherAnime.data?.anime : anime;
  const now = useAiringClock(shownAnime?.nextAiring?.airingAt);
  // A live query keeps the previous season's rows until the new ones arrive: never show them under another season.
  const shownProgress = other ? (otherProgress?.every(r => r.animeId === viewId) ? otherProgress : undefined) : progress;
  const shownEpisodes = other ? buildEpisodeList(shownAnime ? availableEpisodeCount(shownAnime) : null, null) : episodes;
  const shownCurrent = other ? (shownEpisodes.length ? (firstUnwatchedEpisode(shownProgress ?? []) ?? null) : null) : current;
  // Only offered when the playing entry is itself one of the chips (a film or spin-off would have nothing selected).
  const hasSeasons = (seasons?.length ?? 0) > 1 && seasons!.some(s => s.id === animeId);
  const previews = useEpisodeArtwork(viewId, open && shownAnime != null);
  const markOne = useEpisodeSeenToggle(shownAnime);
  const watched = useEpisodeWatchedAction(shownAnime, shownEpisodes, shownProgress, markOne);
  const [confirmAll, setConfirmAll] = useState(false);
  const [marking, setMarking] = useState(false);
  const toast = useToast();
  // Closing (or opening an episode) always returns the sheet to the season that is playing.
  const close = () => { watched.dismiss(); setConfirmAll(false); setPicked(null); onClose(); };
  const markable = shownEpisodes.filter(e => !shownAnime || !episodePlaybackBlocked(shownAnime, e.number, now));
  return (
    <>
    <Sheet open={open} onClose={close} title={ui("Épisodes")} height={`min(${immersive ? EPISODE_NAV.sheetImmersiveDvh : EPISODE_NAV.sheetHeightDvh}dvh, ${Math.max(shownEpisodes.length, 4) * (immersive ? EPISODE_NAV.richRowHeight : EPISODE_NAV.rowHeight) + EPISODE_NAV.sheetChromePx + (hasSeasons ? 56 : 0)}px)`}>
      <div className="flex h-full min-h-0 flex-col gap-3 pb-2" data-testid="episodes-sheet">
        {hasSeasons && <SeasonPicker seasons={seasons!} watching={animeId} selected={viewId} onSelect={id => setPicked(id === animeId ? null : id)} />}
        <JumpToEpisode anime={shownAnime} animeId={viewId} episodes={shownEpisodes} onNavigate={close} push={push} />
        {markable.length > 0 && <button type="button" disabled={marking} onClick={() => setConfirmAll(true)} className="min-h-11 shrink-0 text-left text-sm text-soft" data-testid="episodes-mark-all">{ui("Tout marquer comme vu")}</button>}
        <div
          className="-mx-2 min-h-0 flex-1 overflow-hidden rounded-xl border border-line"
          // Capture phase: the row's own link stays untouched, the intent only warms the tapped episode.
          onPointerDownCapture={(e) => {
            const row = (e.target as Element).closest?.("[data-testid='episode-row']");
            const n = row ? Number(row.getAttribute("data-episode")) : NaN;
            if (Number.isFinite(n) && !other && row?.getAttribute("aria-disabled") !== "true") onIntent?.(n);
          }}
        >
          {shownEpisodes.length === 0 ? (
            <p className="px-4 py-6 text-[15px] text-soft" role="status" data-testid="season-episodes-empty">{other && otherAnime.isPending ? ui("Chargement des épisodes") : ui("Aucun épisode disponible pour le moment")}</p>
          ) : (
            <EpisodeList key={viewId} rich={immersive} simpleLabels={push} animeId={viewId} episodes={shownEpisodes} current={shownCurrent} progress={shownProgress} preserveScroll height="100%" onNavigate={close} onToggleSeen={(n, c) => void watched.toggle(n, c)} push={push} currentLabel={other ? ui("à regarder") : currentLabel} artwork={shownAnime ? { anime: shownAnime, previews } : undefined} />
          )}
        </div>
      </div>
    </Sheet>
    {open && watched.confirmation}
    <ConfirmSheet open={open && confirmAll} onClose={() => setConfirmAll(false)} title={ui("Tout marquer comme vu ?")} message={ui("Les {0} épisodes disponibles de cette saison seront marqués comme vus. Les autres saisons, l'historique et les listes restent conservés.", markable.length)} confirmLabel={ui("Marquer comme vus")} onConfirm={() => {
      setConfirmAll(false); setMarking(true);
      void (async () => { try { if (shownAnime) await upsertAnimeSummary(shownAnime); await markEpisodesCompleted(viewId, markable.map(e => e.number)); toast(ui("Épisodes marqués comme vus")); } catch { toast(ui("Impossible de modifier le suivi"), "error"); } finally { setMarking(false); } })();
    }} />
    </>
  );
}
