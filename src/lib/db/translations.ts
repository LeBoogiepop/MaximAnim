import { TRANSLATION, TRANSLATOR } from "@/config/app";
import { sha256Hex } from "@/lib/utils/hash";
import { db } from "./database";

/**
 * Device-local cache of translated subtitle files. Not critical (a miss just translates again), never synced,
 * never in backups. Keyed by the normalized source WebVTT's hash + languages + translator id/version + format version,
 * so a changed file, translator or pipeline never serves a stale translation.
 */

export async function translationCacheKey(sourceVtt: string): Promise<string> {
  const hash = await sha256Hex(sourceVtt);
  return [hash, TRANSLATION.sourceLang, TRANSLATION.targetLang, TRANSLATOR.id, TRANSLATOR.version, `f${TRANSLATION.formatVersion}`].join("|");
}

export async function getCachedTranslation(key: string): Promise<string | null> {
  try {
    const row = await db.subtitleTranslations.get(key);
    if (!row) return null;
    void db.subtitleTranslations.update(key, { lastUsedAt: Date.now() }).catch(() => undefined);
    return row.vtt;
  } catch {
    return null;
  }
}

export async function putCachedTranslation(key: string, vtt: string): Promise<void> {
  try {
    const now = Date.now();
    await db.subtitleTranslations.put({ id: key, vtt, createdAt: now, lastUsedAt: now });
    const count = await db.subtitleTranslations.count();
    if (count > TRANSLATION.cacheEntries) {
      const oldest = await db.subtitleTranslations
        .orderBy("lastUsedAt")
        .limit(count - TRANSLATION.cacheEntries)
        .primaryKeys();
      await db.subtitleTranslations.bulkDelete(oldest);
    }
  } catch {
    // A full or unavailable cache only means the next play translates again.
  }
}
