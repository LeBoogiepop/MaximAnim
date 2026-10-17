"use client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { emptyTmdbArtwork } from "@/lib/artwork/tmdb";
export const tmdbArtworkOptions = (animeId: number) => queryOptions({ queryKey: ["public-artwork", animeId], queryFn: async () => emptyTmdbArtwork(animeId, "unmapped"), staleTime: Infinity });
export function useTmdbArtwork(animeId: number, enabled = true) { return useQuery({ ...tmdbArtworkOptions(animeId), enabled }); }
export function useTmdbEpisodes(animeId: number, enabled = true) { return useQuery({ queryKey: ["public-episode-artwork", animeId], queryFn: async () => ({ animeId, episodes: [] }), enabled, staleTime: Infinity }); }
