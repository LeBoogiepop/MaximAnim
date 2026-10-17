"use client";


import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useArtworkTone } from "@/components/layout/ArtworkPalette";
import { toneVars } from "@/components/layout/ToneScope";
import { DetailHeader } from "@/components/layout/DetailHeader";
import { useVisiblePagination } from "@/features/catalogue/useVisiblePagination";
import { LoadMoreSentinel } from "@/components/ui/LoadMoreSentinel";
import { Poster } from "@/components/ui/Poster";
import { SectionTitle } from "@/components/ui/Section";
import { TabRow } from "@/components/ui/TabRow";
import { GRAPH_PAGES } from "@/config/app";
import { PersonAvatar } from "@/features/anime/DetailSections";
import { useAnime } from "@/features/anime/useAnime";
import { PageSkeleton, PageState, retryTransient } from "@/features/catalogue/shared";
import { useTitles } from "@/features/settings/PreferencesContext";
import { fetchStaffPage, type StaffPersonRoles } from "@/lib/anilist/catalogue";
import { mergeRoles, ROLE_CATEGORIES } from "@/lib/anilist/roles";
import { type CategoryFilter, categoriesPresent, cleanRoles, creditEpisodes, filterByCategory, filterByEpisode, groupPeopleByCategory } from "@/lib/catalogue/credits";
import { useContentMark } from "@/lib/perf/use-content-mark";
import { routes } from "@/lib/utils/routes";

/**
 * « Tout le staff »: every credit AniList lists for the anime, by kind of work (Réalisation, Scénario, Animation, Art, Son &
 * musique, Production…), one person per row with what they did — the small credits are secondary, not deleted. When AniList
 * wrote episodes in the roles (« Storyboard (ep 5) »), the staff can be narrowed to one episode: only from what the credits
 * literally say. Dubs are never staff of the original version. Loaded page by page, only when the viewer comes here.
 */
