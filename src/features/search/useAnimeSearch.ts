"use client";

import { useQuery } from "@tanstack/react-query";
import { usePreferences } from "@/features/settings/PreferencesContext";
import { QUERY, SEARCH } from "@/config/app";
import { type BrowseParams, browseAnime, browseEntries, fetchPrefixCandidates } from "@/lib/anilist/client";
import { isPoor, typoFallback } from "@/lib/search/fallback";
import { matchesTitlePrefix, rankSearch } from "@/lib/search/ranking";
import type { AnimeSummary } from "@/types/anime";
import { activeFilterCount, type SearchFilters, toBrowseParams } from "./filters";

export function normalizeQuery(q: string): string {
  return q.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

export interface SearchResult {
  items: AnimeSummary[];
  /** Some results come from the typo fallback ("Résultats approchants"). */
  approximate: boolean;
}

/**
 * The normal AniList search; when it finds nothing useful (and no filter
 * narrows it on purpose), ONE bounded typo-fallback request whose
 * candidates are ranked locally and put first. The query key changes as the
 * user types, and TanStack Query aborts the stale request's signal, so a
 * slow answer never overwrites a newer one; results are cached briefly.
 */
export async function searchWithFallback(q: string, filters: SearchFilters, signal?: AbortSignal, showAdult = false): Promise<SearchResult> {
  const entries = await browseEntries({ ...toBrowseParams(q, filters), showAdult }, signal);
  if (q.length >= SEARCH.minQueryLength && q.length < SEARCH.fallbackMinLength && !q.includes(" ")) {
    try {
      const pool = await fetchPrefixCandidates({ ...toBrowseParams(null, filters), showAdult }, signal);
      const seen = new Set(entries.map(e => e.anime.id));
      for (const entry of pool) if (!seen.has(entry.anime.id) && matchesTitlePrefix(q, entry.anime, entry.synonyms)) {
        entries.push(entry); seen.add(entry.anime.id);
      }
    } catch (error) {
      if ((error as Error)?.name === "AbortError") throw error;
      // An unavailable pool must not discard the upstream results.
    }
  }
  const synonyms = new Map(entries.map((e) => [e.anime.id, e.synonyms]));
  const items = rankSearch(q, entries.map((e) => e.anime), synonyms).slice(0, SEARCH.perPage);
  if (activeFilterCount(filters) > 0 || q.length < SEARCH.fallbackMinLength || !isPoor(q, items, synonyms)) return { items, approximate: false };
  let approx: AnimeSummary[];
  try {
    approx = await typoFallback(q, signal);
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    // The fallback is a bonus: its failure never hides the normal results.
    return { items, approximate: false };
  }
  if (!approx.length) return { items, approximate: false };
  const seen = new Set(approx.map((a) => a.id));
  return { items: [...approx, ...items.filter((a) => !seen.has(a.id))].slice(0, SEARCH.perPage), approximate: true };
}

export function useAnimeSearch(debouncedQuery: string, filters: SearchFilters, restored = true) {
  const { showAdult } = usePreferences();
  const q = normalizeQuery(debouncedQuery);
  const enabled = restored && q.length >= SEARCH.minQueryLength;
  return useQuery<SearchResult, Error>({
    queryKey: ["search", q, filters, showAdult === true],
    queryFn: ({ signal }) => searchWithFallback(q, filters, signal, showAdult === true),
    select: result => ({ ...result, items: result.items.filter(a => showAdult === true || a.isAdult !== true) }),
    enabled,
    staleTime: QUERY.searchStaleMs,
    // A restored query must not display another query's cached results while loading.
    networkMode: "online",
  });
}

/** Discovery (rails) and filter-only browsing: no text, cached longer. */
export function useBrowse(key: string, params: BrowseParams | null) {
  const { showAdult } = usePreferences();
  return useQuery<AnimeSummary[], Error>({
    queryKey: ["browse", key, showAdult === true],
    queryFn: ({ signal }) => browseAnime({ ...params!, showAdult: showAdult === true }, signal),
    select: items => items.filter(a => showAdult === true || a.isAdult !== true),
    enabled: params != null,
    staleTime: SEARCH.discoverStaleMs,
    // A different discovery rail is a different list, never a temporary stand-in.
    networkMode: "online",
  });
}
