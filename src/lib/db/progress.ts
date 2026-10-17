import { PROGRESS } from "@/config/app";
import { computeProgress, type PlaybackSample, progressId } from "@/lib/progress/logic";
import { nextClock } from "@/lib/utils/hash";
import { db } from "./database";
import { recordDeletion } from "./tombstones";
import type { HistoryRecord, ProgressRecord } from "./types";

/** Persists one playback sample and folds it into the viewing history. */
export async function savePlaybackSample(sample: PlaybackSample): Promise<ProgressRecord> {
  return db.transaction("rw", db.progress, db.history, async () => {
    const id = progressId(sample.animeId, sample.episodeNumber);
    const previous = await db.progress.get(id);
    const record = computeProgress(previous, sample);
    await db.progress.put(record);
    await recordHistory({
      animeId: sample.animeId,
      episodeNumber: sample.episodeNumber,
      providerId: sample.providerId,
      position: record.currentTime,
      duration: record.duration,
      now: sample.now,
    });
    return record;
  });
}

interface HistoryInput {
  animeId: number;
  episodeNumber: number;
  providerId: string | null;
  position: number;
  duration: number;
  now: number;
}

/** One entry per viewing session: consecutive saves of the same episode merge. */
async function recordHistory(input: HistoryInput): Promise<void> {
  const latest = await db.history.orderBy("watchedAt").last();
  if (
    latest?.id != null &&
    latest.animeId === input.animeId &&
    latest.episodeNumber === input.episodeNumber &&
    input.now - latest.watchedAt < PROGRESS.historyMergeWindowMs
  ) {
    await db.history.update(latest.id, { watchedAt: input.now, position: input.position, duration: input.duration });
    return;
  }
  const entry: HistoryRecord = {
    uid: historyUid(input.animeId, input.episodeNumber, input.now),
    animeId: input.animeId,
    episodeNumber: input.episodeNumber,
    providerId: input.providerId,
    startedAt: input.now,
    watchedAt: input.now,
    position: input.position,
    duration: input.duration,
  };
  await db.history.add(entry);
}

export function historyUid(animeId: number, episodeNumber: number, startedAt: number): string {
  return `${animeId}:${episodeNumber}:${startedAt}`;
}

/**
 * The time to write on a record created by a manual mark: `at` of an « Abandonné » title when that is earlier, so the mark
 * can never read as « watched after abandoning » (the only thing that lifts it).
 */
async function stampBeneathAbandon(animeId: number, wanted: number): Promise<number> {
  const state = await db.libraryStates.get(animeId);
  return state?.state === "abandoned" ? Math.min(wanted, state.at) : wanted;
}

/** Manual "vu / pas vu" toggle from the episode list. */
export async function setEpisodeCompleted(animeId: number, episodeNumber: number, completed: boolean): Promise<void> {
  const id = progressId(animeId, episodeNumber);
  await db.transaction("rw", db.progress, db.tombstones, db.libraryStates, async () => {
    const previous = await db.progress.get(id);
    if (!completed) {
      // An explicit "not seen" is a deletion, newer than any older "seen" copy elsewhere.
      await db.progress.delete(id);
      await recordDeletion("progress", [id]);
      return;
    }
    const now = Date.now();
    await db.progress.put({
      id,
      animeId,
      episodeNumber,
      providerId: previous?.providerId ?? null,
      providerEpisodeId: previous?.providerEpisodeId ?? null,
      currentTime: previous?.duration ?? 0,
      duration: previous?.duration ?? 0,
      percentage: 1,
      completed: true,
      // Ticking an episode off is not watching: it must not lift an « Abandonné » (only playback does).
      lastWatchedAt: await stampBeneathAbandon(animeId, now),
      updatedAt: nextClock(previous?.updatedAt, now),
    });
  });
}

export function getProgressForAnime(animeId: number): Promise<ProgressRecord[]> {
  return db.progress.where("animeId").equals(animeId).toArray();
}

/** Explicit season-scoped bulk mark, using the same clock and abandonment rules as individual marks. */
export async function markEpisodesCompleted(animeId: number, numbers: readonly number[]): Promise<void> {
  await db.transaction("rw", db.progress, db.tombstones, db.libraryStates, async () => {
    for (const number of new Set(numbers)) {
      if (Number.isFinite(number) && number > 0) await setEpisodeCompleted(animeId, number, true);
    }
  });
}

export interface EpisodeMarkUndo { id: string; before: ProgressRecord | null; clock: number }

/** Explicit previous-episode marking; preserve existing seen records and return a guarded undo. */
export async function markPreviousEpisodes(animeId: number, numbers: readonly number[]): Promise<EpisodeMarkUndo[]> {
  return db.transaction("rw", db.progress, db.tombstones, db.libraryStates, async () => {
    const undo: EpisodeMarkUndo[] = [];
    for (const number of new Set(numbers)) {
      if (!Number.isFinite(number) || number <= 0) continue;
      const id = progressId(animeId, number);
      const before = await db.progress.get(id);
      if (before?.completed) continue;
      await setEpisodeCompleted(animeId, number, true);
      const after = await db.progress.get(id);
      if (after) undo.push({ id, before: before ?? null, clock: after.updatedAt });
    }
    return undo;
  });
}

/** Never overwrite playback or a mark made after the bulk action. All reversals sync normally. */
export async function undoEpisodeMarks(undo: readonly EpisodeMarkUndo[]): Promise<void> {
  await db.transaction("rw", db.progress, db.tombstones, async () => {
    for (const entry of undo) {
      const current = await db.progress.get(entry.id);
      if (!current || current.updatedAt !== entry.clock) continue;
      if (entry.before) await db.progress.put({ ...entry.before, updatedAt: nextClock(current.updatedAt) });
      else {
        await db.progress.delete(entry.id);
        await recordDeletion("progress", [entry.id]);
      }
    }
  });
}

