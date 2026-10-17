"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useLayoutEffect, useMemo, useState, useSyncExternalStore } from "react";
import { HISTORY, HOME } from "@/config/app";
import { type AiringCache, followedAiringAnime, getAiringCache, subscribeAiring } from "@/lib/airing/refresh";
import { type UpcomingRelease, upcomingReleases } from "@/lib/airing/schedule";
import { db } from "@/lib/db/database";
import { getAnimeMap } from "@/lib/db/library";
import { getListsOrdered } from "@/lib/db/lists";
import type { AnimeRecord, HistoryRecord, LibraryStateRecord, ListRecord, ProgressRecord } from "@/lib/db/types";
import { abandonedNow, buildViews, type LibraryEntry, type SmartView } from "@/lib/library/views";
import { buildContinueWatching, buildUpNext, type ContinueItem, type UpNextItem } from "@/lib/progress/logic";

/**
 * Reactive reads over IndexedDB. `undefined` means "still loading" — callers
 * render skeletons for it, never an empty state.
 */

export function useLists(): ListRecord[] | undefined {
  return useLiveQuery(getListsOrdered, []);
}

export function useList(id: string): ListRecord | null | undefined {
  return useLiveQuery(async () => (await db.lists.get(id)) ?? null, [id]);
}

export function useAnimeRecords(ids: number[] | undefined): Map<number, AnimeRecord> | undefined {
  const key = ids?.join(",") ?? "";
  return useLiveQuery(async () => (ids ? getAnimeMap(ids) : new Map<number, AnimeRecord>()), [key]);
}

/**
 * The last progress read for each anime of this visit. Only the anime page's display opts in (`seed`): a page rebuilt on Back paints its
 * play action and watched markers at once instead of a skeleton. Playback and anything that DECIDES from progress (resume, completion)
 * never reads it: they wait for the live read, exactly as before.
 */
const progressMemory = new Map<number, ProgressRecord[]>();
const PROGRESS_MEMORY_MAX = 64;

export function useAnimeProgress(animeId: number, options: { seed?: boolean } = {}): ProgressRecord[] | undefined {
  const live = useLiveQuery(async () => {
    const rows = await db.progress.where("animeId").equals(animeId).toArray();
    progressMemory.delete(animeId);
    progressMemory.set(animeId, rows);
    if (progressMemory.size > PROGRESS_MEMORY_MAX) progressMemory.delete(progressMemory.keys().next().value!);
    return rows;
  }, [animeId]);
  // The live read replaces it within a frame or two and stays the truth; this only covers the first paint.
  return live ?? (options.seed ? progressMemory.get(animeId) : undefined);
}

export interface ProgressByAnime {
  [animeId: number]: ProgressRecord[];
}

/** All progress grouped per anime, for list cards. */
export function useProgressIndex(animeIds: number[] | undefined): ProgressByAnime | undefined {
  const key = animeIds?.join(",") ?? "";
  return useLiveQuery(async () => {
    if (!animeIds?.length) return {};
    const records = await db.progress.where("animeId").anyOf(animeIds).toArray();
    const index: ProgressByAnime = {};
    for (const r of records) (index[r.animeId] ??= []).push(r);
    return index;
  }, [key]);
}

/** Catalogue viewing markers: one bounded reactive read per list, no per-row queries or writes. */
export function useViewingIndex(animeIds: number[]) {
  const key = animeIds.join(",");
  return useLiveQuery(async () => {
    const progress: ProgressByAnime = {};
    const states: Record<number, LibraryStateRecord> = {};
    if (animeIds.length) {
      for (const record of await db.progress.where("animeId").anyOf(animeIds).toArray()) (progress[record.animeId] ??= []).push(record);
      for (const state of await db.libraryStates.where("animeId").anyOf(animeIds).toArray()) states[state.animeId] = state;
    }
    return { progress, states };
  }, [key]);
}

/** The device-local airing schedule of followed anime (null until first fetched). */
export function useAiringCache(): AiringCache | null {
  return useSyncExternalStore(subscribeAiring, getAiringCache, () => null);
}

function useVisitClock(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useLayoutEffect(() => {
    // Retained route entry synchronizes the external wall clock, without polling.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (active) setNow(Date.now());
  }, [active]);
  return now;
}

export function useHomeFeeds(active = true): { continueItems: ContinueItem[]; upNext: UpNextItem[] } | undefined {
  const airing = useAiringCache();
  const now = useVisitClock(active);
  const local = useLiveQuery(async () => {
    const all = await db.progress.toArray();
    // A title the viewer abandoned is not « Continuer » nor « À suivre » (watching it again brings it back).
    const states = new Map((await db.libraryStates.toArray()).map((s) => [s.animeId, s]));
    const byAnime = new Map<number, ProgressRecord[]>();
    for (const p of all) byAnime.set(p.animeId, [...(byAnime.get(p.animeId) ?? []), p]);
    const progress = all.filter((p) => !abandonedNow(states.get(p.animeId), byAnime.get(p.animeId)!));
    const anime = await getAnimeMap([...new Set(progress.map((p) => p.animeId))]);
    return { progress, anime, readAt: Date.now() };
  }, []);
  // A schedule refresh must not restart the DB observer and erase Continuer.
  return useMemo(() => local ? {
    continueItems: buildContinueWatching(local.progress, local.anime, HOME.maxContinue),
    upNext: buildUpNext(local.progress, local.anime, HOME.maxUpNext, Math.max(now, local.readAt, airing?.at ?? 0), airing?.entries ?? []),
  } : undefined, [local, airing, now]);
}

