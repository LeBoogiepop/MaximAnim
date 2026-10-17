import { toSummary } from "@/lib/anilist/normalize";
import { nextClock } from "@/lib/utils/hash";
import type { Anime, AnimeSummary } from "@/types/anime";
import { db } from "./database";
import type { AnimeRecord } from "./types";

function sameSummary(a: AnimeSummary, b: AnimeSummary): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Keeps the local reference of an anime fresh without dropping a cached detail. */
export async function upsertAnimeSummary(summary: AnimeSummary): Promise<void> {
  await db.transaction("rw", db.anime, async () => {
    const existing = await db.anime.get(summary.id);
    const next = toSummary(summary);
    // Only the summary is synced: an unchanged one keeps its sync clock.
    if (existing && sameSummary(existing.summary, next)) return;
    await db.anime.put({
      id: summary.id,
      summary: next,
      detail: existing?.detail ?? null,
      detailFetchedAt: existing?.detailFetchedAt ?? null,
      updatedAt: nextClock(existing?.updatedAt),
    });
  });
}

export async function saveAnimeDetail(anime: Anime): Promise<void> {
  const now = Date.now();
  await db.transaction("rw", db.anime, async () => {
    const existing = await db.anime.get(anime.id);
    const summary = toSummary(anime);
    const changed = !existing || !sameSummary(existing.summary, summary);
    await db.anime.put({
      id: anime.id,
      summary,
      detail: anime,
      detailFetchedAt: now,
      updatedAt: changed ? nextClock(existing?.updatedAt, now) : existing.updatedAt,
    });
  });
}

export function getAnimeRecord(id: number): Promise<AnimeRecord | undefined> {
  return db.anime.get(id);
}

export async function getAnimeMap(ids?: number[]): Promise<Map<number, AnimeRecord>> {
  const records = ids ? (await db.anime.bulkGet(ids)).filter((r): r is AnimeRecord => r != null) : await db.anime.toArray();
  return new Map(records.map((r) => [r.id, r]));
}
