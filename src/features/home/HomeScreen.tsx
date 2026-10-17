"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { ChevronRight, History, Library, Search, Settings } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/LogoMark";
import { IconLink } from "@/components/ui/Button";
import { Poster } from "@/components/ui/Poster";
import { useToast } from "@/components/ui/Toast";
import { HOME } from "@/config/app";

import { ContinueCard } from "@/features/anime/AnimeCards";
import { useHomeFeeds, useUpcomingReleases } from "@/features/library/hooks";
import { useSearchOverlay } from "@/features/search/overlay/SearchOverlay";
import { useTitles } from "@/features/settings/PreferencesContext";
import { releaseWhen } from "@/lib/airing/schedule";
import { dismissContinue, undoDismissContinue } from "@/lib/db/progress";
import { formatEpisodeNumber } from "@/lib/providers/episodes";
import { routes } from "@/lib/utils/routes";
import type { AnimeSummary } from "@/types/anime";
import { useNextToWatchPreResolve } from "./preResolve";
import { HomeLanguageMenu } from "./HomeLanguageMenu";

/**
 * The Home is a calm, useful glance — never a discovery page (no trends, no suggestions). Two blocks that use the available height and scroll when needed: « Continuer » (what to watch next: the episode in progress, the one that just aired, the one that waits) and
 * « À venir » (the next releases of the anime the viewer explicitly follows, three lines and a way to the planning). Lists
 * remain reachable from the compact secondary navigation.
 */
export function HomeScreen({ active = true }: { active?: boolean }) {
  useInterfaceLanguage();
  const feeds = useHomeFeeds(active);
  const upcoming = useUpcomingReleases(HOME.upcomingShown, active);
  const toast = useToast();
  const overlay = useSearchOverlay();
  const dismiss = (animeId: number) =>
    void dismissContinue(animeId).then((id) => {
      if (id) toast(ui("Retiré de Continuer progression conservée"), "success", { label: ui("Annuler"), onSelect: () => void undoDismissContinue(id), durationMs: HOME.undoMs });
    });

  const fresh = feeds?.upNext.filter((u) => u.isNew) ?? [];
  const waiting = feeds?.upNext.filter((u) => !u.isNew) ?? [];
  const total = (feeds?.continueItems.length ?? 0) + fresh.length + waiting.length;
  // The episode most likely to be played next: resuming first, else the next one.
  const resume = feeds?.continueItems[0];
  const first = feeds?.upNext[0];
  useNextToWatchPreResolve(active ? resume ? { anime: resume.anime.summary, episodeNumber: resume.progress.episodeNumber } : first ? { anime: first.anime.summary, episodeNumber: first.episodeNumber } : null : null);

  return (
    // Content owns its height; the shell reserves the fixed dock and safe area.
    <div className="home-screen safe-top flex flex-col">
      <header className="home-header px-safe flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label={ui("MaximAnim, accueil")}>
          <LogoMark size={32} />
          <h1 className="display-title text-[27px] leading-none sm:text-[30px]">MaximAnim<span className="text-accent" aria-hidden="true">.</span></h1>
        </Link>
        {/* Search is also a tab of the bottom bar: here it is one tap, not a 48 px field pushing everything down. */}
        <div className="flex items-center gap-1.5">
          <span className="home-header-search"><IconLink href={routes.search()} label={ui("Rechercher un anime")} aria-haspopup="dialog" data-testid="home-search" onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); overlay.open(event.currentTarget); }}>
            <Search size={20} aria-hidden="true" />
          </IconLink></span>
          <HomeLanguageMenu />
          <IconLink href={routes.settings()} label={ui("Réglages")}>
            <Settings size={20} aria-hidden="true" />
          </IconLink>
        </div>
      </header>



      <section aria-labelledby="continue-title" className="mb-6" data-testid="home-continue">
        <BlockHeader id="continue-title" title={ui("Continuer")} count={feeds ? total : null} />
        <div className={`home-continue-body${feeds !== undefined && total === 0 ? " home-continue-resolved-empty" : ""}`}>{feeds === undefined ? (
          <RailSkeleton />
        ) : total === 0 ? (
          <p className="px-safe text-[15px] text-soft" data-testid="home-continue-empty">
            {ui("Rien à continuer pour l'instant. Lance un épisode : il apparaîtra ici.")}</p>
        ) : (
          <div className="home-feed" data-testid="home-continue-rail">
            {feeds.continueItems.map(({ anime, progress }, i) => (
              <ContinueCard
                key={anime.id}
                anime={anime.summary}
                href={routes.watch(anime.id, progress.episodeNumber)}
                episodeNumber={progress.episodeNumber}
                percentage={progress.percentage}
                currentTime={progress.currentTime}
                duration={progress.duration}
                completed={progress.completed}
                priority={i < HOME.eagerPosterCount}
                onDismiss={() => dismiss(anime.id)}
              />
            ))}
            {/* What just aired first, then what merely waits for you. */}
            {[...fresh, ...waiting].map(({ anime, episodeNumber, isNew, artworkAllowed }) => (
              <NextCard key={anime.id} anime={anime.summary} episodeNumber={episodeNumber} isNew={isNew} artworkAllowed={artworkAllowed} onDismiss={() => dismiss(anime.id)} />
            ))}
          </div>
        )}
        </div>
      </section>

      <section aria-labelledby="upcoming-title" className="mb-4" data-testid="home-upcoming">
        <BlockHeader
          id="upcoming-title"
          title={ui("À venir")}
          action={
            <Link href={routes.schedule()} className="flex min-h-11 items-center gap-0.5 pl-2 text-[15px] font-medium text-paper transition-opacity active:opacity-60" data-testid="week-link">
              {ui("Voir le planning")}<ChevronRight size={16} className="text-accent" aria-hidden="true" />
            </Link>
          }
        />
        <Upcoming data={upcoming} />
      </section>
      <nav aria-label={ui("Bibliothèque et historique")} className="px-safe mb-4 flex flex-wrap gap-2">
        <Link href="/lists" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-paper"><Library size={17} className="text-accent" aria-hidden="true" />{ui("Listes / Bibliothèque")}</Link>
        <Link href="/history" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-paper"><History size={17} className="text-accent" aria-hidden="true" />{ui("Historique")}</Link>
      </nav>
    </div>
  );
}

