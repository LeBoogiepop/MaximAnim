"use client";
import { useAnime } from "@/features/anime/useAnime";
import { InlineEpisodes } from "./InlineEpisodes";
import { DetailTopBar } from "@/components/layout/DetailTopBar";
export function EpisodesScreen({ animeId }: { animeId: number }) {
 const query = useAnime(animeId);
 return <div><DetailTopBar fallback={`/anime/${animeId}`} />{query.data ? <InlineEpisodes anime={query.data.anime} /> : <p className="px-safe">Chargement…</p>}</div>;
}
