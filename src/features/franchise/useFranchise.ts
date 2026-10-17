"use client";

import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { FRANCHISE } from "@/config/app";
import { fetchFranchiseNodes } from "@/lib/anilist/client";
import { FranchiseNotFound, localFranchise, resolveFranchise } from "@/lib/franchise/resolve";
import { groupSearchResults, type SearchRow } from "@/lib/franchise/group";
import { buildWatchSeasons, type WatchSeasons } from "@/lib/franchise/watch-seasons";
import { useTitles } from "@/features/settings/PreferencesContext";
import type { Anime, AnimeSummary, Franchise } from "@/types/anime";

/** One more try for a flaky network; an entry AniList does not have is not worth asking twice. */
const retryOnce = (count: number, error: unknown) => !(error instanceof FranchiseNotFound) && count < 1;

export const franchiseKey = (id: number) => ["franchise", id] as const;

/**
 * Resolves the franchise of an entry: one batched AniList request per level of the walk, cached for hours. Once resolved
 * (and not truncated) every entry of the main series gets the same answer in the cache, so moving from one season to the
 * next costs nothing.
 */
function franchiseOptions(queryClient: QueryClient, id: number) {
  return {
    queryKey: franchiseKey(id),
    staleTime: FRANCHISE.staleMs,
    gcTime: 24 * 60 * 60 * 1000,
    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<Franchise> => {
      const franchise = await resolveFranchise(id, (ids) => fetchFranchiseNodes(ids, signal));
      if (!franchise.truncated) for (const m of franchise.main) if (m.entry.id !== id) queryClient.setQueryData(franchiseKey(m.entry.id), franchise);
      return franchise;
    },
  };
}

/**
 * The franchise as the anime page shows it: what the detail already holds at once (no request — a standalone work is
 * complete right away), then the walk fills in the rest without moving what is already on screen.
 */
export function useFranchise(anime: Anime): { franchise: Franchise; resolved: boolean; failed: boolean } {
  const queryClient = useQueryClient();
  const local = useMemo(() => localFranchise(anime), [anime]);
  const walk = useQuery({ ...franchiseOptions(queryClient, anime.id), enabled: !local.complete, retry: retryOnce, networkMode: "online" });
  return { franchise: walk.data ?? local.franchise, resolved: local.complete || walk.isSuccess, failed: walk.isError };
}

/** The franchise page: resolved from an id alone. */
export function useFranchiseOf(id: number, enabled = true) {
  const queryClient = useQueryClient();
  return useQuery({ ...franchiseOptions(queryClient, id), enabled, retry: retryOnce, networkMode: "online" });
}

/**
 * Search results regrouped by franchise. The results show at once as they are; one batched request for their relations
 * regroups them when it answers, and its failure leaves the list exactly as it was.
 */
export function useFranchiseGrouping(items: readonly AnimeSummary[]): SearchRow[] {
  const ids = items.map((i) => i.id).slice(0, FRANCHISE.batchSize);
  const nodes = useQuery({
    queryKey: ["franchise-group", ids.join(",")],
    queryFn: ({ signal }) => fetchFranchiseNodes(ids, signal),
    enabled: ids.length >= 2,
    staleTime: 60 * 60 * 1000,
    retry: false,
    networkMode: "online",
  });
  return useMemo(() => (nodes.data ? groupSearchResults(items, nodes.data) : items.map((anime): SearchRow => ({ kind: "entry", anime }))), [items, nodes.data]);
}


/**
 * The seasons / parts / films of the franchise of `animeId`, ready for the player's episode sheet (docs/v1-seasons-contract.md).
 * Shares the franchise cache with the fiche: after the fiche was opened it costs no request. While unresolved `seasons` is
 * null (render nothing, never a placeholder); on failure it stays null.
 */
export function useFranchiseSeasons(animeId: number | null): { seasons: WatchSeasons | null; isPending: boolean } {
  const { main } = useTitles();
  const query = useFranchiseOf(animeId ?? 0, animeId != null);
  const franchise = query.data;
  const seasons = useMemo(() => (franchise && animeId != null ? buildWatchSeasons(franchise, animeId, (e) => main(e.titles)) : null), [franchise, animeId, main]);
  return { seasons, isPending: animeId != null && query.isPending };
}
