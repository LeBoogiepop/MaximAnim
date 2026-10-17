
import { ui } from "@/lib/i18n/translate";
import { shortMonth } from "@/lib/i18n/language";
import type { AnimeFormat, AnimeSeason, AnimeStatus, NextAiring, PartialDate } from "@/types/anime";
import { seasonLabel } from "./format";

/**
 * The facts of an anime, said the same way on every page and about THIS entry only (a season, a film): when it aired,
 * how many episodes, where it stands. Nothing here depends on whether the viewer has started it, and nothing is
 * invented: what AniList does not know is null. Pure.
 */


/** « oct. 2023 » or « 2023 »: a period is said by months, not days. */
export function monthYear(date: PartialDate | null | undefined): string | null {
  if (!date?.year) return null;
  const month = date.month && date.month >= 1 && date.month <= 12 ? shortMonth(date.month) : null;
  return month ? `${month} ${date.year}` : String(date.year);
}

/** « Automne 2023 », or the year alone when AniList gives no season. Null when it gives neither. */
export function seasonYearLabel(x: { season: AnimeSeason | null; seasonYear: number | null; startDate?: PartialDate | null }): string | null {
  const year = x.seasonYear ?? x.startDate?.year ?? null;
  if (year == null) return null;
  const season = seasonLabel(x.season);
  return season ? `${season} ${year}` : String(year);
}

/**
 * The period of THIS entry: « oct. 2023 — mars 2024 », « depuis oct. 2026 », « prévu en 2027 ». Null when no date is known.
 * A hiatus keeps « depuis » (it started; nothing says when it stopped).
 */
export function periodLabel(start: PartialDate | null | undefined, end: PartialDate | null | undefined, status: AnimeStatus | null): string | null {
  const from = monthYear(start);
  const to = monthYear(end);
  if (!from) return null;
  if (status === "RELEASING" || status === "HIATUS") return ui("depuis {0}", from);
  if (status === "NOT_YET_RELEASED") return start?.month ? ui("prévu {0}", from) : ui("prévu en {0}", from);
  if (!to || to === from) return from;
  return ui("{0} à {1}", from, to);
}

export type StatusTone = "live" | "soon" | "warn" | "quiet";

/**
 * Where THIS entry stands, in the words of a season (« Terminée », « En diffusion »): the words never speak for the whole
 * franchise. A film that is out says nothing (it is not « diffusé »).
 */
export function diffusionStatus(status: AnimeStatus | null, format: AnimeFormat | null): { label: string; tone: StatusTone } | null {
  switch (status) {
    case "RELEASING":
      return { label: ui("En diffusion"), tone: "live" };
    case "NOT_YET_RELEASED":
      return { label: ui("À venir"), tone: "soon" };
    case "CANCELLED":
      return { label: ui("Annulée"), tone: "warn" };
    case "HIATUS":
      return { label: ui("En pause"), tone: "quiet" };
    case "FINISHED":
      return format === "MOVIE" ? null : { label: ui("Terminée"), tone: "quiet" };
    default:
      return null;
  }
}

/** A short status for a row of a list: only what is not simply « over » (a finished entry says nothing). */
export function rowStatus(status: AnimeStatus | null): { label: string; tone: StatusTone } | null {
  switch (status) {
    case "RELEASING":
      return { label: ui("En cours"), tone: "live" };
    case "NOT_YET_RELEASED":
      return { label: ui("À venir"), tone: "soon" };
    case "CANCELLED":
      return { label: ui("Annulé"), tone: "warn" };
    case "HIATUS":
      return { label: ui("En pause"), tone: "quiet" };
    default:
      return null;
  }
}

/** « 1 épisode », « 12 épisodes ». */
export function episodesWords(n: number): string {
  return `${n} ${n > 1 ? ui("épisodes") : ui("épisode")}`;
}

/** What has aired, from AniList's next episode (the one before it is the last out). Null when it names none. */
export function airedCount(nextAiring: NextAiring | null | undefined): number | null {
  return nextAiring && nextAiring.episode > 1 ? nextAiring.episode - 1 : null;
}

/**
 * The « Épisodes » row, in the same place for every season:
 *   a finished entry with a total  → « 24 »
 *   airing with a known total      → « 12 » (and, quietly, « 3 diffusés »)
 *   airing, only what aired known  → « 3 diffusés »
 *   announced with a known total   → « 12 »
 *   nothing known                  → null (never a « ? », never an invented total)
 */
export function episodesFact(x: { episodeCount: number | null; nextAiring: NextAiring | null; status: AnimeStatus | null }): { value: string; note: string | null } | null {
  const aired = x.status === "RELEASING" || x.status === "HIATUS" ? airedCount(x.nextAiring) : null;
  if (x.episodeCount != null) {
    return { value: String(x.episodeCount), note: aired != null && aired < x.episodeCount ? ui("{0} diffusé{1}", aired, aired > 1 ? "s" : "") : null };
  }
  if (aired != null) return { value: ui("{0} diffusé{1}", aired, aired > 1 ? "s" : ""), note: null };
  return null;
}

/** The list label of an entry's length: « 12 épisodes », « 3 diffusés », or null when unknown (a film says nothing). */
export function lengthLabel(x: { format: AnimeFormat | null; episodeCount: number | null; nextAiring: NextAiring | null; status: AnimeStatus | null }): string | null {
  if (x.format === "MOVIE" || x.status === "NOT_YET_RELEASED" && x.episodeCount == null) return null;
  const fact = episodesFact(x);
  if (!fact) return null;
  return x.episodeCount != null ? episodesWords(x.episodeCount) : fact.value;
}
