import { type QueryClient } from "@tanstack/react-query";
import { QUERY, GRAPH_PAGES } from "@/config/app";
import { fetchAnime } from "@/lib/anilist/client";
import { fetchPersonPage, fetchStudioPage, fetchWork } from "@/lib/anilist/catalogue";
import { retryTransient } from "./shared";
import { animeQueryKey } from "@/features/anime/useAnime";
import { tmdbArtworkOptions } from "@/features/episodes/useTmdbArtwork";

/**
 * The AniList queries of the pages around an anime, as option factories: a screen and the intent prefetch (a finger going
 * down on a link) build the SAME key, so what was prefetched is what the page reads, and the two can never drift apart.
 */

type StudioPage = Awaited<ReturnType<typeof fetchStudioPage>>;
type PersonPage = Awaited<ReturnType<typeof fetchPersonPage>>;

export const studioWorksOptions = (id: number, isMain: boolean, upcoming = false, order: "newest" | "oldest" = "newest") => ({
  queryKey: ["studio", id, isMain ? "main" : "other", ...(upcoming ? ["upcoming"] : []), ...(order === "oldest" ? [order] : [])],
  queryFn: ({ pageParam, signal }: { pageParam: number; signal: AbortSignal }) => fetchStudioPage(id, pageParam, isMain, signal, upcoming, order),
  initialPageParam: 1,
  // STATUS_DESC groups identical statuses. Once the upcoming group is seen and passed,
  // later finished works cannot add upcoming results. Empty/duplicate pages alone never end it.
  getNextPageParam: (last: StudioPage, pages: StudioPage[]) => (last.hasNext && !(upcoming && pages.some(p => p.upcomingSeen) && last.statusTail != null && last.statusTail !== "NOT_YET_RELEASED") ? pages.length + 1 : undefined),
  staleTime: GRAPH_PAGES.staleMs,
  gcTime: GRAPH_PAGES.gcMs,
  retry: retryTransient,
  networkMode: "online" as const,
});

export const personOptions = (id: number, order: "newest" | "oldest" = "newest") => ({
  queryKey: ["person", id, ...(order === "oldest" ? [order] : [])],
  queryFn: ({ pageParam, signal }: { pageParam: number; signal: AbortSignal }) => fetchPersonPage(id, pageParam, signal, order),
  initialPageParam: 1,
  getNextPageParam: (last: PersonPage, pages: PersonPage[]) => (last.hasNext ? pages.length + 1 : undefined),
  staleTime: GRAPH_PAGES.staleMs,
  gcTime: GRAPH_PAGES.gcMs,
  retry: retryTransient,
  networkMode: "online" as const,
});

export const workOptions = (id: number) => ({
  queryKey: ["work", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => fetchWork(id, signal),
  staleTime: GRAPH_PAGES.staleMs,
  gcTime: GRAPH_PAGES.gcMs,
  retry: retryTransient,
  networkMode: "online" as const,
});

/** What a finger going down on a link is a hint of: the data of the page it opens, asked for now, cancelled by nothing. Never more than the tapped target. */
export const intent = {
  studio: (qc: QueryClient, id: number) => void qc.prefetchInfiniteQuery(studioWorksOptions(id, true)),
  person: (qc: QueryClient, id: number) => void qc.prefetchInfiniteQuery(personOptions(id)),
  work: (qc: QueryClient, id: number) => void qc.prefetchQuery(workOptions(id)),
  anime: (qc: QueryClient, id: number) => {
    // The one tapped card may warm its verified artwork, never the entire rail.
    void qc.prefetchQuery(tmdbArtworkOptions(id));
    return qc.prefetchQuery({
      queryKey: animeQueryKey(id),
      staleTime: QUERY.animeStaleMs,
      queryFn: async ({ signal }) => ({ anime: await fetchAnime(id, signal), source: "network" as const, fetchedAt: Date.now() }),
    });
  },
};
