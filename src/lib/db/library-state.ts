import { nextClock } from "@/lib/utils/hash";
import { db } from "./database";
import { dismissContinue, undoDismissContinue } from "./progress";
import { recordDeletion } from "./tombstones";
import type { LibraryState, LibraryStateRecord } from "./types";

/**
 * « Abandonné » and « Terminé » as the viewer's own words about a title. They are states, not lists: they never touch
 * progress, history or list membership, and « Reprendre » is simply their removal (a tombstoned delete, like every
 * synced delete). « À continuer » is not stored at all.
 */

export async function setLibraryState(animeId: number, state: LibraryState, now = Date.now()): Promise<void> {
  await db.transaction("rw", db.libraryStates, db.tombstones, async () => {
    const previous = await db.libraryStates.get(animeId);
    await db.libraryStates.put({ animeId, state, at: now, updatedAt: nextClock(previous?.updatedAt, now) });
    await db.tombstones.delete(`libraryStates|${animeId}`);
  });
}

/** « Reprendre » (or « Retirer de Terminés »): the explicit state goes away; everything else stays. */
export async function clearLibraryState(animeId: number): Promise<void> {
  await db.transaction("rw", db.libraryStates, db.tombstones, async () => {
    if (!(await db.libraryStates.get(animeId))) return;
    await db.libraryStates.delete(animeId);
    await recordDeletion("libraryStates", [animeId]);
  });
}

/**
 * « Retirer du suivi » (from Abandonnés): the explicit « abandonné » goes away AND the title is removed from À continuer
 * the way « Retirer de Continuer » does it (the existing `continueDismissal`, anchored on the latest episode at its current
 * position) — otherwise old progress would throw it straight back into À continuer. Progress, history, lists and sync
 * stay untouched: nothing is deleted. It comes back when the viewer genuinely plays again (the dismissal goes stale once
 * playback moves away from that position). Returns what « Annuler » needs.
 */
export async function removeFromTracking(animeId: number, now = Date.now()): Promise<{ previous: LibraryStateRecord | null; dismissedRecordId: string | null }> {
  const previous = (await db.libraryStates.get(animeId)) ?? null;
  await clearLibraryState(animeId);
  const dismissedRecordId = await dismissContinue(animeId, now);
  return { previous, dismissedRecordId };
}

/** « Annuler » after « Retirer du suivi »: the state is back exactly as it was, and the dismissal is lifted. */
export async function undoRemoveFromTracking(done: { previous: LibraryStateRecord | null; dismissedRecordId: string | null }): Promise<void> {
  if (done.dismissedRecordId) await undoDismissContinue(done.dismissedRecordId);
  if (done.previous) await setLibraryState(done.previous.animeId, done.previous.state, done.previous.at);
}

export function getLibraryState(animeId: number): Promise<LibraryStateRecord | undefined> {
  return db.libraryStates.get(animeId);
}
