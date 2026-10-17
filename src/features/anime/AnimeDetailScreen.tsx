"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { BookmarkCheck, BookmarkPlus, Play, RotateCcw } from "lucide-react";
import { getImageProps } from "next/image";
import { useArtworkTone } from "@/components/layout/ArtworkPalette";
import { RC10 } from "@/config/app";
import { MEDIA } from "@/config/media";
import { useDelayedFlag } from "@/hooks/useDelayedFlag";
import { rememberArtwork } from "@/lib/artwork/reveal";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { StickyTitleBar, useScrolledPast } from "@/components/layout/DetailHeader";
import { DetailTopBar } from "@/components/layout/DetailTopBar";
import { intent } from "@/features/catalogue/queries";
import { animeQueryKey } from "./useAnime";
import { toneVars } from "@/components/layout/ToneScope";
import { NEUTRAL_TONE } from "@/lib/utils/tone";
import { useDesktopLayout } from "@/hooks/useDesktopLayout";
import { heroSources, plateSizes, rankHeroSources } from "@/lib/artwork/hero-art";
import { probeArtwork } from "@/lib/artwork/probe";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { InlineEpisodes } from "@/features/episodes/InlineEpisodes";
import { useActiveProvider, useDeveloperMode } from "@/features/episodes/useEpisodes";
import { prefetchWatch } from "@/features/player/streams";


import { EmptyState } from "@/components/ui/EmptyState";
import { Poster } from "@/components/ui/Poster";
import { useAnimeProgress, useLists } from "@/features/library/hooks";
import { AiringBell, CompletionAction, TrackingRow } from "@/features/library/TrackingRow";
import { AddToListSheet } from "@/features/lists/AddToListSheet";
import { usePreferences, useTitles } from "@/features/settings/PreferencesContext";
import { AniListError } from "@/lib/anilist/client";
import { availableEpisodeCount, isSingleItem } from "@/lib/anilist/normalize";

import { useAiringClock } from "@/lib/airing/useAiringClock";
import { primaryAction } from "@/lib/progress/primary-action";
import { shownLinks } from "@/lib/anilist/links";
import { routes } from "@/lib/utils/routes";
import type { Anime, Franchise } from "@/types/anime";
import { FranchiseOthers, SeasonStrip } from "@/features/franchise/SeasonStrip";
import { useFranchise } from "@/features/franchise/useFranchise";
import { AboutDisclosure } from "./AboutDisclosure";
import { AnimeFacts, factsOf } from "./AnimeFacts";
import { StaffBlock } from "./DetailSections";
import { useAnime } from "./useAnime";
import { useContentMark } from "@/lib/perf/use-content-mark";
import { pushOpened } from "@/lib/search/recent";
import { AnimeHero } from "./AnimeHero";
import { heroStageVars } from "@/lib/artwork/hero-art";
import { AnimeDetailSkeleton, EpisodesPlaceholder } from "./AnimeDetailSkeleton";
import { tmdbArtworkOptions } from "@/features/episodes/useTmdbArtwork";
import { tmdbLogo } from "@/lib/artwork/tmdb";
import { officialTitleLogo } from "@/lib/artwork/title-logos";

/** The season being looked at: the URL's own id (the season tabs replace it in place), else the route's. */
export function selectedAnimeId(pathname: string | null, routeId: number): number {
  const match = pathname ? /^\/anime\/(\d+)\/?$/.exec(pathname) : null;
  const id = match ? Number(match[1]) : NaN;
  return Number.isInteger(id) && id > 0 ? id : routeId;
}

/**
 * ONE stable series shell. Choosing a season (S1 / S2 / S3) selects another AniList entry INSIDE this page: the hero, the title
 * block and the play action stay where they are and take the chosen entry's data as it arrives, the URL is replaced in
 * place (`history.replaceState`, never a push: Back leaves the series in one step, not through every season visited) and no
 * server round-trip happens. Entries stay separate (own id, own progress, own facts): nothing is merged.
 */
