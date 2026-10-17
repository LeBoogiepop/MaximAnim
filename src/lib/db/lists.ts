import { LISTS } from "@/config/app";
import { uid } from "@/lib/utils/id";
import type { AnimeSummary } from "@/types/anime";
import { nextClock } from "@/lib/utils/hash";
import { db } from "./database";
import { upsertAnimeSummary } from "./library";
import { recordDeletion } from "./tombstones";
import type { ListRecord } from "./types";

export class ListValidationError extends Error {}

export function normalizeListName(name: string): string {
  const trimmed = name.replace(/\s+/g, " ").trim();
  if (!trimmed) throw new ListValidationError("Donne un nom à la liste.");
  if ([...trimmed].length > LISTS.maxNameLength) throw new ListValidationError(`${LISTS.maxNameLength} caractères maximum.`);
  return trimmed;
}

/** One visible symbol (an emoji may be several code points: flags, ZWJ sequences). */
export function normalizeEmoji(emoji: string): string {
  const trimmed = emoji.trim();
  if (!trimmed) throw new ListValidationError("Choisis un emoji.");
  const Segmenter = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  const first = Segmenter ? [...new Segmenter(undefined, { granularity: "grapheme" }).segment(trimmed)][0]?.segment : [...trimmed][0];
  return first ?? trimmed;
}

export function getListsOrdered(): Promise<ListRecord[]> {
  return db.lists.orderBy("order").toArray();
}

export async function createList(name: string, emoji: string): Promise<ListRecord> {
  const cleanName = normalizeListName(name);
  const cleanEmoji = normalizeEmoji(emoji);
  return db.transaction("rw", db.lists, async () => {
    const last = await db.lists.orderBy("order").last();
    const now = Date.now();
    const list: ListRecord = {
      id: uid(),
      name: cleanName,
      emoji: cleanEmoji,
      order: (last?.order ?? -1) + 1,
      entries: [],
      createdAt: now,
      updatedAt: now,
    };
    await db.lists.add(list);
    return list;
  });
}

export async function updateList(id: string, patch: { name?: string; emoji?: string }): Promise<void> {
  const changes: Partial<ListRecord> = {};
  if (patch.name !== undefined) changes.name = normalizeListName(patch.name);
  if (patch.emoji !== undefined) changes.emoji = normalizeEmoji(patch.emoji);
  await db.transaction("rw", db.lists, async () => {
    const list = await db.lists.get(id);
    if (list) await db.lists.update(id, { ...changes, updatedAt: nextClock(list.updatedAt) });
  });
}

export async function deleteList(id: string): Promise<void> {
  await db.transaction("rw", db.lists, db.tombstones, async () => {
    await db.lists.delete(id);
    await recordDeletion("lists", [id]);
  });
}

/** Moves a list one step up or down, rewriting orders densely. */
export async function moveList(id: string, direction: -1 | 1): Promise<void> {
  await db.transaction("rw", db.lists, async () => {
    const lists = await db.lists.orderBy("order").toArray();
    const index = lists.findIndex((l) => l.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= lists.length) return;
    const reordered = [...lists];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved!);
    await db.lists.bulkPut(reordered.map((l, order) => (l.order === order ? l : { ...l, order, updatedAt: nextClock(l.updatedAt) })));
  });
}

export async function addAnimeToList(listId: string, anime: AnimeSummary): Promise<void> {
  await upsertAnimeSummary(anime);
  await db.transaction("rw", db.lists, async () => {
    const list = await db.lists.get(listId);
    if (!list || list.entries.some((e) => e.animeId === anime.id)) return;
    const now = Date.now();
    await db.lists.update(listId, { entries: [...list.entries, { animeId: anime.id, addedAt: now }], updatedAt: nextClock(list.updatedAt, now) });
  });
}

export async function removeAnimeFromList(listId: string, animeId: number): Promise<void> {
  await db.transaction("rw", db.lists, async () => {
    const list = await db.lists.get(listId);
    if (!list) return;
    await db.lists.update(listId, { entries: list.entries.filter((e) => e.animeId !== animeId), updatedAt: nextClock(list.updatedAt) });
  });
}

export async function moveAnimeInList(listId: string, animeId: number, direction: -1 | 1): Promise<void> {
  await db.transaction("rw", db.lists, async () => {
    const list = await db.lists.get(listId);
    if (!list) return;
    const index = list.entries.findIndex((e) => e.animeId === animeId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.entries.length) return;
    const entries = [...list.entries];
    const [moved] = entries.splice(index, 1);
    entries.splice(target, 0, moved!);
    await db.lists.update(listId, { entries, updatedAt: nextClock(list.updatedAt) });
  });
}
