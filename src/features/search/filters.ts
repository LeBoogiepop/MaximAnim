

import { ui } from "@/lib/i18n/translate";
import type { AniListSort, BrowseParams } from "@/lib/anilist/client";
import { currentSeason } from "@/lib/airing/season";
import type { AnimeFormat, AnimeSeason, AnimeStatus } from "@/types/anime";

/** Search filters (a bottom sheet) and the discovery rails shown before typing. */

export type FormatFilter = "series" | "movie" | "ova" | "ona";
export type SortFilter = "relevance" | "popularity" | "score" | "recent";

export interface SearchFilters {
  format: FormatFilter | null;
  status: AnimeStatus | null;
  season: AnimeSeason | null;
  year: number | null;
  genre: string | null;
  sort: SortFilter;
}

export const NO_FILTERS: SearchFilters = { format: null, status: null, season: null, year: null, genre: null, sort: "relevance" };

export const FORMAT_OPTIONS: { value: FormatFilter; label: string; formats: AnimeFormat[] }[] = [
  { value: "series", get label() { return ui("Série"); }, formats: ["TV", "TV_SHORT"] },
  { value: "movie", label: "Film", formats: ["MOVIE"] },
  { value: "ova", label: "OVA", formats: ["OVA", "SPECIAL"] },
  { value: "ona", label: "ONA", formats: ["ONA"] },
];

export const STATUS_OPTIONS: { value: AnimeStatus; label: string }[] = [
  { value: "RELEASING", get label() { return ui("En diffusion"); } },
  { value: "FINISHED", get label() { return ui("Terminé"); } },
  { value: "NOT_YET_RELEASED", get label() { return ui("À venir"); } },
];

export const SEASON_OPTIONS: { value: AnimeSeason; label: string }[] = [
  { value: "WINTER", get label() { return ui("Hiver"); } },
  { value: "SPRING", get label() { return ui("Printemps"); } },
  { value: "SUMMER", get label() { return ui("Été"); } },
  { value: "FALL", get label() { return ui("Automne"); } },
];

export const SORT_OPTIONS: { value: SortFilter; label: string }[] = [
  { value: "relevance", get label() { return ui("Pertinence"); } },
  { value: "popularity", get label() { return ui("Popularité"); } },
  { value: "score", get label() { return ui("Note"); } },
  { value: "recent", get label() { return ui("Récent"); } },
];

/** AniList genres a search filters on, in French (the table lives with the other AniList vocabulary). */
export { GENRES } from "@/lib/anilist/genres";

export function activeFilterCount(f: SearchFilters): number {
  return [f.format, f.status, f.season ?? f.year, f.genre, f.sort !== "relevance" ? f.sort : null].filter((v) => v != null).length;
}

const SORTS: Record<SortFilter, AniListSort[]> = {
  relevance: ["SEARCH_MATCH"],
  popularity: ["POPULARITY_DESC"],
  score: ["SCORE_DESC"],
  recent: ["START_DATE_DESC"],
};

/** Search text + filters → AniList arguments. "Pertinence" without text means popularity. */
export function toBrowseParams(search: string | null, f: SearchFilters): BrowseParams {
  const sort = f.sort === "relevance" && !search ? SORTS.popularity : SORTS[f.sort];
  return {
    search,
    sort,
    format: f.format ? FORMAT_OPTIONS.find((o) => o.value === f.format)!.formats : null,
    status: f.status,
    season: f.season,
    // A season needs a year for AniList; the current one when none is picked.
    seasonYear: f.year ?? (f.season ? new Date().getFullYear() : null),
    genre: f.genre,
  };
}

// ---------- Discovery rails (empty query) ----------

export type RailId = "trending" | "season" | "popular" | "movies";

export const RAILS: { id: RailId; label: string }[] = [
  { id: "trending", get label() { return ui("Tendances"); } },
  { id: "season", get label() { return ui("Cette saison"); } },
  { id: "popular", get label() { return ui("Populaires"); } },
  { id: "movies", get label() { return ui("Films anime"); } },
];

export { currentSeason };

export function railParams(rail: RailId, now: Date): BrowseParams {
  switch (rail) {
    case "trending":
      return { sort: ["TRENDING_DESC"] };
    case "season": {
      const { season, year } = currentSeason(now);
      return { sort: ["POPULARITY_DESC"], season, seasonYear: year };
    }
    case "popular":
      return { sort: ["POPULARITY_DESC"] };
    case "movies":
      return { sort: ["POPULARITY_DESC"], format: ["MOVIE"] };
  }
}