export function getProgress(animeId: number, episodeNumber: number): Promise<ProgressRecord | undefined> {
  return db.progress.get(progressId(animeId, episodeNumber));
}

/**
 * "Retirer de l'historique": forgets one viewing session (a test, an
 * accidental play). Episode progress is a different record and is kept —
 * this is not "mark as unwatched". The tombstone makes the removal sync.
 */
export async function removeHistoryEntry(uid: string): Promise<void> {
  await db.transaction("rw", db.history, db.tombstones, async () => {
    const ids = await db.history.where("uid").equals(uid).primaryKeys();
    if (!ids.length) return;
    await db.history.bulkDelete(ids);
    await recordDeletion("history", [uid]);
  });
}

/**
 * "Retirer de Continuer": hides the anime's current Continue item — its latest
 * episode, at its current position. Nothing else changes: the position, the
 * "vu" state, history sessions and lists stay as they are. Returns the
 * episode record dismissed (for "Annuler"), or null when there was none.
 */
export async function dismissContinue(animeId: number, now = Date.now()): Promise<string | null> {
  return db.transaction("rw", db.progress, async () => {
    const records = await db.progress.where("animeId").equals(animeId).toArray();
    const latest = records.reduce<ProgressRecord | null>((x, y) => (!x || y.lastWatchedAt > x.lastWatchedAt ? y : x), null);
    if (!latest) return null;
    await db.progress.put({ ...latest, continueDismissal: { position: latest.currentTime, at: now }, updatedAt: nextClock(latest.updatedAt, now) });
    return latest.id;
  });
}

/** "Annuler" after "Retirer de Continuer". */
export async function undoDismissContinue(progressRecordId: string): Promise<void> {
  await db.transaction("rw", db.progress, async () => {
    const record = await db.progress.get(progressRecordId);
    if (!record?.continueDismissal) return;
    await db.progress.put({ ...record, continueDismissal: null, updatedAt: nextClock(record.updatedAt) });
  });
}

/** "Effacer l'historique": every session goes (tombstoned); progress and lists are kept. */
export async function clearHistory(): Promise<void> {
  await db.transaction("rw", db.history, db.tombstones, async () => {
    const uids = (await db.history.toArray()).map((h) => h.uid);
    await db.history.clear();
    await recordDeletion("history", uids);
  });
}

/**
 * « Réinitialiser le visionnage »: the title behaves as if it had never been watched. Every episode record (seen marks,
 * resume positions, Continuer dismissals), every viewing session and the « Abandonné » / « Terminé » word go — each with
 * its tombstone, in the one transaction, so the reset syncs and an older copy cannot bring anything back. What the viewer
 * built by hand stays: list membership, the source choice and « Suivre les sorties » are not viewing.
 * Returns how many episode records went (0 = there was nothing to forget).
 */
export async function resetViewing(animeId: number, now = Date.now()): Promise<number> {
  return db.transaction("rw", db.progress, db.history, db.libraryStates, db.tombstones, async () => {
    const progressIds = (await db.progress.where("animeId").equals(animeId).primaryKeys()) as string[];
    await db.progress.bulkDelete(progressIds);
    await recordDeletion("progress", progressIds, now);
    const sessions = await db.history.where("animeId").equals(animeId).toArray();
    await db.history.bulkDelete(sessions.map((h) => h.id!));
    await recordDeletion("history", sessions.map((h) => h.uid), now);
    if (await db.libraryStates.get(animeId)) {
      await db.libraryStates.delete(animeId);
      await recordDeletion("libraryStates", [animeId], now);
    }
    return progressIds.length;
  });
}

/**
 * Bulk "vu / pas vu" for long series (e.g. 1 180 episodes): one transaction,
 * one bulkGet + one bulkPut (or bulkDelete + tombstones). This is progress
 * state, not viewing activity: no history session is created. Episodes the
 * provider adds later have no record, so they stay unseen.
 */
export async function setEpisodesCompleted(animeId: number, episodeNumbers: number[], completed: boolean): Promise<number> {
  if (!episodeNumbers.length) return 0;
  const ids = episodeNumbers.map((n) => progressId(animeId, n));
  const now = Date.now();
  return db.transaction("rw", db.progress, db.tombstones, db.libraryStates, async () => {
    // One indexed read for the whole anime rather than one request per episode: on a
    // 1 000+ episode series that halves the IndexedDB round-trips of the bulk write.
    const byId = new Map((await db.progress.where("animeId").equals(animeId).toArray()).map((r) => [r.id, r]));
    const existing = ids.map((id) => byId.get(id));
    if (!completed) {
      const present = ids.filter((_id, i) => existing[i] != null);
      await db.progress.bulkDelete(present);
      await recordDeletion("progress", present, now);
      return present.length;
    }
    const beneath = await stampBeneathAbandon(animeId, now - 1);
    const records: ProgressRecord[] = [];
    episodeNumbers.forEach((episodeNumber, i) => {
      const previous = existing[i];
      if (previous?.completed) return;
      records.push({
        id: ids[i]!,
        animeId,
        episodeNumber,
        providerId: previous?.providerId ?? null,
        providerEpisodeId: previous?.providerEpisodeId ?? null,
        currentTime: previous?.duration ?? 0,
        duration: previous?.duration ?? 0,
        percentage: 1,
        completed: true,
        // Older than any real viewing: a bulk mark must not become "the last episode watched".
        lastWatchedAt: previous?.lastWatchedAt ?? beneath,
        updatedAt: nextClock(previous?.updatedAt, now),
      });
    });
    await db.progress.bulkPut(records);
    return records.length;
  });
}