/** A title on the left, the count (or a quiet action) on the right: one baseline, one alignment for every block. */
function BlockHeader({ id, title, count = null, action }: { id: string; title: string; count?: number | null; action?: ReactNode }) {
  useInterfaceLanguage();
  return (
    <div className="px-safe mb-2 flex min-h-11 items-center justify-between gap-3">
      <h2 id={id} className="display-section">
        {title}
      </h2>
      {count != null && count > 0 && (
        <span className="flex h-6 min-w-6 items-center justify-center px-2 text-[13px] leading-none text-soft tabular-nums" aria-label={ui("{0} à continuer", count)} data-testid="home-count">
          {count}
        </span>
      )}
      {action}
    </div>
  );
}

/** The episode after the one just finished, in the same card as Continuer (no progress to show). */
function NextCard({ anime, episodeNumber, isNew, artworkAllowed, onDismiss }: { anime: AnimeSummary; episodeNumber: number; isNew: boolean; artworkAllowed: boolean; onDismiss: () => void }) {
  useInterfaceLanguage();
  return <ContinueCard anime={anime} href={routes.watch(anime.id, episodeNumber)} episodeNumber={episodeNumber} percentage={0} currentTime={0} duration={0} artworkAllowed={artworkAllowed} onDismiss={onDismiss} nextLabel={isNew ? ui("Nouveau") : undefined} />;
}

/** The next announced releases of what is followed. Nothing guessed: AniList's own schedule, else a calm sentence. */
function Upcoming({ data }: { data: ReturnType<typeof useUpcomingReleases> }) {
  useInterfaceLanguage();
  const { main } = useTitles();
  if (data === undefined) {
    return (
      <div className="px-safe flex flex-col gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-9 rounded-lg" />
        ))}
      </div>
    );
  }
  if (data.items.length === 0) {
    return (
      <p className="px-safe text-[15px] text-soft" data-testid="home-upcoming-empty">
        {data.followed === 0 ? ui("Aucun anime suivi.") : ui("Aucune sortie annoncée.")}
      </p>
    );
  }
  return (
    <ul className="px-safe flex flex-col" data-testid="home-upcoming-list">
      {data.items.map((r) => (
        <li key={`${r.animeId}:${r.episode}`}>
          <Link href={routes.anime(r.animeId)} className="upcoming-row" data-testid="upcoming-row">
            <Poster cover={r.record.summary.coverImage} alt="" sizes="44px" className="w-11 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 block text-[15px] font-semibold leading-snug">{main(r.record.summary.titles)}</span>
              <span className="mt-1 block text-[13px] text-soft">{ui("Épisode") + " "}{formatEpisodeNumber(r.episode)}</span>
            </span>
            <time dateTime={new Date(r.at).toISOString()} className="shrink-0 text-right text-[13px] text-soft tabular-nums">{releaseWhen(r.at)}</time>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function RailSkeleton() {
  useInterfaceLanguage();
  return (
    <div aria-hidden="true">
      <div className="home-feed">
        {Array.from({ length: 1 }, (_, i) => (
          <div key={i} className="skeleton aspect-video w-full rounded-[var(--radius-card)]" />
        ))}
      </div>
    </div>
  );
}
