import { z } from "zod";
import { GRAPH_PAGES } from "@/config/app";
import type { AnimeEntry, AnimeSeason, MediaSource } from "@/types/anime";
import { request } from "./client";
import { normalizeEntry } from "./normalize";
import { ENTRY_FIELDS } from "./queries";
import { rawEntrySchema } from "./schema";

export const SEASONS: readonly AnimeSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];
export interface SeasonSelection { season: AnimeSeason; year: number; source?: MediaSource }
export function shiftSeason(value: SeasonSelection, amount: number): SeasonSelection {
  const quarter = value.year * 4 + SEASONS.indexOf(value.season) + amount;
  return { ...value, season: SEASONS[((quarter % 4) + 4) % 4]!, year: Math.floor(quarter / 4) };
}

export function seasonalQuery(showAdult: boolean, filtered = false) {
  return /* GraphQL */ `query SeasonalCatalogue($season: MediaSeason!, $year: Int!, $page: Int!, $perPage: Int!${filtered ? ", $source: MediaSource!" : ""}) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(type: ANIME, season: $season, seasonYear: $year${filtered ? ", source: $source" : ""}, sort: [POPULARITY_DESC, ID]${showAdult ? "" : ", isAdult: false"}) { ${ENTRY_FIELDS} }
    }
  }`;
}
const schema = z.object({ Page: z.object({ pageInfo: z.object({ hasNextPage: z.boolean() }), media: z.array(rawEntrySchema.nullable()) }) });
/** The catalogue is classified by AniList's season, not guessed from a premiere month. */
export async function fetchSeasonPage(value: SeasonSelection, page: number, showAdult: boolean, signal?: AbortSignal, source: MediaSource | null = null): Promise<{ items: AnimeEntry[]; hasNext: boolean }> {
  const data = await request(seasonalQuery(showAdult, source != null), { season: value.season, year: value.year, page, perPage: GRAPH_PAGES.pageSize, ...(source ? { source } : {}) }, schema, signal);
  return {
    items: data.Page.media.filter((m): m is NonNullable<typeof m> => m != null && m.type === "ANIME" && m.season === value.season && m.seasonYear === value.year && (!source || m.source === source) && (showAdult || m.isAdult !== true)).map(normalizeEntry),
    hasNext: data.Page.pageInfo.hasNextPage,
  };
}