export function StaffScreen({ animeId }: { animeId: number }) {
  useInterfaceLanguage();
  const { main } = useTitles();
  const anime = useAnime(animeId);
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [episode, setEpisode] = useState<number | null>(() => {
    const n = Number(params.get("episode"));
    return Number.isInteger(n) && n > 0 ? n : null;
  });
  const query = useInfiniteQuery({
    queryKey: ["staff", animeId],
    queryFn: ({ pageParam, signal }) => queryClient.fetchQuery({ queryKey: ["staff-page", animeId, pageParam], queryFn: () => fetchStaffPage(animeId, pageParam, signal), staleTime: GRAPH_PAGES.staleMs }),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (last.hasNext ? pages.length + 1 : undefined),
    staleTime: GRAPH_PAGES.staleMs,
    retry: retryTransient,
    networkMode: "online",
  });
  useContentMark(`staff:${animeId}`, !query.isPending);
  // The same person can open several pages (one credit per line): merge them, drop the dubs.
  const people = useMemo<StaffPersonRoles[]>(() => {
    const byId = new Map<number, StaffPersonRoles>();
    for (const page of query.data?.pages ?? []) {
      for (const p of page.items) {
        const known = byId.get(p.id);
        byId.set(p.id, known ? { ...known, roles: [...known.roles, ...p.roles] } : p);
      }
    }
    return [...byId.values()].map((p) => ({ ...p, roles: cleanRoles(p.roles) })).filter((p) => p.roles.length > 0);
  }, [query.data]);
  const categories = useMemo(() => categoriesPresent(people), [people]);
  const episodes = useMemo(() => [...new Set([...creditEpisodes(people), ...Array.from({ length: anime.data?.anime.episodeCount ?? 0 }, (_, i) => i + 1), ...(episode != null ? [episode] : [])])].sort((a, b) => a - b), [people, anime.data?.anime.episodeCount, episode]);
  const active: CategoryFilter = category === "all" || categories.includes(category) ? category : "all";
  const shown = useMemo(() => {
    let list = people;
    if (episode != null) list = filterByEpisode(list, episode);
    return groupPeopleByCategory(filterByCategory(list.map((p) => ({ entry: p, roles: p.roles })), active).map((c) => ({ ...c.entry, roles: c.roles })));
  }, [people, episode, active]);

  const pagination = useVisiblePagination(query, pages => filterByCategory(pages.flatMap(p => p.items).map(p => ({ entry: p, roles: cleanRoles(p.roles) })), active).filter(p => episode == null || filterByEpisode([{ ...p.entry, roles: p.roles }], episode).length > 0).map(p => `${p.entry.id}:${p.roles.join("|")}`));
  // Filtering must work from « Tout » too, even when the first staff page has
  // only series credits. The same bounded pagination is available manually.
  useEffect(() => {
    if (episode != null && !shown.length && query.hasNextPage && !pagination.loading && !pagination.failed && !pagination.bounded) void pagination.load();
  }, [episode, shown.length, query.hasNextPage, pagination]);
  const { tone } = useArtworkTone(anime.data?.anime ?? null);
  if (query.isPending) return <PageSkeleton label={ui("Chargement du staff")} back={routes.anime(animeId)} />;
  if (query.isError && !query.data) return <PageState error={query.error} subject={ui("Le staff")} onRetry={() => void query.refetch()} back={routes.anime(animeId)} />;
  const summary = anime.data?.anime;
  const title = summary ? main(summary.titles) : null;

  return (
    <div className="contextual-content pb-4" style={toneVars(tone)}>
      <DetailHeader
        fallback={routes.anime(animeId)}
        label={ui("Retour à la fiche")}
        title={ui("Tout le staff")}
        context={title}
        contextHref={routes.anime(animeId)}
        contextTestId="staff-anime-link"
        image={summary ? { render: (size) => <Poster cover={summary.coverImage} alt="" sizes={`${size}px`} className="w-full" rounded="rounded-lg" /> } : undefined}
      />

      <div className="px-safe mx-auto max-w-4xl">
        {categories.length > 1 && <TabRow label={ui("Filtrer par fonction")} value={active} options={[{ key: "all" as CategoryFilter, label: ui("Tous") }, ...categories.map((c) => ({ key: c as CategoryFilter, label: ROLE_CATEGORIES.find((r) => r.key === c)!.label }))]} onChange={setCategory} testId="staff-filter" />}
        {episodes.length > 0 && (
          <label className="mt-3 flex min-h-11 items-center gap-3 text-[15px] text-soft">
            {ui("Équipe de l'épisode") + " "}<select value={episode ?? ""} onChange={(e) => setEpisode(e.target.value ? Number(e.target.value) : null)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-[16px] text-paper" data-testid="staff-episode">
              <option value="">{ui("Tous les épisodes")}</option>
              {episodes.map((n) => (
                <option key={n} value={n}>{ui("Épisode {0}", n)}</option>
              ))}
            </select>
          </label>
        )}

        {people.length === 0 ? (
          <p className="mt-4 text-[15px] text-soft">{ui("AniList ne liste aucun crédit pour cet anime.")}</p>
        ) : shown.length === 0 ? (
          <p className="mt-4 text-[15px] text-soft" data-testid="staff-none">
            {ui("Personne n'est crédité sur ce critère parmi le staff chargé.")}</p>
        ) : (
          <div data-testid="staff-list">
            {shown.map((group) => (
              <section key={group.category} aria-label={group.label} data-testid={`staff-group-${group.category}`}>
                <SectionTitle className="mt-6 mb-1 text-[17px]">{group.label}</SectionTitle>
                <ul className="flex flex-col divide-y divide-line">
                  {group.people.map((p) => (
                    <li key={p.id}>
                      <Link href={routes.person(p.id, animeId)} className="tactile flex min-h-14 items-center gap-3 py-2.5 active:bg-raised" data-testid="staff-person">
                        <PersonAvatar name={p.name} image={p.image} size={40} />
                        <span className="min-w-0">
                          <span className="block text-[15px] leading-snug font-semibold">{p.name}</span>
                          <span className="block text-[13px] leading-snug text-soft">{mergeRoles(p.roles).join(", ")}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
        {pagination.bounded && <p className="text-sm text-soft" role="status">{ui("Aucun nouveau crédit dans les pages consultées.")}</p>}
        <LoadMoreSentinel manualDuringAuto hasMore={query.hasNextPage} loading={pagination.loading || query.isFetchingNextPage} failed={query.isError || pagination.failed} pages={query.data?.pages.length ?? 0} onLoad={() => void pagination.load()} label={ui("Afficher la suite du staff")} />
      </div>
    </div>
  );
}
