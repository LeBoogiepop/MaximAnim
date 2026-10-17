import type { AnimeSummary } from "@/types/anime";
import { releaseDayLabel } from "./schedule";

export type AiringEntry = Pick<AnimeSummary, "status" | "nextAiring"> & Partial<Pick<AnimeSummary, "episodeCount">>;

export type EpisodeAvailability =
  | { kind: "future"; airingAt: number | null }
  | { kind: "outside-entry" }
  | { kind: "aired" }
  | { kind: "unknown" };

/** Entry-local numbering only. A provider's catalogue is never evidence of an airing date. */
export function episodeAvailability(anime: AiringEntry, episode: number, now = Date.now()): EpisodeAvailability {
  if (anime.episodeCount != null && episode > anime.episodeCount) return { kind: "outside-entry" };
  const next = anime.nextAiring;
  if (next && next.airingAt * 1000 > now && episode >= next.episode) {
    return { kind: "future", airingAt: episode === next.episode ? next.airingAt : null };
  }
  // The scheduled time can elapse before AniList refreshes the season status.
  // This only permits looking for a stream; it proves no provider has one.
  if (next && episode === next.episode && next.airingAt * 1000 <= now) return { kind: "aired" };
  if (anime.status === "NOT_YET_RELEASED") return { kind: "future", airingAt: null };
  if (anime.status === "FINISHED" || (next && episode < next.episode)) return { kind: "aired" };
  return { kind: "unknown" };
}

export function episodePlaybackBlocked(anime: AiringEntry, episode: number, now = Date.now()): boolean {
  const state = episodeAvailability(anime, episode, now);
  return state.kind === "future" || state.kind === "outside-entry";
}

/** The only episode for which AniList supplies an exact upcoming date. */
export function upcomingEpisodeNumber(anime: Pick<AnimeSummary, "nextAiring">, now = Date.now()): number | null {
  const next = anime.nextAiring;
  return next && next.airingAt * 1000 > now ? next.episode : null;
}

/** Presentation helper accepts AniList's epoch seconds, like EpisodeAvailability. */
export function availabilityDay(airingAt: number, now = Date.now()): string {
  return releaseDayLabel(airingAt * 1000, now);
}
