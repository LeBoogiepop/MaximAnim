"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY } from "@/config/app";
import { AniListError, fetchAnime } from "@/lib/anilist/client";
import { hydrateAnime } from "@/lib/anilist/normalize";
import { getAnimeRecord, saveAnimeDetail } from "@/lib/db/library";
import type { Anime } from "@/types/anime";

export interface AnimeResult {
  anime: Anime;
  /** "cache" when AniList was unreachable and the local copy was used. */
  source: "network" | "cache";
  fetchedAt: number | null;
}

export const animeQueryKey = (id: number) => ["anime", id] as const;

/**
 * Network first, IndexedDB second: AniList is the source of truth, but a
 * detail page seen once keeps working offline or when AniList rate-limits.
 */
export function useAnime(id: number | null) {
  return useQuery<AnimeResult, Error>({
    queryKey: animeQueryKey(id ?? 0),
    enabled: id != null,
    staleTime: QUERY.animeStaleMs,
    queryFn: async ({ signal }) => {
      try {
        const anime = await fetchAnime(id!, signal);
        const record = await getAnimeRecord(anime.id);
        // Only persist details of anime already in the library, or refresh an existing cache;
        // browsing search results must not silently fill the database.
        if (record) await saveAnimeDetail(anime);
        return { anime, source: "network", fetchedAt: Date.now() };
      } catch (error) {
        if (error instanceof AniListError && error.kind !== "notFound") {
          const cached = await getAnimeRecord(id!);
          if (cached?.detail) return { anime: hydrateAnime(cached.detail), source: "cache", fetchedAt: cached.detailFetchedAt };
        }
        throw error;
      }
    },
  });
}