export function AnimeDetailScreen({ id: routeId, openLab = false }: { id: number; openLab?: boolean }) {
  useInterfaceLanguage();
  const { showAdult } = usePreferences();
  const id = selectedAnimeId(usePathname(), routeId);
  const query = useAnime(id);
  // « Récents » on Search: the anime the viewer OPENED (this device only). A season chosen inside the page is not another opening.
  const opened = query.data?.anime;
  useLayoutEffect(() => {
    if (opened && opened.id === routeId) pushOpened(opened);
  }, [opened, routeId]);
  // What the shell shows while the selected season is still arriving: the last one that loaded (never a blank page).
  const loaded = query.data ?? null;
  const [last, setLast] = useState(loaded);
  if (loaded && loaded !== last) setLast(loaded);

  if (loaded?.anime.isAdult === true && !showAdult) return <div><DetailTopBar fallback={routes.home()} /><EmptyState title={ui("Contenu explicite masqué")} action={<ButtonLink href={routes.settings()} variant="secondary">{ui("Préférences de découverte")}</ButtonLink>} /></div>;

  if (query.isPending && last) return <AnimeDetail anime={last.anime} fromCache={last.source === "cache"} openLab={openLab} selectedId={id} switching />;
  if (query.isPending) return <AnimeDetailSkeleton label={ui("Chargement de la fiche")} />;
  if (query.isError) {
    const notFound = query.error instanceof AniListError && query.error.kind === "notFound";
    return (
      <div>
        <DetailTopBar fallback={routes.home()} />
        <div className="px-safe mt-6">
          <EmptyState
           
            title={notFound ? ui("Cet anime n'existe pas sur AniList") : ui("Impossible de charger cet anime")}
            tone={notFound ? "calm" : "warning"}
            action={!notFound && <Button variant="secondary" onClick={() => void query.refetch()}>{ui("Réessayer")}</Button>}
          >
            {notFound ? ui("Le lien est peut-être incorrect.") : ui("AniList est injoignable et cette fiche n'a pas encore été enregistrée hors ligne.")}
          </EmptyState>
        </div>
      </div>
    );
  }
  return <AnimeDetail anime={query.data.anime} fromCache={query.data.source === "cache"} openLab={openLab} selectedId={id} />;
}