/** Explicitly followed anime ("Suivre les sorties") that can still gain episodes, keyed by id. */
export function useFollowedAiring(): Map<number, AnimeRecord> | undefined {
  return useLiveQuery(async () => new Map((await followedAiringAnime()).map((r) => [r.id, r])), []);
}

/**
 * The next releases of the anime the viewer explicitly follows, from AniList's schedule in the device cache (never invented).
 * `undefined` while the follows load; an empty list when nothing is followed or nothing is announced.
 */
export function useUpcomingReleases(limit: number, active = true): { items: (UpcomingRelease & { record: AnimeRecord })[]; followed: number } | undefined {
  const followed = useFollowedAiring();
  const airing = useAiringCache();
  // Read once per visit of the screen (the Home does not tick): a release that passes while it is open is gone on the next one.
  const now = useVisitClock(active);
  return useMemo(() => {
    if (!followed) return undefined;
    const upcoming = airing ? upcomingReleases(airing.entries, { now, ids: new Set(followed.keys()), limit }) : [];
    return { followed: followed.size, items: upcoming.flatMap((u) => (followed.get(u.animeId) ? [{ ...u, record: followed.get(u.animeId)! }] : [])) };
  }, [followed, airing, limit, now]);
}

/** Every explicit follow with its local anime reference (finished ones included, so they can be unfollowed). */
export function useAiringFollows(): { animeId: number; followedAt: number; anime: AnimeRecord | undefined }[] | undefined {
  return useLiveQuery(async () => {
    const follows = await db.airingFollows.orderBy("updatedAt").reverse().toArray();
    const anime = await getAnimeMap(follows.map((f) => f.animeId));
    return follows.map((f) => ({ animeId: f.animeId, followedAt: f.followedAt, anime: anime.get(f.animeId) }));
  }, []);
}

export function useIsFollowingAiring(animeId: number): boolean | undefined {
  return useLiveQuery(async () => (await db.airingFollows.get(animeId)) != null, [animeId]);
}

export interface HistoryItem {
  entry: HistoryRecord;
  anime: AnimeRecord | undefined;
}

/** The titles currently « Abandonné » (the word stands until something is watched again). */
async function abandonedIds(): Promise<Set<number>> {
  const states = (await db.libraryStates.toArray()).filter((s) => s.state === "abandoned");
  const ids = new Set<number>();
  for (const state of states) {
    const progress = await db.progress.where("animeId").equals(state.animeId).toArray();
    if (abandonedNow(state, progress)) ids.add(state.animeId);
  }
  return ids;
}

export function useHistory(): HistoryItem[] | undefined {
  return useLiveQuery(async () => {
    const all = await db.history.orderBy("watchedAt").reverse().limit(HISTORY.pageSize).toArray();
    // An abandoned title leaves the history surface (its sessions and positions stay stored: « Reprendre » brings it back).
    const abandoned = await abandonedIds();
    const entries = all.filter((e) => !abandoned.has(e.animeId));
    const anime = await getAnimeMap([...new Set(entries.map((e) => e.animeId))]);
    return entries.map((entry) => ({ entry, anime: anime.get(entry.animeId) }));
  }, []);
}

/** The explicit state of one title (« Abandonné » / « Terminé »), undefined while loading, null when there is none. */
export function useLibraryState(animeId: number): LibraryStateRecord | null | undefined {
  return useLiveQuery(async () => (await db.libraryStates.get(animeId)) ?? null, [animeId]);
}

/** Every title the viewer has acted on (progress or an explicit state), with what the smart views need. */
export function useLibraryEntries(): LibraryEntry[] | undefined {
  return useLiveQuery(async () => {
    const [progress, states] = await Promise.all([db.progress.toArray(), db.libraryStates.toArray()]);
    const byAnime = new Map<number, ProgressRecord[]>();
    for (const p of progress) byAnime.set(p.animeId, [...(byAnime.get(p.animeId) ?? []), p]);
    const ids = [...new Set([...byAnime.keys(), ...states.map((s) => s.animeId)])];
    const anime = await getAnimeMap(ids);
    const stateById = new Map(states.map((s) => [s.animeId, s]));
    return ids.flatMap((id) => {
      const record = anime.get(id);
      // A state or progress synced before its card arrived has nothing to render yet.
      return record ? [{ anime: record, progress: byAnime.get(id) ?? [], state: stateById.get(id) }] : [];
    });
  }, []);
}

/** The three smart views, derived (never stored): À continuer, Terminés, Abandonnés. */
export function useSmartViews(): Record<SmartView, LibraryEntry[]> | undefined {
  const entries = useLibraryEntries();
  return useMemo(() => (entries ? buildViews(entries) : undefined), [entries]);
}

