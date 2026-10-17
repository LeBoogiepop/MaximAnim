"use client";

import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { GRAPH_PAGES, WATCH_CREDITS } from "@/config/app";
import { fetchAnime } from "@/lib/anilist/client";
import { fetchStaffPage } from "@/lib/anilist/catalogue";
import { buildWatchCredits, mergeStaff } from "@/lib/credits/build";
import type { StaffInput, StudioInput, WatchCredits } from "@/lib/credits/types";
import { isSingleItem } from "@/lib/anilist/normalize";
import { animeQueryKey, type AnimeResult } from "./useAnime";

interface RawCredits {
  staff: StaffInput[];
  studios: StudioInput[];
  singleItem: boolean;
  complete: boolean;
}

export const watchCreditsKey = (animeId: number) => ["watch-credits", animeId] as const;

/**
 * What the credits of an anime are made from: its detail (already cached by the fiche, else ONE request), plus at most
 * `WATCH_CREDITS.maxPages` pages of the staff list, read once and shared by every episode. Requests are sequential and stop
 * at the last page. The per-episode view is derived locally, so changing episode costs nothing.
 */
export function useWatchCredits(animeId: number | null, episodeNumber: number): { credits: WatchCredits | null; staff: readonly StaffInput[]; isPending: boolean; isError: boolean } {
  const queryClient = useQueryClient();
  const partialKey = ["watch-credits-partial", animeId ?? 0];
  // Observe progressive cache writes without registering a fetchable query.
  const partial = useQuery<RawCredits>({ queryKey: partialKey, queryFn: skipToken, gcTime: GRAPH_PAGES.gcMs });
  const query = useQuery<RawCredits>({
    queryKey: watchCreditsKey(animeId ?? 0),
    enabled: animeId != null,
    staleTime: GRAPH_PAGES.staleMs,
    gcTime: GRAPH_PAGES.gcMs,
    retry: 1,
    networkMode: "online",
    queryFn: async ({ signal }) => {
      const id = animeId!;
      const cached = queryClient.getQueryData<AnimeResult>(animeQueryKey(id))?.anime;
      const anime = cached ?? (await fetchAnime(id, signal));
      const pages: StaffInput[][] = [];
      const headline: StaffInput[] = anime.staff.map((s) => ({ id: s.id, name: s.name, nativeName: s.nativeName, roles: s.roles ?? [], image: s.image }));
      const publish = (complete: boolean) => {
        const partial = { staff: mergeStaff([...pages, headline]), studios: anime.studios, singleItem: isSingleItem(anime), complete };
        queryClient.setQueryData(["watch-credits-partial", id], partial);
        return partial;
      };
      // Episode credits arrive page by page. A slow/failing later page must not
      // hide already verified credits or make them appear tied to a source swap.
      publish(false);
      // The « Tout le staff » screen may already hold pages: reuse them, ask only for what is missing.
      const known = queryClient.getQueryData<{ pages: { items: StaffInput[]; hasNext: boolean }[] }>(["staff", id])?.pages ?? [];
      let hasNext = true;
      for (const page of known.slice(0, WATCH_CREDITS.maxPages)) {
        pages.push(page.items);
        hasNext = page.hasNext;
        publish(!hasNext);
      }
      for (let n = pages.length + 1; hasNext && n <= WATCH_CREDITS.maxPages; n++) {
        const page = await queryClient.fetchQuery({ queryKey: ["staff-page", id, n], queryFn: () => fetchStaffPage(id, n, signal), staleTime: GRAPH_PAGES.staleMs });
        pages.push(page.items);
        hasNext = page.hasNext;
        publish(!hasNext);
      }
      return {
        staff: mergeStaff([...pages, headline]),
        studios: anime.studios,
        singleItem: isSingleItem(anime),
        complete: !hasNext,
      };
    },
  });
  const raw = query.data ?? partial.data;
  const credits = useMemo(() => (raw && animeId != null ? buildWatchCredits({ animeId, episode: episodeNumber, ...raw }) : null), [raw, animeId, episodeNumber]);
  return { credits, staff: raw?.staff ?? [], isPending: query.isPending, isError: query.isError };
}

