import { EXTERNAL_SUBTITLES } from "@/config/app";
import type { ExternalProviderId, ExternalSearchResult } from "@/lib/subtitles/external/types";
import { db } from "./database";

/**
 * Device-local cache of external subtitles. Not critical (a miss just asks again), never synced, never in backups.
 * A cached file keeps playing when the provider is down; a cached search keeps the choice offline.
 * Keys carry anime, episode, provider, the provider's file id, language and the cache version, so a changed
 * pipeline (`EXTERNAL_SUBTITLES.cacheVersion`) never serves a stale conversion.
 */

const v = `v${EXTERNAL_SUBTITLES.cacheVersion}`;
const lang = EXTERNAL_SUBTITLES.language;

export const fileKey = (animeId: number, episode: number, provider: ExternalProviderId, id: string) => `file|${animeId}|${episode}|${provider}|${id}|${lang}|${v}`;
export const searchKey = (animeId: number, episode: number) => `search|${animeId}|${episode}|${lang}|${v}`;
export const offsetKey = (animeId: number, episode: number, provider: ExternalProviderId, id: string) => `offset|${animeId}|${episode}|${provider}|${id}`;

/** A candidate as kept between visits: what the menu needs, nothing the provider sent beyond that. */
export type CachedSearch = Pick<ExternalSearchResult, "candidates" | "notApplicable">;

export interface StoredOffset {
  seconds: number;
  /** "aligned": measured against the video source's own English track; "manual": the viewer's. A manual value is never overwritten. */
  by: "aligned" | "manual";
}

async function touch(id: string): Promise<void> {
  await db.externalSubtitles.update(id, { lastUsedAt: Date.now() }).catch(() => undefined);
}

export async function getCachedFile(key: string): Promise<string | null> {
  try {
    const row = await db.externalSubtitles.get(key);
    if (!row?.vtt) return null;
    void touch(key);
    return row.vtt;
  } catch {
    return null;
  }
}

export async function putCachedFile(key: string, vtt: string): Promise<void> {
  try {
    const now = Date.now();
    await db.externalSubtitles.put({ id: key, kind: "file", vtt, createdAt: now, lastUsedAt: now });
    const count = await db.externalSubtitles.where("kind").equals("file").count();
    if (count > EXTERNAL_SUBTITLES.cacheFiles) {
      const oldest = await db.externalSubtitles
        .where("kind")
        .equals("file")
        .sortBy("lastUsedAt")
        .then((rows) => rows.slice(0, count - EXTERNAL_SUBTITLES.cacheFiles).map((r) => r.id));
      await db.externalSubtitles.bulkDelete(oldest);
    }
  } catch {
    // A full or unavailable cache only means the next play downloads again.
  }
}

export async function getCachedSearch(key: string): Promise<{ search: CachedSearch; fresh: boolean } | null> {
  try {
    const row = await db.externalSubtitles.get(key);
    if (!row?.payload) return null;
    const search = JSON.parse(row.payload) as CachedSearch;
    if (!Array.isArray(search.candidates)) return null;
    const ttl = search.candidates.length ? EXTERNAL_SUBTITLES.searchTtlMs : EXTERNAL_SUBTITLES.emptySearchTtlMs;
    return { search, fresh: Date.now() - row.createdAt < ttl };
  } catch {
    return null;
  }
}

export async function putCachedSearch(key: string, search: CachedSearch): Promise<void> {
  try {
    const now = Date.now();
    await db.externalSubtitles.put({ id: key, kind: "search", payload: JSON.stringify(search), createdAt: now, lastUsedAt: now });
  } catch {
    // Not critical.
  }
}

export async function getOffset(key: string): Promise<StoredOffset | null> {
  try {
    const row = await db.externalSubtitles.get(key);
    if (!row?.payload) return null;
    const parsed = JSON.parse(row.payload) as StoredOffset;
    return typeof parsed.seconds === "number" && (parsed.by === "aligned" || parsed.by === "manual") ? parsed : null;
  } catch {
    return null;
  }
}

export async function putOffset(key: string, offset: StoredOffset): Promise<void> {
  try {
    const now = Date.now();
    await db.externalSubtitles.put({ id: key, kind: "offset", payload: JSON.stringify(offset), createdAt: now, lastUsedAt: now });
  } catch {
    // The offset still applies for this playback.
  }
}
