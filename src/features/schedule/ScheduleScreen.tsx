"use client";


import { ui } from "@/lib/i18n/translate";
import { localeDateFormat } from "@/lib/i18n/language";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { SeasonCatalogue, SeasonNavigation } from "./SeasonCatalogue";
import { FollowReleaseLine } from "./FollowReleaseLine";
import { currentSeason, seasonRelation } from "@/lib/airing/season";
import { parseScheduleUrl, scheduleUrlQuery } from "./url-state";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button, IconButton } from "@/components/ui/Button";
import { Poster } from "@/components/ui/Poster";
import { Sheet } from "@/components/ui/Sheet";
import { AnimeRow } from "@/features/anime/AnimeCards";
import { useAiringCache, useAiringFollows, useFollowedAiring } from "@/features/library/hooks";
import { usePreferences, useTitles } from "@/features/settings/PreferencesContext";
import { useOnline } from "@/hooks/useOnline";
import { fetchWeeklyAiring } from "@/lib/anilist/weekly";
import { refreshAiring } from "@/lib/airing/refresh";
import { episodeState, type FollowOutsideWeek, followLine, followsOutsideWeek, groupWeek, isMonitored, outsideWeekLine, weekBounds, weekRangeLabel } from "@/lib/airing/schedule";
import { unfollowAiring } from "@/lib/db/airing-follows";
import { formatEpisodeNumber } from "@/lib/providers/episodes";
import { clockLabel, statusLabel } from "@/lib/utils/format";
import { routes } from "@/lib/utils/routes";
import type { AiringEntry, AnimeSummary } from "@/types/anime";

const DATE = localeDateFormat({ day: "numeric", month: "short" });
const DAY = localeDateFormat({ weekday: "long", day: "numeric", month: "long" });
const SHORT = localeDateFormat({ weekday: "short" });
const COMPACT_DATE = localeDateFormat({ day: "2-digit", month: "2-digit" });

