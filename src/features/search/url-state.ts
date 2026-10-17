import { FORMAT_OPTIONS, GENRES, NO_FILTERS, RAILS, type RailId, SEASON_OPTIONS, type SearchFilters, SORT_OPTIONS, STATUS_OPTIONS } from "./filters";

/**
 * The part of the search worth coming back to, kept in the page's own history entry (`/search?q=…&…`) so the browser's
 * Back restores it by itself. The session layer also retains this state across tab visits; explicit URLs take precedence. Every value is checked against the known options — a hand-edited URL never injects anything.
 */
export interface SearchUrlState {
  q: string;
  filters: SearchFilters;
  rail: RailId;
}

export const DEFAULT_RAIL: RailId = "trending";

const MAX_QUERY = 120;

export function parseSearchUrl(search: string): SearchUrlState {
  const params = new URLSearchParams(search);
  const q = (params.get("q") ?? "").slice(0, MAX_QUERY);
  const pick = <T extends string>(value: string | null, allowed: readonly T[]): T | null => (value != null && (allowed as readonly string[]).includes(value) ? (value as T) : null);
  const year = Number(params.get("year"));
  const filters: SearchFilters = {
    format: pick(params.get("format"), FORMAT_OPTIONS.map((o) => o.value)),
    status: pick(params.get("status"), STATUS_OPTIONS.map((o) => o.value)),
    season: pick(params.get("season"), SEASON_OPTIONS.map((o) => o.value)),
    year: Number.isInteger(year) && year >= 1900 && year <= 2200 ? year : null,
    genre: pick(params.get("genre"), GENRES.map((g) => g.value)),
    sort: pick(params.get("sort"), SORT_OPTIONS.map((o) => o.value)) ?? NO_FILTERS.sort,
  };
  const rail = params.get("rail") === "next-season" ? "season" : pick(params.get("rail"), RAILS.map((r) => r.id)) ?? DEFAULT_RAIL;
  return { q, filters, rail };
}

/** `?…` for a state, or "" when it is the fresh one. */
export function searchUrlQuery(state: SearchUrlState): string {
  const params = new URLSearchParams();
  const q = state.q.trim();
  if (q) params.set("q", q.slice(0, MAX_QUERY));
  const { filters } = state;
  if (filters.format) params.set("format", filters.format);
  if (filters.status) params.set("status", filters.status);
  if (filters.season) params.set("season", filters.season);
  if (filters.year != null) params.set("year", String(filters.year));
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.sort !== NO_FILTERS.sort) params.set("sort", filters.sort);
  if (state.rail !== DEFAULT_RAIL) params.set("rail", state.rail);
  const text = params.toString();
  return text ? `?${text}` : "";
}
