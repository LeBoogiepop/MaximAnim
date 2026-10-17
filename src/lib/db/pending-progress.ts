import { z } from "zod";
import type { PlaybackSample } from "@/lib/progress/logic";
import { db } from "./database";
import { savePlaybackSample } from "./progress";

/**
 * IndexedDB writes started in `pagehide` (app swiped away, tab closed) are
 * often killed before they commit. The last sample is therefore also stashed
 * synchronously in localStorage — one tiny, disposable record — and folded
 * into IndexedDB on the next launch. IndexedDB stays the source of truth.
 */

const KEY = "maxime-anime:pending-progress";

const sampleSchema = z.object({
  animeId: z.number().int().positive(),
  episodeNumber: z.number().positive(),
  providerId: z.string().nullable(),
  providerEpisodeId: z.string().nullable(),
  currentTime: z.number().nonnegative(),
  duration: z.number().nonnegative(),
  ended: z.boolean().optional(),
  now: z.number().int().nonnegative(),
  completionThreshold: z.number().min(0.5).max(1).optional(),
});

export function stashPendingSample(sample: PlaybackSample): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(sample));
  } catch {
    // Private mode / quota: the regular IndexedDB save still runs.
  }
}

export async function flushPendingSample(): Promise<void> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return;
  }
  if (!raw) return;
  try {
    const parsed = sampleSchema.safeParse(JSON.parse(raw));
    if (parsed.success) {
      const sample = parsed.data;
      const id = `${sample.animeId}:${sample.episodeNumber}`;
      const existing = await db.progress.get(id);
      // A deletion made after the sample was stashed (« pas vu », « Réinitialiser le visionnage ») stands: the stash must not bring it back.
      const deleted = await db.tombstones.get(`progress|${id}`);
      const forgotten = deleted != null && deleted.deletedAt >= sample.now;
      // Only if the stash is newer than what IndexedDB managed to commit.
      if (!forgotten && (!existing || existing.lastWatchedAt < sample.now)) await savePlaybackSample(sample);
    }
  } catch {
    // Corrupt stash: drop it.
  }
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
