import { ui } from "@/lib/i18n/translate";
import { localeDateFormat } from "@/lib/i18n/language";
import { AIRING } from "@/config/app";
import { paddedEpisodeNumber } from "@/lib/providers/episodes";
import type { AiringEntry, AnimeSummary } from "@/types/anime";

/**
 * Pure airing rules: the week shown in "Cette semaine", when an episode
 * aired, and whether an up-next episode is "Nouveau". Times from AniList are
 * unix seconds; everything local is epoch milliseconds.
 */

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Local Monday 00:00 of the week containing `now`, and the next Monday. */
export function weekBounds(now: number): { start: number; end: number } {
  const d = new Date(startOfDay(now));
  // getDay: 0 = Sunday … 6 = Saturday → days since Monday.
  const sinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - sinceMonday);
  const start = d.getTime();
  const next = new Date(start);
  next.setDate(next.getDate() + 7);
  return { start, end: next.getTime() };
}

/** The AniList window fetched: the current week, and enough of the past for "Nouveau". Unix seconds. */
export function scheduleWindow(now: number): { from: number; to: number } {
  const week = weekBounds(now);
  return {
    from: Math.floor(Math.min(week.start, now - AIRING.lookBackMs) / 1000),
    to: Math.ceil((week.end + AIRING.lookAheadMs) / 1000),
  };
}

export interface ScheduleDay {
  /** Local midnight of the day. */
  date: number;
  label: string;
  isToday: boolean;
  entries: (AiringEntry & { aired: boolean })[];
}

const WEEKDAY = localeDateFormat({ weekday: "long" });

/** Monday → Sunday of the current week, each with its episodes in airing order. */
export function groupWeek(entries: AiringEntry[], now: number, week = now): ScheduleDay[] {
  const { start } = weekBounds(week);
  const today = startOfDay(now);
  const days: ScheduleDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const date = d.getTime();
    const label = WEEKDAY.format(date);
    return { date, label: label.charAt(0).toUpperCase() + label.slice(1), isToday: date === today, entries: [] };
  });
  const sorted = [...entries].sort((a, b) => a.airingAt - b.airingAt);
  for (const e of sorted) {
    const t = e.airingAt * 1000;
    // By calendar date, never by 24 h steps (daylight-saving days are 23 or 25 h long).
    const day = days.find((d) => d.date === startOfDay(t));
    if (day) day.entries.push({ ...e, aired: t <= now });
  }
  return days;
}

/**
 * Where an episode of the week stands. The schedule says WHEN AniList planned it; only AniList moving on says it came out:
 *  – « upcoming »: its slot is still ahead;
 *  – « aired »: its slot passed and AniList's next episode is a later one (or there is none): it is out;
 *  – « unconfirmed »: its slot passed but AniList still lists THIS episode as the next one (a break, a placeholder slot):
 *    never called « Diffusé », and not offered as playable.
 */
export function episodeState(entry: Pick<AiringEntry, "episode" | "airingAt">, summary: Pick<AnimeSummary, "nextAiring" | "status"> | undefined, now: number): "upcoming" | "aired" | "unconfirmed" {
  if (entry.airingAt * 1000 > now) return "upcoming";
  const next = summary?.nextAiring;
  return next && next.episode <= entry.episode ? "unconfirmed" : "aired";
}

/** When this episode aired (unix seconds), if known — from the schedule, or the stored "next episode" that has since passed. */
export function airedAt(summary: AnimeSummary, episode: number, entries: readonly AiringEntry[], now: number): number | null {
  const scheduled = entries.find((e) => e.animeId === summary.id && e.episode === episode);
  if (scheduled) return scheduled.airingAt * 1000 <= now ? scheduled.airingAt : null;
  const next = summary.nextAiring;
  if (next && next.episode === episode && next.airingAt * 1000 <= now) return next.airingAt;
  return null;
}

/** Only these statuses can still gain episodes; finished anime are never monitored. */
export function isMonitored(summary: AnimeSummary): boolean {
  return summary.status === "RELEASING" || summary.status === "NOT_YET_RELEASED" || summary.status === "HIATUS";
}

/**
 * A followed anime with nothing airing in the current week. It stays represented as followed — never silently
 * absent — with only what AniList says. AniList's `nextAiring` outside the week's schedule is a *forecast*, never an
 * official date (a break, a season return, a placeholder): it is kept but always qualified as « à confirmer ». Without
 * one, « Prochaine diffusion non annoncée ». No date is ever derived from a past cadence, and no title is special-cased.
 */
export interface FollowOutsideWeek {
  animeId: number;
  summary: AnimeSummary;
  state: "forecast" | "hiatus" | "unannounced";
  /** AniList's next episode, later than now, outside the week's schedule: indicative only. */
  next: { episode: number; airingAt: number } | null;
}

export function followsOutsideWeek(follows: readonly AnimeSummary[], entries: readonly AiringEntry[], now: number): FollowOutsideWeek[] {
  const { start, end } = weekBounds(now);
  const inWeek = new Set(entries.filter((e) => e.airingAt * 1000 >= start && e.airingAt * 1000 < end).map((e) => e.animeId));
  return follows
    .filter((s) => isMonitored(s) && !inWeek.has(s.id))
    .map((summary): FollowOutsideWeek => {
      const next = summary.nextAiring && summary.nextAiring.airingAt * 1000 > now ? summary.nextAiring : null;
      return { animeId: summary.id, summary, next, state: next ? "forecast" : summary.status === "HIATUS" ? "hiatus" : "unannounced" };
    });
}

const RELEASE_DAY = localeDateFormat({ day: "numeric", month: "long" });
const RELEASE_DAY_YEAR = localeDateFormat({ day: "numeric", month: "long", year: "numeric" });

