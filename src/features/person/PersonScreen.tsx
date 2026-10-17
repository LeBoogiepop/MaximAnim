"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useArtworkTone } from "@/components/layout/ArtworkPalette";
import { toneVars } from "@/components/layout/ToneScope";
import { DetailHeader } from "@/components/layout/DetailHeader";
import { FactList, FactRow } from "@/components/ui/FactList";
import { useVisiblePagination } from "@/features/catalogue/useVisiblePagination";
import { LoadMoreSentinel } from "@/components/ui/LoadMoreSentinel";
import { TabRow } from "@/components/ui/TabRow";
import { PersonAvatar } from "@/features/anime/DetailSections";
import { useAnime } from "@/features/anime/useAnime";
import { personOptions } from "@/features/catalogue/queries";
import { PageSkeleton, PageState } from "@/features/catalogue/shared";
import { FilmographyCard } from "@/features/catalogue/FilmographyCard";
import { Timeline, TimelineControls, type FilmographyView } from "@/features/catalogue/Timeline";
import { usePreferences, useTitles } from "@/features/settings/PreferencesContext";
import { type StaffPersonRoles } from "@/lib/anilist/catalogue";
import { frenchOccupation, mergeRoles, ROLE_CATEGORIES } from "@/lib/anilist/roles";
import { type CategoryFilter, categoriesPresent, cleanRoles, filterByCategory, mergeCredits } from "@/lib/catalogue/credits";
import { groupTimeline, showTimelineControls, type TimelineOrder } from "@/lib/catalogue/timeline";
import { useContentMark } from "@/lib/perf/use-content-mark";
import { routes } from "@/lib/utils/routes";
import { PersonCreditRow } from "./PersonCreditRow";
import { isOrganization } from "@/lib/anilist/editorial";
import { useViewingIndex } from "@/features/library/hooks";
import { et } from "@/lib/i18n/messages-entities";

/** Occupations said on the header, then « +N »: a person can have a dozen and the header is not the place for all. */
const MAX_OCCUPATIONS = 3;

/**
 * A person, seen through anime. Coming from an anime, what they did ON IT comes first; then their whole filmography, year
 * by year, each work saying WHAT they did on it (a person's roles differ from one work to the next), filterable by the kind
 * of work and sortable. Credits come from AniList's own staff graph; episodes are shown only as AniList writes them in the
 * role. Dubs are never credits of the work (original audio only). No manga filmography, no voice roles yet.
 */
