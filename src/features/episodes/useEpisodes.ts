"use client";
import { useQuery } from "@tanstack/react-query";
import { availableEpisodeCount } from "@/lib/anilist/normalize";
import { buildEpisodeList } from "@/lib/providers/episodes";
import type { PlaybackProvider } from "@/lib/providers/types";
import type { AnimeSummary } from "@/types/anime";
const provider: PlaybackProvider = {
  id: "portfolio", displayName: "Démonstration", language: "multi", runtime: "browser", configured: true, isDemo: true,
  capabilities: { hls: false, mp4: true, qualities: false, subtitles: true, audioTracks: false, episodeMetadata: false },
  async matchAnime(input) { return { providerId: "portfolio", providerAnimeId: String(input.anilistId) }; },
  async getEpisodes(_match, input) { return buildEpisodeList(input.availableEpisodes, null).map(e => ({ id: String(e.number), number: e.number, title: null, thumbnail: null, durationSeconds: null })); },
  async resolveEpisode() { throw new Error("Demo media is selected by the portfolio player, never by a streaming resolver."); },
};
export function useDeveloperMode() { return false; }
export function useProviders() { return { providers: [provider], loading: false }; }
export function useActiveProvider(_animeId?: number, _anime?: AnimeSummary) { return { provider, providers: [provider], loading: false, animeChoice: null, auto: false, alternatives: 0, mode: { kind: "manual" as const, providerId: "portfolio" } }; }
export function useEpisodeList(anime: AnimeSummary | undefined, _provider: PlaybackProvider | null, _requestedEpisode?: number | null) {
  return useQuery({ queryKey: ["portfolio-episodes", anime?.id, anime && availableEpisodeCount(anime)], enabled: !!anime, queryFn: async () => ({ episodes: buildEpisodeList(availableEpisodeCount(anime!), null).map(e => ({ ...e, playable: true })), match: null, unmatched: false, timing: { matchMs: 0, episodesMs: 0 } }), staleTime: Infinity });
}