/** « 20 octobre » — the day of a release, with the year only when it is not the current one. No weekday, no clock time. */
export function releaseDayLabel(at: number, now: number): string {
  const sameYear = new Date(at).getFullYear() === new Date(now).getFullYear();
  return (sameYear ? RELEASE_DAY : RELEASE_DAY_YEAR).format(at);
}

/**
 * The single line under a followed series: « Épisode 01 · 20 octobre ». `forecast` is true when the date is AniList's far-off
 * guess (a break, a season return, a placeholder), which the screen marks with a quiet « ≈ »; an announced date (inside this
 * week's schedule) carries no marker. Without any date the line is a plain sentence (`text`).
 */
export type FollowLine =
  | { kind: "release"; /** Zero-padded: « 01 ». */ episode: string; date: string; forecast: boolean }
  | { kind: "text"; text: string };

/**
 * A followed anime absent from this week's schedule. Its date, when AniList has one, is a forecast, never an official date;
 * nothing is derived from a past cadence and no title is special-cased.
 */
export function outsideWeekLine(item: Pick<FollowOutsideWeek, "state" | "next">, now: number): FollowLine {
  if (item.state === "forecast" && item.next) {
    return { kind: "release", episode: paddedEpisodeNumber(item.next.episode), date: releaseDayLabel(item.next.airingAt * 1000, now), forecast: true };
  }
  return { kind: "text", text: item.state === "hiatus" ? ui("En pause, reprise non annoncée") : ui("Prochaine diffusion non annoncée") };
}

/**
 * The line of any monitored follow (« Gérer les suivis »): the next episode still ahead in THIS week's schedule is announced;
 * otherwise AniList's later date is a forecast, exactly as for the list of follows outside the week.
 */
export function followLine(summary: AnimeSummary, entries: readonly AiringEntry[], now: number): FollowLine {
  const { start, end } = weekBounds(now);
  const announced = entries
    .filter((e) => e.animeId === summary.id && e.airingAt * 1000 > now && e.airingAt * 1000 >= start && e.airingAt * 1000 < end)
    .sort((a, b) => a.airingAt - b.airingAt || a.episode - b.episode)[0];
  if (announced) return { kind: "release", episode: paddedEpisodeNumber(announced.episode), date: releaseDayLabel(announced.airingAt * 1000, now), forecast: false };
  const next = summary.nextAiring && summary.nextAiring.airingAt * 1000 > now ? summary.nextAiring : null;
  return outsideWeekLine({ state: next ? "forecast" : summary.status === "HIATUS" ? "hiatus" : "unannounced", next }, now);
}

/** The text of a follow line, for a plain-text reading (tests, titles): « Épisode 01 · ≈ 20 octobre ». */
export function followLineText(line: FollowLine): string {
  return line.kind === "text" ? line.text : `${ui("Épisode {0}", line.episode)} · ${line.forecast ? "≈ " : ""}${line.date}`;
}

const WEEK_DAY = localeDateFormat({ day: "numeric" });
const WEEK_DAY_MONTH = localeDateFormat({ day: "numeric", month: "short" });

/**
 * A week as it fits beside the arrows on a 390 px phone: « 12–18 oct. » or « 28 sept. – 4 oct. ». The year is added only for a
 * week of another year whose range stays inside one month (the long cross-month form has no room for it; the full range with
 * its year is the control's title).
 */
export function weekRangeLabel(weekStart: number, now: number): string {
  const first = new Date(weekStart);
  const last = new Date(weekStart);
  last.setDate(last.getDate() + 6);
  const sameMonth = first.getMonth() === last.getMonth();
  const range = sameMonth ? `${WEEK_DAY.format(first)}–${WEEK_DAY_MONTH.format(last)}` : `${WEEK_DAY_MONTH.format(first)} – ${WEEK_DAY_MONTH.format(last)}`;
  return sameMonth && last.getFullYear() !== new Date(now).getFullYear() ? `${range} ${last.getFullYear()}` : range;
}

// ------------------------------------------------------------------------------------------------ what is coming (RC9.2)

/**
 * The next known releases, soonest first: AniList's own schedule only (never a cadence derived from the past, never a date
 * nobody announced). `ids` narrows to the anime the viewer follows (the Home), null looks at every anime of the schedule — the
 * shape a seasonal calendar (week / month, followed or all) will read later. Pure.
 */
export interface UpcomingRelease {
  animeId: number;
  episode: number;
  /** Epoch ms. */
  at: number;
}

export function upcomingReleases(entries: readonly AiringEntry[], options: { now: number; ids?: ReadonlySet<number> | null; limit?: number }): UpcomingRelease[] {
  const { now, ids = null, limit = Infinity } = options;
  const seen = new Set<string>();
  return entries
    .filter((e) => e.airingAt * 1000 > now && (ids == null || ids.has(e.animeId)))
    .sort((a, b) => a.airingAt - b.airingAt || a.animeId - b.animeId || a.episode - b.episode)
    .filter((e) => {
      const key = `${e.animeId}:${e.episode}`;
      return seen.has(key) ? false : (seen.add(key), true);
    })
    .slice(0, limit)
    .map((e) => ({ animeId: e.animeId, episode: e.episode, at: e.airingAt * 1000 }));
}

const SHORT_DAY = localeDateFormat({ weekday: "short" });
const CLOCK = localeDateFormat({ hour: "2-digit", minute: "2-digit" });

/** « Jeu. 18:00 » — the local weekday and clock of a release. */
export function releaseWhen(at: number): string {
  const day = SHORT_DAY.format(at);
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${CLOCK.format(at)}`;
}
