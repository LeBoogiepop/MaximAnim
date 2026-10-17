"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useOnline } from "@/hooks/useOnline";
import { IconButton } from "@/components/ui/Button";
import { Poster } from "@/components/ui/Poster";
import { usePreferences, useTitles } from "@/features/settings/PreferencesContext";
import { fetchSeasonPage, SEASONS, shiftSeason, type SeasonSelection } from "@/lib/anilist/seasons";
import { seasonLabel, SOURCE_LABELS } from "@/lib/utils/format";
import { routes } from "@/lib/utils/routes";
import { SEASON_CATALOGUE } from "@/config/app";
import { LoadMoreSentinel } from "@/components/ui/LoadMoreSentinel";
import { AniListError } from "@/lib/anilist/client";
import type { MediaSource } from "@/types/anime";
import type { SeasonRelation } from "@/lib/airing/season";
import { StatusTag } from "@/features/search/EntryStatus";
import { entryStatusTag } from "@/lib/search/entry-status";
import { disc } from "@/lib/i18n/messages-discovery";

export function SeasonCatalogue({ value, setValue, enabled = true, relation = "current" }: { value: SeasonSelection; setValue: (value: SeasonSelection) => void; enabled?: boolean; relation?: SeasonRelation }) {
  useInterfaceLanguage();
  const { showAdult } = usePreferences();
  const { main } = useTitles();
  const online = useOnline();
  const [view, setView] = useState<"grid" | "list">("grid");
  const query = useInfiniteQuery({
    queryKey: ["seasonal-catalogue", value.season, value.year, showAdult === true, value.source ?? null], initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchSeasonPage(value, pageParam, showAdult === true, signal, value.source ?? null),
    getNextPageParam: (last, pages) => last.hasNext ? pages.length + 1 : undefined,
    staleTime: SEASON_CATALOGUE.staleMs, retry: (n, error) => n < 1 && !(error instanceof AniListError && error.kind === "rateLimited"), enabled,
  });
  const items = [...new Map(query.data?.pages.flatMap(p => p.items.map(item => [item.id, item] as const)) ?? []).values()];
  return <section aria-label={ui("Catalogue saisonnier")} className="px-safe" data-testid="season-catalogue">
    <div className="mb-4 flex items-end gap-2">
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-soft">{ui("Origine")}<select aria-label={ui("Origine")} value={value.source ?? "all"} onChange={e => setValue({ ...value, source: e.target.value === "all" ? undefined : e.target.value as MediaSource })} className="min-h-11 w-full min-w-0 rounded-lg bg-raised px-3 text-base text-paper">
        <option value="all">{ui("Toutes")}</option>{Object.entries(SOURCE_LABELS).filter(([, label]) => label).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
    </label>
    <div role="group" aria-label={ui("Affichage du catalogue")} className="flex shrink-0">{([['grid', ui("Grille"), LayoutGrid], ['list', ui("Liste"), List]] as const).map(([key, label, Icon]) => <button key={key} type="button" aria-label={label} aria-pressed={view === key} onClick={() => setView(key)} className={`flex h-11 w-11 items-center justify-center rounded-lg ${view === key ? "bg-raised text-accent" : "text-soft"}`}><Icon size={19} aria-hidden="true" /></button>)}</div>
    </div>
    <h2 className="sr-only">{seasonLabel(value.season)} {value.year}</h2>
    {/* The order is AniList's popularity for this season (`seasonalQuery`), whatever the view: said once, quietly. */}
    {items.length > 0 && <p className="mb-3 text-[13px] text-muted" data-testid="season-sort">{ui("Triés par popularité")}</p>}
    {!online && !items.length ? <p role="status" className="py-6 text-sm text-soft">{ui("Pas de connexion")}</p> : query.isPending && <p role="status" className="py-6 text-sm text-soft">{ui("Chargement de la saison…")}</p>}
    {query.isError && !items.length && <p role="status" className="py-6 text-sm text-soft">{ui("Catalogue indisponible pour l’instant.")}</p>}
    {query.isSuccess && !items.length && <p role="status" className="py-6 text-sm text-soft">{ui("Aucun anime annoncé pour cette saison.")}</p>}
    <ul className={view === "grid" ? "grid grid-cols-3 gap-x-2 gap-y-4 min-[390px]:grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7" : "flex flex-col divide-y divide-line"} data-view={view}>
      {items.map((item, i) => <li key={item.id} className="min-w-0">
        <Link href={routes.anime(item.id)} className={view === "grid" ? "flex min-h-11 flex-col gap-1" : "flex min-h-11 items-center gap-3 py-2"} data-testid="season-anime">
          <Poster cover={item.coverImage} alt="" sizes={view === "list" ? "56px" : "(min-width: 1024px) 150px, (min-width: 640px) 18vw, (min-width: 390px) 23vw, 29vw"} className={view === "list" ? "w-14 shrink-0" : undefined} priority={i < 4} />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-semibold leading-snug wrap-anywhere">{main(item.titles)}</span>
          {(entryStatusTag(item.status, relation) || (item.source && SOURCE_LABELS[item.source])) && <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <StatusTag status={item.status} relation={relation} />
            {item.source && SOURCE_LABELS[item.source] && <span className="rounded border border-line px-1.5 py-px text-soft" data-source={item.source}>{SOURCE_LABELS[item.source]}</span>}
          </span>}
          </span>
        </Link>
      </li>)}
    </ul>
    {enabled && query.hasNextPage && <LoadMoreSentinel hasMore manualDuringAuto loading={query.isFetching} failed={query.isFetchNextPageError} pages={query.data?.pages.length ?? 0} onLoad={() => { if (!query.isFetching) void query.fetchNextPage(); }} label={ui("Charger la suite")} />}
    {query.isError && !query.hasNextPage && <button type="button" disabled={query.isFetching} onClick={() => void query.refetch()} className="mt-1 min-h-11 text-sm font-medium text-accent">{query.isFetching ? ui("Chargement…") : ui("Réessayer")}</button>}
  </section>;
}

/**
 * Local, accessible four-season chooser; no calendar library or extra requests. It is the RIGHT half of the planning toolbar
 * (previous arrow · period · next arrow), so the label sits between the arrows: « Saison actuelle » for the real current
 * season (the season itself stays in the accessible name), « Automne 2026 » for any other.
 */
export function SeasonNavigation({ value, setValue, current = false }: { value: SeasonSelection; setValue: (value: SeasonSelection) => void; current?: boolean }) {
  useInterfaceLanguage();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(value.year);
  const name = `${seasonLabel(value.season)} ${value.year}`;
  return <div className="flex shrink-0 items-center" data-testid="season-navigation">
    <IconButton label={ui("Saison précédente")} disabled={value.year === SEASON_CATALOGUE.minYear && value.season === "WINTER"} onClick={() => setValue(shiftSeason(value, -1))}><ChevronLeft size={18} aria-hidden="true" /></IconButton>
    <button type="button" className="relative min-h-11 rounded-lg px-1 text-xs font-semibold whitespace-nowrap tabular-nums" aria-haspopup="dialog" onClick={() => { setYear(value.year); setOpen(true); }} data-testid="season-selection">
      {current ? <><span className="text-accent" data-testid="season-current">{disc("Saison actuelle")}</span><span className="sr-only"> · {name}</span></> : name}
    </button>
    <IconButton label={ui("Saison suivante")} disabled={value.year === SEASON_CATALOGUE.maxYear && value.season === "FALL"} onClick={() => setValue(shiftSeason(value, 1))}><ChevronRight size={18} aria-hidden="true" /></IconButton>
    <Sheet open={open} onClose={() => setOpen(false)} title={ui("Saison")}>
      <div className="mb-4 flex items-center justify-center gap-3">
        <IconButton label={ui("Année précédente")} disabled={year <= SEASON_CATALOGUE.minYear} onClick={() => setYear(y => y - 1)}><ChevronLeft size={20} aria-hidden="true" /></IconButton>
        <select aria-label={ui("Année")} value={year} onChange={e => setYear(Number(e.target.value))} className="min-h-11 rounded-lg bg-raised px-3 text-base tabular-nums">{Array.from({ length: SEASON_CATALOGUE.maxYear - SEASON_CATALOGUE.minYear + 1 }, (_, i) => SEASON_CATALOGUE.maxYear - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
        <IconButton label={ui("Année suivante")} disabled={year >= SEASON_CATALOGUE.maxYear} onClick={() => setYear(y => y + 1)}><ChevronRight size={20} aria-hidden="true" /></IconButton>
      </div>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label={ui("Saison")}>{SEASONS.map(season => <button key={season} type="button" aria-pressed={value.year === year && value.season === season} className={`min-h-14 rounded-lg border px-4 ${value.year === year && value.season === season ? "border-accent text-accent" : "border-line text-soft"}`} onClick={() => { setValue({ ...value, year, season }); setOpen(false); }}>{seasonLabel(season)}</button>)}</div>
    </Sheet>
  </div>;
}
