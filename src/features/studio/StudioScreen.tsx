"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import { useVisiblePagination } from "@/features/catalogue/useVisiblePagination";
import { DetailHeader } from "@/components/layout/DetailHeader";
import { DisclosureRow } from "@/components/ui/DisclosureRow";
import { LoadMoreSentinel } from "@/components/ui/LoadMoreSentinel";
import { SectionTitle } from "@/components/ui/Section";
import { studioWorksOptions } from "@/features/catalogue/queries";
import { PageSkeleton, PageState } from "@/features/catalogue/shared";
import { FilmographyCard } from "@/features/catalogue/FilmographyCard";
import { Timeline, TimelineControls, type FilmographyView } from "@/features/catalogue/Timeline";
import { fetchStudioPage, type StudioWork } from "@/lib/anilist/catalogue";
import { groupTimeline, matchesFilter, showTimelineControls, type TimelineFilter, type TimelineOrder } from "@/lib/catalogue/timeline";
import { useContentMark } from "@/lib/perf/use-content-mark";
import { routes } from "@/lib/utils/routes";
import { StudioWorkRow } from "./StudioWorkRow";
import { usePreferences } from "@/features/settings/PreferencesContext";
import { useViewingIndex } from "@/features/library/hooks";
import { et } from "@/lib/i18n/messages-entities";

type StudioPages = Awaited<ReturnType<typeof fetchStudioPage>>;

/** The part of an infinite query the list needs. */
interface WorksQuery {
  isPlaceholderData?: boolean;
  isPending: boolean;
  isError: boolean;
  data?: { pages: StudioPages[]; pageParams: unknown[] };
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<{ data?: { pages: StudioPages[] }; hasNextPage: boolean; isError?: boolean }>;
  refetch: () => unknown;
}

function useStudioWorks(id: number, isMain: boolean, enabled: boolean) {
  return useInfiniteQuery({ ...studioWorksOptions(id, isMain), enabled });
}

/** AniList does not say what a company did on each production it is credited on: said once, never turned into a claim. */

/**
 * A studio's own page: all principal works in one chronology, including announced titles. Secondary credits have one
 * bounded existence probe; further pages load only when opened and scrolled. AniList gives no country or history and none is
 * invented; it does not always say what a company did on a production, so a credit is never written as « X a animé Y ».
 */
