import type { AnimeSeason } from "@/types/anime";

/**
 * Japanese anime seasons are calendar quarters: winter Jan-Mar, spring Apr-Jun,
 * summer Jul-Sep, fall Oct-Dec. Pure and clock-free: callers inject the date,
 * so nothing here is ever pinned to a given year.
 */
const ORDER: readonly AnimeSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];

export interface SeasonRef { season: AnimeSeason; year: number }
export type SeasonRelation = "past" | "current" | "future";

/** A particular December premiere can be classified as next winter by AniList; that never moves the whole current season. */
export function currentSeason(now: Date): SeasonRef {
  return { season: ORDER[Math.floor(now.getMonth() / 3)]!, year: now.getFullYear() };
}

const quarterOf = (ref: SeasonRef) => ref.year * 4 + ORDER.indexOf(ref.season);

/** Where a displayed season sits relative to the real current season. */
export function seasonRelation(selected: SeasonRef, now: Date): SeasonRelation {
  const delta = quarterOf(selected) - quarterOf(currentSeason(now));
  return delta === 0 ? "current" : delta < 0 ? "past" : "future";
}
