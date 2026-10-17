import { nextClock } from "@/lib/utils/hash";
import type { AnimeSummary } from "@/types/anime";
import { db } from "./database";
import { upsertAnimeSummary } from "./library";
import { recordDeletion } from "./tombstones";

/**
 * "Suivre les sorties": the only way an anime enters "Cette semaine".
 * Watching, listing or dismissing from Continuer never touches it, and
 * unfollowing touches nothing else (progress, history, lists, the local
 * anime reference all stay).
 */

export async function followAiring(animeId: number, summary?: AnimeSummary): Promise<void> {
  // The schedule renders from the local reference: keep one.
  if (summary) await upsertAnimeSummary(summary);
  await db.transaction("rw", db.airingFollows, db.tombstones, async () => {
    const previous = await db.airingFollows.get(animeId);
    const updatedAt = nextClock(previous?.updatedAt);
    await db.airingFollows.put({ animeId, followedAt: previous?.followedAt ?? updatedAt, updatedAt });
    await db.tombstones.delete(`airingFollows|${animeId}`);
  });
}

export async function unfollowAiring(animeId: number): Promise<void> {
  await db.transaction("rw", db.airingFollows, db.tombstones, async () => {
    if (!(await db.airingFollows.get(animeId))) return;
    await db.airingFollows.delete(animeId);
    await recordDeletion("airingFollows", [animeId]);
  });
}

export async function isFollowingAiring(animeId: number): Promise<boolean> {
  return (await db.airingFollows.get(animeId)) != null;
}

export function followedAiringIds(): Promise<number[]> {
  return db.airingFollows.toCollection().primaryKeys() as Promise<number[]>;
}