export function ScheduleScreen() {
  useInterfaceLanguage();
  const { showAdult } = usePreferences();
  const followed = useFollowedAiring();
  const airing = useAiringCache();
  const online = useOnline();
  const [now] = useState(() => Date.now());
  const [week, setWeek] = useState(() => weekBounds(now).start);
  const [selected, setSelected] = useState(() => (new Date(now).getDay() + 6) % 7);
  const [mode, setMode] = useState<"all" | "followed">("followed");
  const [settled, setSettled] = useState(false);
  const [manage, setManage] = useState(false);
  const [view, setView] = useState<"week" | "seasons">("week");
  const [selection, setSelection] = useState(() => currentSeason(new Date(now)));
  const [restored, setRestored] = useState(false);
  useLayoutEffect(() => {
    const restore = () => {
      const state = parseScheduleUrl(window.location.search, currentSeason(new Date(now)));
      setView(state.view); setSelection(state.selection); setRestored(true);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [now]);
  const url = scheduleUrlQuery(view, selection);
  const relation = seasonRelation(selection, new Date(now));
  useEffect(() => {
    if (restored && window.location.search !== url) window.history.replaceState(window.history.state, "", `/schedule${url}`);
  }, [restored, url]);
  useEffect(() => { void refreshAiring().finally(() => setSettled(true)); }, []);
  const summaries = useMemo(() => new Map([...(followed?.values() ?? [])].filter(r => showAdult === true || r.summary.isAdult !== true).map(r => [r.summary.id, r.summary])), [followed, showAdult]);
  const current = week === weekBounds(now).start;
  // The management sheet describes the real current week even when browsing a different one.
  const outside = useMemo(() => followed ? followsOutsideWeek([...summaries.values()], airing?.entries.filter(e => followed.has(e.animeId)) ?? [], now) : [], [followed, summaries, airing, now]);
  const shift = (amount: number) => { const date = new Date(week); date.setDate(date.getDate() + amount * 7); setWeek(date.getTime()); };
  const end = new Date(week); end.setDate(end.getDate() + 6);
  const calendar = { now, week, selected, onSelect: setSelected };
  return <div className="pb-6">
    <header className="page-header px-safe flex items-start gap-3 pb-5">
      <h1 className="display-title min-w-0 flex-1">{ui("Planning")}</h1>
      <Button variant="secondary" icon={<ListChecks size={18} aria-hidden="true" />} onClick={() => setManage(true)} className="follows-manage shrink-0" data-testid="manage-follows">{ui("Gérer les suivis")}</Button>
    </header>
    <Sheet open={manage} onClose={() => setManage(false)} title={ui("Sorties suivies")}>{manage && <ManageFollows now={now} entries={airing?.entries ?? []} />}</Sheet>
    {/* One row: the view switch on the left, the period (arrows around its label) on the right. */}
    <div className="px-safe mb-4 flex items-center justify-between gap-1" data-testid="schedule-toolbar">
      <div role="group" aria-label={ui("Vue du planning")} className="flex shrink-0 gap-0.5">
        {([['week', ui("Semaine")], ['seasons', ui("Saisons")]] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)} className={`min-h-11 min-w-11 rounded-lg px-1.5 text-[13px] font-medium ${view === key ? 'bg-raised text-accent' : 'text-soft'}`}>{label}</button>)}
      </div>
      {view === "seasons"
        ? <SeasonNavigation value={selection} setValue={setSelection} current={relation === "current"} />
        : <div className="flex shrink-0 items-center" data-testid="week-navigation">
          <IconButton label={ui("Semaine précédente")} onClick={() => shift(-1)}><ChevronLeft size={18} aria-hidden="true" /></IconButton>
          <p className="px-1 text-center text-xs font-semibold whitespace-nowrap tabular-nums" data-testid="schedule-week" title={`${DATE.format(week)} ${ui("au")} ${DATE.format(end)} ${end.getFullYear()}`}>{weekRangeLabel(week, now)}</p>
          <IconButton label={ui("Semaine suivante")} onClick={() => shift(1)}><ChevronRight size={18} aria-hidden="true" /></IconButton>
        </div>}
    </div>
    {/* Restore the URL before mounting posters: a cached current season must
        never seed image state for a different season being restored on Back. */}
    <div hidden={view !== "seasons"}>{restored && <SeasonCatalogue value={selection} setValue={setSelection} enabled={view === "seasons"} relation={relation} />}</div>
    <div className="px-safe" hidden={view !== "week"}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border border-line p-1" role="group" aria-label={ui("Diffusions")}>
          {([['all', ui("Toutes")], ['followed', ui("Suivies")]] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={mode === key} onClick={() => setMode(key)} className={`min-h-11 rounded-full px-4 text-sm font-medium ${mode === key ? 'bg-accent text-ink' : 'text-soft'}`}>{label}</button>)}
        </div>
        {!current && <button type="button" onClick={() => { setWeek(weekBounds(now).start); setSelected((new Date(now).getDay() + 6) % 7); }} className="min-h-11 text-sm text-accent">{ui("Aujourd’hui")}</button>}
      </div>
      {mode === 'all' || !current ? <WeeklyCatalogue key={week} {...calendar} follows={mode === 'followed' ? summaries : null} /> : <Calendar {...calendar} entries={airing?.entries.filter(e => summaries.has(e.animeId)) ?? []} summaries={summaries} loading={followed === undefined || (!settled && followed.size > 0 && !airing)} unavailable={settled && followed !== undefined && followed.size > 0 && !airing} noFollows={followed?.size === 0} online={online} />}
      {mode === 'followed' && current && (settled || airing) && outside.length > 0 && <div className="mt-6"><FollowedOutsideWeek items={outside} now={now} /></div>}
    </div>
  </div>;
}

