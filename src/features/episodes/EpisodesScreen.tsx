"use client";
import { useAnime } from "@/features/anime/useAnime";
import { InlineEpisodes } from "./InlineEpisodes";
import { DetailTopBar } from "@/components/layout/DetailTopBar";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { ui } from "@/lib/i18n/translate";
export function EpisodesScreen({ animeId }: { animeId: number }) {
 const query = useAnime(animeId);
 useInterfaceLanguage();
 return <div><DetailTopBar fallback={`/anime/${animeId}`} />{query.data ? <InlineEpisodes anime={query.data.anime} /> : <p className="px-safe">{ui("Chargement…")}</p>}</div>;
}