function AnimeDetail({ anime, fromCache, openLab, selectedId, switching = false }: { anime: Anime; fromCache: boolean; openLab: boolean; /** The season chosen in the tabs (the data of `anime` catches up while `switching`). */ selectedId: number; switching?: boolean }) {
  useInterfaceLanguage();
  const { showAdult, titleLanguage } = usePreferences();
  const { main } = useTitles();
  const lists = useLists();
  const [sheetOpen, setSheetOpen] = useState(false);
  const title = main(anime.titles);
  const inAnyList = lists?.some((l) => l.entries.some((e) => e.animeId === anime.id)) ?? false;
  // Artwork hue, bounded for contrast and cached per entry and cover URL.
  const { tone: artworkTone, onArtworkLoad } = useArtworkTone(anime);
  // While the chosen season is still arriving the page wears no season's colour: the previous one would sit under a new selection.
  const tone = switching ? NEUTRAL_TONE : artworkTone;
  const desktop = useDesktopLayout();
  const facts = factsOf(anime, { originHref: anime.sourceWork ? routes.work(anime.sourceWork.id, anime.source === "LIGHT_NOVEL" || anime.source === "WEB_NOVEL" ? anime.source : null) : null, studioHref: routes.studio });
  const { franchise, resolved, failed } = useFranchise(anime);
  const queryClient = useQueryClient();
  useContentMark(`anime:${anime.id}`, true);
  const { ref: compactRef, scrolled: compactScrolled } = useScrolledPast();
  // Choosing a season replaces the URL in place: no new history entry, no navigation, the page stays mounted.
  const selectSeason = useCallback((next: number) => {
    window.history.replaceState(null, "", `${routes.anime(next)}${window.location.search}`);
  }, []);
  // The seasons next to the one being read are fetched in the background once the series is known (a bounded two, never the
  // whole franchise, never before the first render has what it needs): the next tap on a tab finds its data already there.
  const neighbours = resolved ? adjacentSeasonIds(franchise, selectedId) : [];
  const neighbourKey = neighbours.join(",");
  useEffect(() => {
    if (!neighbourKey) return;
    let cancelled = false;
    for (const n of neighbourKey.split(",")) {
      const id = Number(n);
      void (async () => {
        await intent.anime(queryClient, id);
        if (cancelled) return;
        const cached = queryClient.getQueryData<{ anime: Anime }>(animeQueryKey(id))?.anime;
        if (!cached || (cached.isAdult === true && !showAdult)) return;
        // Only two adjacent seasons; use the same optimizer candidates as the real images.
        const cover = cached.coverImage.extraLarge ?? cached.coverImage.large ?? cached.coverImage.medium;
        await queryClient.prefetchQuery(tmdbArtworkOptions(id));
        if (cancelled) return;
        const art = queryClient.getQueryData<import("@/lib/artwork/tmdb").TmdbArtwork>(["tmdb-artwork", id]);
        const logo = titleLanguage === "native" ? officialTitleLogo(id, titleLanguage) ?? tmdbLogo(art, titleLanguage) : tmdbLogo(art, titleLanguage);
        // The hero's picture is the one `lib/artwork/hero-art.ts` will decide on for this entry (the cover, as a poster, on a phone):
        // it is warmed in the very mode the hero loads it in (CORS), so it is one download and the hero finds it decoded.
        const heroCandidates = heroSources({ cover, banner: cached.bannerImage, artwork: art, desktop });
        const heroPick = desktop ? null : rankHeroSources(heroCandidates)[0];
        const hero = (desktop ? heroCandidates[0] : heroPick?.source)?.src ?? null;
        const heroSizes = heroPick ? plateSizes(heroPick.fit, desktop) : RC10.heroImageSizes;
        for (const item of [{ src: cover, sizes: "30px", quality: 85, hero: false }, { src: hero, sizes: heroSizes, quality: 85, hero: true }, { src: logo?.src, sizes: RC10.heroLogoSizes, quality: 85, hero: false }]) {
          if (!item.src) continue;
          const { props } = getImageProps({ src: item.src, sizes: item.sizes, quality: item.quality, alt: "", fill: true });
          const image = new window.Image();
          if (item.hero) image.crossOrigin = "anonymous";
          image.sizes = props.sizes ?? ""; image.srcset = props.srcSet ?? "";
          // Once it has loaded it is "seen": the season's own hero and logo then paint at once, with no fade and no skeleton.
          const source = item.src;
          if (item.hero || source !== cover) image.onload = () => { rememberArtwork(source); if (item.hero) void probeArtwork(source).catch(() => {}); };
          image.src = props.src;
        }
      })();
    }
    return () => { cancelled = true; };
  }, [neighbourKey, queryClient, showAdult, titleLanguage, desktop]);
  // The chosen season's data is still arriving. Quick or cached changes never show this; a slow one dims what belongs to the
  // season being left and replaces its pictures (episode stills) with placeholders, so nothing of it passes for the new one.
  const stale = useDelayedFlag(switching, MEDIA.staleContentDelayMs);
  const dim = switching ? `pointer-events-none ${stale ? "opacity-45" : ""}` : "";
  const fade = "transition-opacity duration-150 motion-reduce:transition-none";
  const links = shownLinks({ id: anime.id, siteUrl: anime.siteUrl, links: anime.externalLinks });

  // The ONE way into the viewer's lists: the bookmark, top right (also in the compact bar). The bell sits next to it, only for a title
  // that can still gain episodes.
  const addToList = (
    <div className="flex items-center gap-1">
      <AiringBell anime={anime} />
      <IconButton label={inAnyList ? ui("Gérer les listes") : ui("Ajouter à une liste")} variant="overlay" onClick={() => setSheetOpen(true)}>
        {inAnyList ? <BookmarkCheck size={20} className="context-accent" aria-hidden="true" /> : <BookmarkPlus size={20} aria-hidden="true" />}
      </IconButton>
    </div>
  );
  return (
    <article className="contextual-content relative" style={toneVars(tone)} aria-busy={switching} data-testid="series-shell" data-anime-id={anime.id}>
      <StickyTitleBar
        visible={!switching && compactScrolled}
        fallback={routes.home()}
        title={title}
        image={{ render: (size) => <Poster cover={anime.coverImage} alt="" sizes={`${size}px`} className="w-full" rounded="rounded-md" onArtworkLoad={onArtworkLoad} /> }}
        actions={addToList}
      />
      <div className="anime-stage relative" style={heroStageVars as CSSProperties}>
        {/* The art, the header and the season row are ONE stage of a fixed height: the picture runs behind all of it and dissolves
            at the stage's bottom edge, before the episodes. */}
        <AnimeHero key={titleLanguage} franchise={franchise} franchiseResolved={resolved} franchiseFailed={failed} rootTitle={resolved && franchise.main.length > 1 && franchise.main[0]!.entry.id !== anime.id ? main(franchise.main[0]!.entry.titles) : null} anime={anime} title={title} preference={titleLanguage} switching={switching} fromCache={fromCache} controls={<DetailTopBar variant="overlay" fallback={routes.home()} actions={addToList} />} />
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col">
          <div ref={compactRef} className="pointer-events-none h-px" aria-hidden="true" />
          {/* Right under the title, and above everything that changes from one season to the next: the selector never moves. */}
          <div className="anime-season-controls mt-3">
            <SeasonStrip franchise={franchise} currentId={selectedId} resolved={resolved} failed={failed} onSelect={selectSeason} showNotice={false} />
          </div>
          <div key={`watch-${anime.id}`} className={`season-content ${fade} ${dim}`}>
            <WatchPanel key={anime.id} anime={anime} openLab={openLab} />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col">
        {/* Facts and credits update within the same layout; pending data keeps the previous content. */}
        <div key={`details-${anime.id}`} className={`season-content mt-4 flex flex-col gap-6 ${fade} ${dim}`}>
          {stale ? <EpisodesPlaceholder /> : <InlineEpisodes key={anime.id} anime={anime} />}
          <AnimeFacts facts={facts} anime={anime} />
          <StaffBlock staff={anime.staff} linkTo={(personId) => routes.person(personId, anime.id)} allHref={routes.staff(anime.id)} />
          <FranchiseOthers franchise={franchise} currentId={anime.id} />
          {resolved && franchise.truncated && !franchise.continuous && franchise.main.length > 1 && <p className="px-safe text-[12px] text-muted">{ui("Franchise très longue : la liste peut être incomplète.")}</p>}
          <AboutDisclosure anime={anime} links={links} />
        </div>
      </div>

      <AddToListSheet open={sheetOpen} onClose={() => setSheetOpen(false)} anime={anime} />
    </article>
  );
}

