import { AIRING } from "@/config/app";
import { fetchAiringUpdate } from "@/lib/anilist/client";
import { db } from "@/lib/db/database";
import { getAnimeMap, upsertAnimeSummary } from "@/lib/db/library";
import type { AnimeRecord } from "@/lib/db/types";
import type { AiringEntry } from "@/types/anime";
import { isMonitored, scheduleWindow } from "./schedule";

/**
 * Airing anime the user explicitly follows ("Suivre les sorties") get their AniList card
 * refreshed — status, next episode — at launch and on return to the app when
 * stale, plus the airing schedule of the week. One request per batch of 25
 * anime; providers are never queried here. Finished anime are not monitored.
 *
 * The schedule is a device-local cache (localStorage): re-fetchable, never
 * synced, never in backups. Refreshed summaries go through the normal library
 * write (sync clock bumped only when something changed).
 */

export interface AiringCache {
  /** When it was fetched (ms). */
  at: number;
  /** Anime it covers: a newly followed one makes it incomplete, whatever its age. */
  ids: number[];
  entries: AiringEntry[];
}

const STORAGE_KEY = "maxime-anime:airing";
let cache: AiringCache | null | undefined;
const listeners = new Set<() => void>();

function load(): AiringCache | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as AiringCache | null;
    if (!parsed || typeof parsed.at !== "number" || !Array.isArray(parsed.entries)) return null;
    return { at: parsed.at, ids: Array.isArray(parsed.ids) ? parsed.ids.filter(Number.isInteger) : [], entries: parsed.entries.filter((e) => Number.isInteger(e?.animeId) && Number.isInteger(e?.episode) && Number.isInteger(e?.airingAt)) };
  } catch {
    return null;
  }
}

export function getAiringCache(): AiringCache | null {
  if (cache === undefined) cache = typeof localStorage === "undefined" ? null : load();
  return cache;
}

function setAiringCache(next: AiringCache): void {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode / quota: the in-memory copy still serves this session.
  }
  for (const l of listeners) l();
}

export function subscribeAiring(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Anime the user explicitly follows that can still gain episodes. Only
 * `airingFollows` counts: watching an episode or listing an anime is not a
 * request to monitor its releases.
 */
export async function followedAiringAnime(): Promise<AnimeRecord[]> {
  const ids = (await db.airingFollows.toCollection().primaryKeys()) as number[];
  const records = await getAnimeMap(ids);
  return [...records.values()].filter((r) => isMonitored(r.summary));
}

/**
 * Every follow the schedule must cover: the ones that can still gain episodes, and the ones whose anime is not
 * on this device yet (a follow synced from another device arrives without its card — it is fetched here, not
 * silently dropped). Only a follow known to be finished is left out.
 */
export async function airingRefreshIds(): Promise<number[]> {
  const ids = (await db.airingFollows.toCollection().primaryKeys()) as number[];
  const records = await getAnimeMap(ids);
  return ids.filter((id) => {
    const record = records.get(id);
    return !record || isMonitored(record.summary);
  });
}

type Fetcher = typeof fetchAiringUpdate;
let inflight: Promise<boolean> | null = null;

/**
 * Refreshes when stale, when a follow is not covered yet, or when forced. Resolves true when fresh data was
 * stored. Never throws. A call made while a refresh is running waits for it, then checks coverage again: a
 * follow added meanwhile is never left waiting for the next launch.
 */
export function refreshAiring(options: { force?: boolean; now?: number; fetcher?: Fetcher } = {}): Promise<boolean> {
  const now = options.now ?? Date.now();
  if (typeof navigator !== "undefined" && navigator.onLine === false) return Promise.resolve(false);
  if (inflight) return inflight.then((stored) => refreshAiring({ ...options, force: false }).then((again) => stored || again));
  inflight = run(now, options.fetcher ?? fetchAiringUpdate, options.force ?? false).finally(() => {
    inflight = null;
  });
  return inflight;
}

async function run(now: number, fetcher: Fetcher, force: boolean): Promise<boolean> {
  try {
    const ids = await airingRefreshIds();
    const current = getAiringCache();
    const covered = new Set(current?.ids ?? []);
    const fresh = current != null && now - current.at < AIRING.staleMs && ids.every((id) => covered.has(id));
    if (!force && fresh) return false;
    const { from, to } = scheduleWindow(now);
    const entries: AiringEntry[] = [];
    for (let i = 0; i < ids.length; i += AIRING.idsPerRequest) {
      const { summaries, schedule } = await fetcher(ids.slice(i, i + AIRING.idsPerRequest), from, to);
      // A RELEASING anime that became FINISHED is updated here, then no longer monitored.
      for (const summary of summaries) await upsertAnimeSummary(summary);
      entries.push(...schedule);
    }
    setAiringCache({ at: now, ids, entries });
    return true;
  } catch {
    // AniList unreachable or rate-limited: keep what we had; the next launch tries again.
    return false;
  }
}

/** Tests only. */
export function resetAiringCache(): void {
  cache = undefined;
  inflight = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
