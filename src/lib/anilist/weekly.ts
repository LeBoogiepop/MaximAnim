import { z } from "zod";
import { request } from "./client";
import { normalizeSummary } from "./normalize";
import { SUMMARY_FIELDS } from "./queries";
import { rawSummarySchema } from "./schema";
import type { AiringEntry, AnimeSummary } from "@/types/anime";

export const WEEKLY_AIRING_QUERY = /* GraphQL */ `
  query WeeklyAiring($page: Int!, $from: Int!, $to: Int!) {
    Page(page: $page, perPage: 50) {
      pageInfo { hasNextPage }
      airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
        mediaId episode airingAt
        media { ${SUMMARY_FIELDS} }
      }
    }
  }
`;
const schema = z.object({ Page: z.object({
  pageInfo: z.object({ hasNextPage: z.boolean() }),
  airingSchedules: z.array(z.object({ mediaId: z.number().int().positive(), episode: z.number().positive(), airingAt: z.number().int(), media: rawSummarySchema.extend({ isAdult: z.boolean().nullish() }).nullish() }).nullable()),
}) });

/** Read-only public metadata, through the existing bounded/cancellable AniList client. */
export async function fetchWeeklyAiring(start: number, end: number, page: number, signal?: AbortSignal, showAdult = false): Promise<{ entries: AiringEntry[]; summaries: AnimeSummary[]; hasNextPage: boolean }> {
  // AniList's comparisons are strict; include exactly Monday midnight, exclude next Monday.
  const data = await request(WEEKLY_AIRING_QUERY, { page, from: Math.floor(start / 1000) - 1, to: Math.ceil(end / 1000) }, schema, signal);
  const entries: AiringEntry[] = [];
  const summaries: AnimeSummary[] = [];
  for (const item of data.Page.airingSchedules) {
    if (!item?.media || item.media.type !== "ANIME" || (!showAdult && item.media.isAdult === true)) continue;
    entries.push({ animeId: item.mediaId, episode: item.episode, airingAt: item.airingAt });
    summaries.push(normalizeSummary(item.media));
  }
  return { entries, summaries, hasNextPage: data.Page.pageInfo.hasNextPage };
}