/** The seasons right before and after the selected one in the main series (at most two). */
export function adjacentSeasonIds(franchise: Franchise, id: number): number[] {
  if (franchise.continuous) return [];
  const i = franchise.main.findIndex((m) => m.entry.id === id);
  if (i < 0) return [];
  return [franchise.main[i - 1]?.entry.id, franchise.main[i + 1]?.entry.id].filter((n): n is number => n != null);
}

export { primaryAction, type PrimaryAction } from "@/lib/progress/primary-action";

/**
 * Under the stage: for a FILM, « Lire » (one item, no list) with its tracking; for a series nothing — the episode to start or resume
 * is highlighted in the episode list itself, and the tracking sits in that list's header. Developer tooling stays here (developer
 * mode, or when the Lab is asked for explicitly). A film keeps one fixed footprint (a 48 px action slot) whatever its state is.
 */
function WatchPanel({ anime, openLab }: { anime: Anime; openLab: boolean }) {
  useInterfaceLanguage();
  const progress = useAnimeProgress(anime.id, { seed: true });
  const now = useAiringClock(anime.nextAiring?.airingAt);
  const available = availableEpisodeCount(anime, now);
  const total = available ?? anime.episodeCount;
  // A film is one item: « Lire », no episode list.
  const single = isSingleItem(anime);
  const queryClient = useQueryClient();
  const { provider } = useActiveProvider(anime.id, anime);
  // Source tooling is not part of choosing what to watch: it lives in the player's source sheet, Réglages → Sources and
  // the Source Lab. The page shows it only in developer mode; the Lab also opens when it is asked for explicitly (?lab=1,
  // the link in « Dépannage avancé »).
  const developerMode = useDeveloperMode();
  // The source's runtime starts while the page is read: no content is requested.
  useEffect(() => {
    void provider?.warm?.();
  }, [provider]);

  const records = progress ?? [];
  const action = progress ? primaryAction({ single, records, available, total }) : null;
  const notAired = available === 0;

  const lab = available !== 0 && (developerMode || openLab);
  if (!single && !developerMode && !lab) return null;

  return (
    <section aria-label={ui("Visionnage")} className="px-safe mt-2" data-testid="watch-panel">
      <div className="flex flex-col gap-2.5">
        {single && (
          <div className="flex h-12 items-center gap-2" data-testid="primary-slot">
            <div className="h-12 min-w-0 flex-1">
              {progress === undefined ? (
                <div className="skeleton h-12 w-full rounded-[14px]" aria-hidden="true" />
              ) : action ? (
                <ButtonLink
                  href={routes.watch(anime.id, action.episode)}
                  className="anime-primary"
                  size="lg"
                  block
                  icon={action.label === "Revoir" ? <RotateCcw size={19} aria-hidden="true" /> : <Play size={19} fill="currentColor" aria-hidden="true" />}
                  aria-label={ui(action.label)}
                  onPointerDown={() => void prefetchWatch(queryClient, anime, provider, action.episode, { prepare: true })}
                >
                  <span>{ui(action.label)}</span>
                </ButtonLink>
              ) : (
                <p className="flex h-12 items-center justify-center rounded-[14px] border border-line text-[15px] text-soft" data-testid="primary-status">
                  {notAired ? ui("Pas encore diffusé") : ui("À jour prochain épisode à venir")}
                </p>
              )}
            </div>
            <TrackingRow anime={anime} compact bell={false} />
          </div>
        )}
        {single && <CompletionAction anime={anime} />}


      </div>
    </section>
  );
}