export function StudioScreen({ id }: { id: number }) {
  useInterfaceLanguage();
  const main = useStudioWorks(id, true, true);
  const [showOthers, setShowOthers] = useState(false);
  // One bounded first page establishes whether a secondary-credit section exists. Remaining pages stay lazy.
  const others = useStudioWorks(id, false, true);
  const studio = main.data?.pages[0]?.studio;
  useContentMark(`studio:${id}`, Boolean(studio));
  const { showAdult: adultShown } = usePreferences();
  // AniList has no founding date: the oldest work it lists is the only « first » that can be said, and it is said as that.
  // Same cache entry as the « Plus ancien » order of the list: opening that order later costs nothing.
  const oldest = useInfiniteQuery({ ...studioWorksOptions(id, true, false, "oldest"), enabled: false });
  const firstYear = useMemo(() => {
    // Only what is certain: the whole main list is loaded, or the list was read oldest first (page 1 then starts at the oldest work).
    const pages = !main.hasNextPage ? main.data?.pages : oldest.data?.pages.slice(0, 1);
    const years = (pages ?? []).flatMap((p) => p.works).filter((w) => adultShown === true || w.entry.isAdult !== true).map((w) => w.entry.startDate?.year ?? w.entry.seasonYear).filter((y): y is number => y != null);
    return years.length ? Math.min(...years) : null;
  }, [main.data, main.hasNextPage, oldest.data, adultShown]);
  // A work listed both as a main and as a secondary credit (AniList lists a studio twice on some) shows once, in the main list.
  const mainIds = useMemo(() => new Set((main.data?.pages ?? []).flatMap((p) => p.works.map((w) => w.entry.id))), [main.data]);
  if (main.isPending) return <PageSkeleton label={ui("Chargement du studio")} />;
  if ((main.isError && !studio) || !studio) return <PageState error={main.error} subject={ui("Ce studio")} onRetry={() => void main.refetch()} back={routes.home()} />;
  const animation = studio.isAnimationStudio;

  return (
    <div className="contextual-content pb-4" style={studio.id === 11 ? { "--tone": "#f28d9c", "--studio-mark": "#D10025" } as CSSProperties : undefined}>
      {/* Official vector mark, fetched from madhouse.co.jp; unknown studios have no invented mark. */}
      <DetailHeader fallback={routes.home()} title={studio.name} titleTestId="studio-name" context={animation ? ui("Studio d'animation") : ui("Société de production")} identityMark={studio.id === 11 ? <Image src="/studios/madhouse.svg" alt={ui("Logo officiel MADHOUSE")} width={160} height={40} className="h-8 w-auto" /> : undefined} />
      {(firstYear != null || !animation) && (
        <div className="px-safe mx-auto -mt-1 mb-3 flex max-w-4xl flex-col gap-0.5">
          {firstYear != null && <p className="text-[15px] font-medium text-paper tabular-nums" data-testid="studio-first-work">{et("Première œuvre connue", firstYear)}</p>}
          {!animation && <p className="text-[13px] text-soft">{ui("Fonction non précisée par AniList.")}</p>}
        </div>
      )}

      <div className="px-safe mx-auto flex max-w-4xl flex-col gap-7">
        <Works id={id} isMain title={animation ? ui("Œuvres principales") : ui("Crédits principaux")} emptyText={ui("AniList ne liste aucune production principale pour ce studio.")} query={main} testId="studio-main" />

        {(others.isPending || others.isError || others.hasNextPage || others.data?.pages.some(p => p.works.some(w => !mainIds.has(w.entry.id)))) && <DisclosureRow label={ui("Autres participations")} onOpen={() => setShowOthers(true)} testId="studio-show-others">
          <p className="mt-2 text-sm text-soft">{ui("Studio secondaire.") + " "}{ui("Fonction non précisée par AniList.")}</p>
          {showOthers && <Works id={id} isMain={false} title={null} emptyText={ui("Aucune participation secondaire répertoriée.")} query={others} testId="studio-others" skip={mainIds} />}
        </DisclosureRow>}

        {studio.siteUrl && (
          <section aria-label={ui("Liens")}>
            <SectionTitle className="mb-1 text-[17px]">{ui("Liens")}</SectionTitle>
            <a href={studio.siteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-[15px] text-soft underline decoration-line underline-offset-4">
              AniList
              <ExternalLink size={14} className="text-muted" aria-hidden="true" />
            </a>
          </section>
        )}
      </div>
    </div>
  );
}

function Works({ id, isMain, title, emptyText, query: originalQuery, testId, skip }: { id: number; isMain: boolean; title: string | null; emptyText: string; query: WorksQuery; testId: string; skip?: ReadonlySet<number> }) {
  useInterfaceLanguage();
  const { showAdult } = usePreferences();
  const [order, setOrder] = useState<TimelineOrder>("newest");
  const [view, setView] = useState<FilmographyView>("list");
  const chronological = useInfiniteQuery({
    ...studioWorksOptions(id, isMain, false, order), enabled: order === "oldest",
    placeholderData: (previous, previousQuery) => {
      const sameStudio = previousQuery?.queryKey[1] === id && previousQuery.queryKey[2] === (isMain ? "main" : "other");
      return (sameStudio ? previous : undefined) ?? (originalQuery.data ? { pages: originalQuery.data.pages, pageParams: originalQuery.data.pages.map((_, i) => i + 1) } : undefined);
    },
  });
  const baseQuery = order === "oldest" ? chronological : originalQuery;
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const upcoming = useInfiniteQuery({ ...studioWorksOptions(id, isMain, true, order), enabled: filter === "upcoming" });
  const query = filter === "upcoming" ? upcoming : baseQuery;
  const works = useMemo<StudioWork[]>(() => {
    const seen = new Set<number>();
    return [...(baseQuery.data?.pages ?? []), ...(filter === "upcoming" ? upcoming.data?.pages ?? [] : [])].flatMap((p) => p.works).filter((w) => (showAdult === true || w.entry.isAdult !== true) && !skip?.has(w.entry.id) && !seen.has(w.entry.id) && seen.add(w.entry.id));
  }, [baseQuery.data, upcoming.data, filter, skip, showAdult]);
  const viewing = useViewingIndex(works.map(w => w.entry.id));
  const timeline = useMemo(() => groupTimeline(works.filter((w) => matchesFilter(w.entry.status, filter)), (w) => w.entry, order), [works, filter, order]);
  const controls = showTimelineControls(works.map((w) => w.entry.status), baseQuery.hasNextPage);
  const shown = timeline.years.reduce((n, y) => n + y.items.length, 0);
  const pagination = useVisiblePagination({ ...query, hasNextPage: !query.isPlaceholderData && query.hasNextPage }, pages => [...(filter === "upcoming" ? baseQuery.data?.pages ?? [] : []), ...pages].flatMap(p => p.works).filter(w => (showAdult === true || w.entry.isAdult !== true) && !skip?.has(w.entry.id) && matchesFilter(w.entry.status, filter)).map(w => String(w.entry.id)));
  return (
    <section aria-label={title ?? ui("Participations en studio secondaire")} aria-busy={query.isPlaceholderData ?? false} data-testid={testId}>
      <TimelineControls view={{ value: view, onChange: setView }} title={title} show={controls} filter={filter} onFilter={setFilter} sort={{ show: controls.sort, order, onOrder: setOrder }} />
      {query.isPending && works.length === 0 ? (
        <div className="space-y-3 pt-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : query.isError && works.length === 0 ? (
        <div className="flex items-center gap-3 py-2">
          <p className="flex-1 text-[14px] text-soft">{ui("AniList ne répond pas.")}</p>
          <button type="button" onClick={() => void query.refetch()} className="min-h-11 text-[15px] font-medium text-accent">
            {ui("Réessayer")}</button>
        </div>
      ) : works.length === 0 && !query.hasNextPage ? (
        <p className="py-2 text-[14px] text-soft">{emptyText}</p>
      ) : (
        <>
          {shown === 0 && works.length > 0 ? (
            <p className="py-4 text-[14px] text-soft">{ui("Aucune œuvre ne correspond à ce filtre parmi celles chargées.")}</p>
          ) : (
            <Timeline view={view} timeline={timeline} keyOf={(w) => w.entry.id} row={(w) => view === "grid" ? <FilmographyCard entry={w.entry} progress={viewing?.progress[w.entry.id]} state={viewing?.states[w.entry.id]} /> : <StudioWorkRow entry={w.entry} progress={viewing?.progress[w.entry.id]} state={viewing?.states[w.entry.id]} />} testId={`${testId}-list`} />
          )}
          {query.isPending && <p className="py-2 text-sm text-soft" role="status">{ui("Chargement…")}</p>}
          {query.isError && !query.data ? <button type="button" onClick={() => void query.refetch()} className="min-h-11 text-sm font-medium context-accent">{ui("Réessayer")}</button> : <>
            {pagination.bounded && query.hasNextPage && <p className="text-sm text-soft" role="status">{ui("Aucune nouvelle œuvre dans les pages consultées.")}</p>}
            <LoadMoreSentinel hasMore={!query.isPlaceholderData && query.hasNextPage} loading={pagination.loading || query.isFetchingNextPage} failed={query.isError || pagination.failed} pages={query.data?.pages.length ?? 0} onLoad={() => void pagination.load()} label={ui("Afficher la suite")} />
          </>}
        </>
      )}
    </section>
  );
}
