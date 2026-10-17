import { db } from "./database";
import type { SyncCollection } from "./types";

/**
 * Deletions must reach other devices, and must not be undone by an older
 * copy arriving later. Every delete of a synced record therefore leaves a
 * tombstone, written in the same transaction (callers include
 * `db.tombstones` in their transaction scope).
 */
export async function recordDeletion(collection: SyncCollection, recordIds: (string | number)[], now = Date.now()): Promise<void> {
  if (!recordIds.length) return;
  await db.tombstones.bulkPut(
    recordIds.map((recordId) => ({ id: `${collection}|${recordId}`, collection, recordId: String(recordId), deletedAt: now })),
  );
}