type CalendarProps = { now: number; week: number; selected: number; onSelect: (day: number) => void; entries: AiringEntry[]; summaries: ReadonlyMap<number, AnimeSummary>; loading?: boolean; unavailable?: boolean; noFollows?: boolean; online?: boolean; partial?: boolean; more?: () => void; fetching?: boolean };
function Calendar({ now, week, selected, onSelect, entries, summaries, loading, unavailable, noFollows, online = true, partial, more, fetching }: CalendarProps) {
  useInterfaceLanguage();
  const days = groupWeek(entries, now, week);
  const day = days[selected]!;
  const weekEmpty = entries.length === 0;
  return <div data-testid={!loading && !noFollows ? "schedule" : undefined}>
    <div className="grid grid-cols-7 gap-0.5 border-b border-line pb-2" role="group" aria-label={ui("Jours de la semaine")}>
      {days.map((d, i) => <button key={d.date} type="button" aria-pressed={i === selected} aria-current={d.isToday ? 'date' : undefined} aria-label={`${d.isToday ? ui("Aujourd’hui") : d.label} ${COMPACT_DATE.format(d.date)}, ${ui("{0} sortie{1}", d.entries.length, d.entries.length === 1 ? "" : "s")}${partial ? ui(" chargées") : ''}`} onClick={() => onSelect(i)} className={`flex min-h-[64px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg tabular-nums ${i === selected ? 'bg-accent text-ink' : d.isToday ? 'bg-surface text-accent' : 'text-soft'}`} data-testid="schedule-day">
        <span className="text-[9px] font-medium sm:text-[11px]">{d.isToday ? ui("Aujourd’hui") : SHORT.format(d.date).replace(/\.$/, "")}</span><span className="text-[13px] font-semibold">{COMPACT_DATE.format(d.date)}</span><span className="text-[10px]">{loading ? '…' : `${d.entries.length}${partial ? '+' : ''}`}</span>
      </button>)}
    </div>
    <div className="mt-5 mb-2 flex items-baseline justify-between gap-3"><h2 className="text-lg font-semibold capitalize">{DAY.format(day.date)}</h2><span className="shrink-0 text-xs text-soft">{ui("Heure locale")}</span></div>
    {loading ? <div className="skeleton h-24 rounded-2xl" aria-label={ui("Chargement du planning")} /> : unavailable ? <p role="status" className="py-5 text-sm text-soft" data-testid="schedule-unavailable">{online ? ui("Calendrier indisponible pour l’instant.") : ui("Hors connexion. Calendrier indisponible.")}</p> : noFollows ? <EmptyState title={ui("Aucun anime en diffusion suivi")}>{ui("Touche la cloche sur une fiche pour suivre ses sorties.")}</EmptyState> : !day.entries.length ? <p className="py-6 text-sm text-soft" data-testid={weekEmpty && !partial ? 'schedule-empty-week' : 'schedule-empty-day'}>{partial ? ui("Aucune sortie chargée pour ce jour.") : weekEmpty ? ui("Rien de prévu cette semaine.") : ui("Aucune sortie ce jour.")}</p> : <ul className="divide-y divide-line">
      {day.entries.map(e => { const anime = summaries.get(e.animeId); if (!anime) return null; const state = episodeState(e, anime, now); return <li key={`${e.animeId}:${e.episode}:${e.airingAt}`} data-testid="schedule-release"><AnimeRow anime={anime} href={state === 'aired' ? routes.watch(e.animeId, e.episode) : routes.anime(e.animeId)} meta={ui("Épisode {0}", formatEpisodeNumber(e.episode))} trailing={<span className="ml-2 flex shrink-0 flex-col items-end gap-1"><time dateTime={new Date(e.airingAt * 1000).toISOString()} className="text-base font-semibold tabular-nums">{clockLabel(e.airingAt * 1000)}</time><span className={`text-xs ${state === 'aired' ? 'text-green' : 'text-soft'}`}>{state === 'aired' ? ui("Diffusé") : state === 'unconfirmed' ? ui("Horaire passé") : ui("À venir")}</span></span>} /></li>; })}
    </ul>}
    {partial && <p className="mt-3 text-xs text-soft" role="status">{ui("Calendrier partiel, d’autres sorties restent à charger.")}</p>}
    {more && <button type="button" disabled={fetching} onClick={more} className="mt-2 min-h-11 text-sm font-medium text-accent">{fetching ? ui("Chargement…") : unavailable ? ui("Réessayer") : ui("Charger la suite")}</button>}
  </div>;
}

