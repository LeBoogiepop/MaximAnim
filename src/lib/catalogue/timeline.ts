import { ui } from "@/lib/i18n/translate";
import { GRAPH_PAGES } from "@/config/app";
import type { AnimeEntry, AnimeStatus } from "@/types/anime";

/**
 * How a studio's or a person's list of works is ordered and filtered: by where each work stands in time, never by an
 * invented importance. Announced, airing and completed works share one chronology. Pure.
 */

export type TimelineOrder = "newest" | "oldest";
export type TimelineFilter = "all" | "upcoming" | "airing" | "finished";

export const TIMELINE_ORDERS: { key: TimelineOrder; label: string }[] = [
  { key: "newest", get label() { return ui("Plus récent"); } },
  { key: "oldest", get label() { return ui("Plus ancien"); } },
];

export const TIMELINE_FILTERS: { key: TimelineFilter; label: string }[] = [
  { key: "all", get label() { return ui("Tout"); } },
  { key: "upcoming", get label() { return ui("À venir"); } },
  { key: "airing", get label() { return ui("En cours"); } },
  { key: "finished", get label() { return ui("Terminé"); } },
];

type Phase = "upcoming" | "airing" | "catalogue";

/** « En diffusion » is RELEASING; a hiatus and everything that is over sit in the catalogue. */
export function phaseOf(status: AnimeStatus | null): Phase {
  if (status === "NOT_YET_RELEASED") return "upcoming";
  if (status === "RELEASING") return "airing";
  return "catalogue";
}

/** A sortable number from the start date (year, month, day); the season's year when no date; null when nothing is known. */
export function whenOf(entry: Pick<AnimeEntry, "startDate" | "seasonYear">): number | null {
  const year = entry.startDate?.year ?? entry.seasonYear;
  if (year == null) return null;
  return year * 10_000 + (entry.startDate?.month ?? 0) * 100 + (entry.startDate?.day ?? 0);
}

export function yearOf(entry: Pick<AnimeEntry, "startDate" | "seasonYear">): number | null {
  return entry.startDate?.year ?? entry.seasonYear ?? null;
}

export interface Timeline<T> {
  /** Status facets only; these never form pinned blocks in the displayed chronology. */
  upcoming: T[];
  /** Airing now, the most recent start first. */
  airing: T[];
  /** Every work by year (null: no date, always last), ordered inside and between years. */
  years: { year: number | null; items: T[] }[];
}

export function groupTimeline<T>(items: readonly T[], entryOf: (item: T) => Pick<AnimeEntry, "status" | "startDate" | "seasonYear"> & { id: number }, order: TimelineOrder = "newest"): Timeline<T> {
  const key = (i: T) => whenOf(entryOf(i));
  const asc = (a: T, b: T) => (key(a) ?? Number.POSITIVE_INFINITY) - (key(b) ?? Number.POSITIVE_INFINITY) || entryOf(a).id - entryOf(b).id;
  const desc = (a: T, b: T) => (key(b) ?? Number.NEGATIVE_INFINITY) - (key(a) ?? Number.NEGATIVE_INFINITY) || entryOf(b).id - entryOf(a).id;
  const phase = (i: T) => phaseOf(entryOf(i).status);

  const upcoming = items.filter((i) => phase(i) === "upcoming").sort(asc);
  const airing = items.filter((i) => phase(i) === "airing").sort(desc);
  const rest = [...items].sort(order === "newest" ? desc : asc);

  const years: Timeline<T>["years"] = [];
  for (const item of rest) {
    const year = yearOf(entryOf(item));
    const last = years.at(-1);
    if (last && last.year === year) last.items.push(item);
    else years.push({ year, items: [item] });
  }
  // Works with no date at all come last, whatever the order.
  years.sort((a, b) => Number(a.year == null) - Number(b.year == null));
  return { upcoming, airing, years };
}

export function matchesFilter(status: AnimeStatus | null, filter: TimelineFilter): boolean {
  if (filter === "all") return true;
  if (filter === "upcoming") return status === "NOT_YET_RELEASED";
  if (filter === "airing") return status === "RELEASING" || status === "HIATUS";
  return status === "FINISHED" || status === "CANCELLED";
}

/**
 * Reversal is useful for any multi-work chronology. Status filters appear on mixed longer lists or whenever upcoming
 * titles can be isolated. `more` means more pages exist, not that the loaded chronology is complete.
 */
export function showTimelineControls(statuses: readonly (AnimeStatus | null)[], more = false): { sort: boolean; filter: boolean } {
  const long = statuses.length > GRAPH_PAGES.minForControls || (more && statuses.length >= GRAPH_PAGES.minForControls);
  const phases = new Set(statuses.map((s) => (matchesFilter(s, "upcoming") ? "upcoming" : matchesFilter(s, "airing") ? "airing" : "finished")));
  return { sort: statuses.length > 1 || more, filter: phases.size > 1 && (long || phases.has("upcoming")) };
}