export function PersonScreen({ id, fromAnime = null }: { id: number; fromAnime?: number | null }) {
  useInterfaceLanguage();
  const queryClient = useQueryClient();
  const { main } = useTitles();
  const { showAdult } = usePreferences();
  const [order, setOrder] = useState<TimelineOrder>("newest");
  const [view, setView] = useState<FilmographyView>("list");
  const query = useInfiniteQuery({ ...personOptions(id, order), placeholderData: (previous, previousQuery) => previousQuery?.queryKey[1] === id ? previous : undefined });
  const person = query.data?.pages[0]?.person;
  const context = useAnime(fromAnime);
  const [category, setCategory] = useState<CategoryFilter>("all");
  useContentMark(`person:${id}`, Boolean(person));

  // The same anime can be credited several times (one line per role, per page): one row, every role once, no dub.
  const credits = useMemo(() => mergeCredits((query.data?.pages ?? []).flatMap((p) => p.credits)).filter(c => showAdult === true || c.entry.isAdult !== true), [query.data, showAdult]);
  const viewing = useViewingIndex(credits.map(c => c.entry.id));
  const categories = useMemo(() => categoriesPresent(credits), [credits]);
  // A kind that no longer matches anything (the list changed) is « Tous » again.
  const active: CategoryFilter = category === "all" || categories.includes(category) ? category : "all";
  const filtered = useMemo(() => filterByCategory(credits, active), [credits, active]);
  const timeline = useMemo(() => groupTimeline(filtered, (c) => c.entry, order), [filtered, order]);
  const controls = showTimelineControls(credits.map((c) => c.entry.status), query.hasNextPage);

  const pagination = useVisiblePagination({ ...query, hasNextPage: !query.isPlaceholderData && query.hasNextPage }, pages => filterByCategory(mergeCredits(pages.flatMap(p => p.credits)).filter(c => showAdult === true || c.entry.isAdult !== true), active).map(c => String(c.entry.id)));

  // What they did on the anime they were opened from: the full credit when the filmography has reached it, else what the
  // staff list or the anime page already holds. Nothing when none of them has it (never invented).
  const contextRoles = useMemo<string[] | null>(() => {
    if (fromAnime == null) return null;
    const own = credits.find((c) => c.entry.id === fromAnime)?.roles;
    if (own?.length) return own;
    const staff = queryClient.getQueryData<{ pages: { items: StaffPersonRoles[] }[] }>(["staff", fromAnime]);
    const fromStaff = staff?.pages.flatMap((p) => p.items).filter((p) => p.id === id).flatMap((p) => p.roles);
    if (fromStaff?.length) return cleanRoles(fromStaff);
    const headline = context.data?.anime.staff.find((p) => p.id === id)?.roles;
    return headline?.length ? cleanRoles(headline) : null;
  }, [fromAnime, credits, queryClient, context.data, id]);

  const { tone } = useArtworkTone(context.data?.anime ?? null);
  if (query.isPending) return <PageSkeleton label={ui("Chargement de la fiche")} />;
  if ((query.isError && !person) || !person) return <PageState error={query.error} subject={ui("Cette personne")} onRetry={() => void query.refetch()} back={routes.home()} />;

  const occupations = person.occupations.map(frenchOccupation).filter((o, i, all) => all.indexOf(o) === i);
  const organization = isOrganization(person.name);
  const contextTitle = context.data ? main(context.data.anime.titles) : null;
  const isVoiceActor = person.occupations.some((o) => /voice actor|seiyuu/i.test(o));

  return (
    <div className="contextual-content pb-4" style={toneVars(tone)}>
      <DetailHeader
        fallback={fromAnime != null ? routes.anime(fromAnime) : routes.home()}
        title={person.name}
        context={organization ? ui("Organisation") : null}
        subtitle={person.nativeName && person.nativeName !== person.name ? person.nativeName : null}
        image={{ render: (size) => <PersonAvatar name={person.name} image={person.image} size={size} /> }}
      />

      <div className="px-safe mx-auto flex max-w-4xl flex-col gap-6">
        {fromAnime != null && contextRoles && contextRoles.length > 0 && (
          <section aria-label={ui("Sur cet anime")} data-testid="person-context">
            <p className="text-[15px] leading-snug">
              {contextTitle ? (
                <>
                  <Link href={routes.anime(fromAnime)} className="fact-link inline-flex min-h-11 items-center gap-1 text-paper active:text-accent" data-testid="person-context-anime">
                    {contextTitle}
                    <ChevronRight size={18} className="shrink-0 context-accent" aria-hidden="true" />
                  </Link>
                </>
              ) : (
                ui("Sur cet anime")
              )}
            </p>
            {/* A role is a whole statement, not the left half of a missing value: exact credits, kept separate from general occupations. */}
            <ul className="flex flex-col gap-1 text-[15px] text-soft" data-testid="person-context-roles">
              {mergeRoles(contextRoles).map((role) => (
                <li key={role} data-testid="person-context-role">
                  {role}
                </li>
              ))}
            </ul>
          </section>
        )}

        {((occupations.length > 0) || person.homeTown) && !organization && (
          <FactList>
            {occupations.length > 0 && (
              <FactRow label={ui("Métiers")} fact="occupations">
                <span data-testid="person-occupations">
                  {occupations.slice(0, MAX_OCCUPATIONS).join(", ")}
                  {occupations.length > MAX_OCCUPATIONS && <span className="text-soft">{`, +${occupations.length - MAX_OCCUPATIONS}`}</span>}
                </span>
              </FactRow>
            )}
            {/* AniList's own « home town »: a place, never a nationality. No nationality is shown: no verified source holds it. */}
            {person.homeTown && (
              <FactRow label={et("Ville d'origine")} fact="home-town">
                <span data-testid="person-hometown">{person.homeTown}</span>
              </FactRow>
            )}
          </FactList>
        )}

        {credits.length === 0 && !query.hasNextPage ? (
          <p className="text-[15px] text-soft">
            {ui("AniList ne liste aucun crédit de staff pour cette personne.") + " "}{isVoiceActor && ui(" Ses rôles de voix ne sont pas encore affichés ici.")}
          </p>
        ) : (
          <section aria-label={ui("Filmographie")} aria-busy={query.isPlaceholderData} data-testid="person-filmography">
            <TimelineControls view={{ value: view, onChange: setView }} title={ui("Filmographie")} sort={{ show: controls.sort, order, onOrder: setOrder }}>
            {categories.length > 1 && <TabRow label={ui("Filtrer par fonction")} value={active} options={[{ key: "all" as CategoryFilter, label: ui("Tous") }, ...categories.map((c) => ({ key: c as CategoryFilter, label: ROLE_CATEGORIES.find((r) => r.key === c)!.label }))]} onChange={setCategory} testId="person-role-filter" />}
            </TimelineControls>
            <Timeline view={view} timeline={timeline} keyOf={(c) => c.entry.id} row={(c) => view === "grid" ? <FilmographyCard entry={c.entry} roles={c.roles} progress={viewing?.progress[c.entry.id]} state={viewing?.states[c.entry.id]} /> : <PersonCreditRow entry={c.entry} roles={c.roles} progress={viewing?.progress[c.entry.id]} state={viewing?.states[c.entry.id]} />} testId="person-works" />
            {pagination.bounded && <p className="text-sm text-soft" role="status">{ui("Aucun nouveau crédit dans les pages consultées.")}</p>}
            <LoadMoreSentinel hasMore={!query.isPlaceholderData && query.hasNextPage} loading={pagination.loading || query.isFetchingNextPage} failed={query.isError || pagination.failed} pages={query.data?.pages.length ?? 0} onLoad={() => void pagination.load()} label={ui("Afficher la suite")} />
          </section>
        )}

        {person.siteUrl && (
          <p>
            <a href={person.siteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-[14px] text-soft underline decoration-line underline-offset-4">
              AniList
              <ExternalLink size={14} className="text-muted" aria-hidden="true" />
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
