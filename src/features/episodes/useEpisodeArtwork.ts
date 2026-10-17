"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchEpisodePreviews } from "@/lib/anilist/episodes";
import { QUERY } from "@/config/app";
export function useEpisodeArtwork(animeId: number, enabled = true) { const result = useQuery({ queryKey: ["episode-previews", animeId], queryFn: ({ signal }) => fetchEpisodePreviews(animeId, signal), enabled, staleTime: QUERY.animeStaleMs, gcTime: QUERY.gcMs, retry: false }); return result.data ?? []; }
export function useEpisodeArtworkSettled(animeId: number, enabled = true) { const result = useQuery({ queryKey: ["episode-previews", animeId], queryFn: ({ signal }) => fetchEpisodePreviews(animeId, signal), enabled, staleTime: QUERY.animeStaleMs, gcTime: QUERY.gcMs, retry: false }); return !result.isPending; }