/** Automatic reading is bounded to four pages; remaining pages are always reachable explicitly. */
function WeeklyCatalogue({ follows, ...calendar }: Pick<CalendarProps, 'now' | 'week' | 'selected' | 'onSelect'> & { follows: ReadonlyMap<number, AnimeSummary> | null }) {
  useInterfaceLanguage();
  const { showAdult } = usePreferences();
  const online = useOnline();
  const bounds = weekBounds(calendar.week);
  const query = useInfiniteQuery({ queryKey: ['weekly-airing', bounds.start, showAdult === true], initialPageParam: 1, queryFn: ({ pageParam, signal }) => fetchWeeklyAiring(bounds.start, bounds.end, pageParam, signal, showAdult === true), getNextPageParam: (last, pages) => last.hasNextPage ? pages.length + 1 : undefined, staleTime: 15 * 60_000, retry: 1 });
  const { hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } = query;
  const count = query.data?.pages.length ?? 0;
  useEffect(() => { if (hasNextPage && count < 4 && !isFetching && !isFetchNextPageError) void fetchNextPage(); }, [count, hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]);
  const summaries = new Map(query.data?.pages.flatMap(p => p.summaries.map(s => [s.id, s] as const)) ?? []);
  const seen = new Set<string>();
  const entries = (query.data?.pages.flatMap(p => p.entries) ?? []).filter(e => { const key = `${e.animeId}:${e.episode}:${e.airingAt}`; if (seen.has(key) || (follows && !follows.has(e.animeId))) return false; seen.add(key); return true; });
  return <Calendar {...calendar} entries={entries} summaries={summaries} online={online} loading={query.isPending && online} unavailable={(!online || query.isError) && !query.data} noFollows={follows?.size === 0} partial={query.hasNextPage || query.isFetchNextPageError} fetching={query.isFetching} more={query.hasNextPage ? () => void query.fetchNextPage() : query.isError ? () => void query.refetch() : undefined} />;
}

/** A follow never disappears for lack of a date; AniList's far-off date is shown as a forecast (« ≈ »), never as an official one. */
function FollowedOutsideWeek({ items, now }: { items: FollowOutsideWeek[]; now: number }) {
  useInterfaceLanguage();
  return (
    <section aria-label={ui("Suivis sans diffusion cette semaine")} data-testid="follows-outside-week">
      <h2 className="mb-1 text-[13px] text-soft">{ui("Suivis hors de cette semaine")}</h2>
      <ul className="flex flex-col border-t border-line">
        {items.map((i) => (
          <li key={i.animeId} data-testid="follow-outside-row">
            <AnimeRow anime={i.summary} href={routes.anime(i.animeId)} metaContent={<FollowReleaseLine line={outsideWeekLine(i, now)} />} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Every explicit follow. Unfollowing only stops the monitoring: progress,
 * history, lists and the local anime reference stay.
 */
function ManageFollows({ now, entries }: { now: number; entries: readonly AiringEntry[] }) {
  useInterfaceLanguage();
  const { showAdult } = usePreferences();
  const follows = useAiringFollows();
  const { main } = useTitles();
  if (follows === undefined) return <div className="skeleton h-20 rounded-2xl" aria-hidden="true" />;
  if (follows.length === 0) {
    return (
      <p className="pb-4 text-[15px] text-soft" data-testid="follows-empty">
        {ui("Aucun suivi. Sur la fiche d'un anime en diffusion, « Suivre les sorties » l'ajoute au planning ; regarder un épisode ou l'ajouter à une liste ne suffit pas.")}</p>
    );
  }
  return (
    <ul className="-mx-5 divide-y divide-line border-y border-line" data-testid="follows-list">
      {follows.filter(r => showAdult === true || r.anime?.summary.isAdult !== true).map(({ animeId, anime }) => {
        const summary = anime?.summary;
        // Same line as the schedule: an episode of this week's schedule is announced, a later AniList date is a forecast; nothing is guessed.
        const ended = summary && !isMonitored(summary) ? statusLabel(summary.status) : null;
        return (
          <li key={animeId} className="flex items-center gap-3 px-5 py-2" data-testid="follow-row">
            <Link href={routes.anime(animeId)} className="flex min-w-0 flex-1 items-center gap-3 active:opacity-70">
              {summary && <Poster cover={summary.coverImage} alt="" sizes="48px" className="w-12 shrink-0" rounded="rounded-lg" />}
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-[15px] leading-snug font-semibold">{summary ? main(summary.titles) : `Anime ${animeId}`}</span>
                <span className="mt-0.5 block truncate text-[13px] text-soft">{ended ?? (summary ? <FollowReleaseLine line={followLine(summary, entries, now)} /> : null)}</span>
              </span>
            </Link>
            <button type="button" onClick={() => void unfollowAiring(animeId)} className="min-h-11 shrink-0 px-1 text-[13px] text-soft active:opacity-70" data-testid="unfollow">
              {ui("Ne plus suivre")}</button>
          </li>
        );
      })}
    </ul>
  );
}
