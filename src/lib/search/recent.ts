import { SEARCH } from "@/config/app";
import type { AnimeSummary, AnimeTitles } from "@/types/anime";

/**
 * « Récents » on an empty Search (RC9.2): the anime the viewer lately OPENED — a cover and a title, not a string they once typed.
 * Kept on this device only (localStorage; never synced, never in a backup, never sent anywhere). Most recent first, one entry per
 * anime (opening one again moves it to the top), a handful. The preferred title is chosen when it is shown, from the three
 * titles stored here, so the title-language preference applies to it like everywhere else.
 */

export interface RecentAnime {
  id: number;
  titles: AnimeTitles;
  cover: AnimeSummary["coverImage"];
  /** When it was opened (ms). */
  at: number;
}

const KEY = "maxime-anime:recent-opened";
/** RC9.1 remembered query strings here: the key is dropped, never read again. */
const OLD_QUERIES_KEY = "maxime-anime:recent-searches";

/** The list after opening `anime` (pure): on top, de-duplicated by id, bounded. */
export function addOpened(list: readonly RecentAnime[], anime: Pick<AnimeSummary, "id" | "titles" | "coverImage">, now: number, max: number = SEARCH.recentOpenedMax): RecentAnime[] {
  const entry: RecentAnime = { id: anime.id, titles: anime.titles, cover: anime.coverImage, at: now };
  return [entry, ...list.filter((r) => r.id !== anime.id)].slice(0, max);
}

const text = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

/** One stored value, read back defensively: anything unusable is dropped, never thrown. */
function parse(raw: unknown): RecentAnime | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const titles = (r.titles ?? {}) as Record<string, unknown>;
  const cover = (r.cover ?? {}) as Record<string, unknown>;
  const id = r.id;
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) return null;
  const parsedTitles = { romaji: text(titles.romaji), english: text(titles.english), native: text(titles.native) };
  if (!parsedTitles.romaji && !parsedTitles.english && !parsedTitles.native) return null;
  return {
    id,
    titles: parsedTitles,
    cover: { medium: text(cover.medium), large: text(cover.large), extraLarge: text(cover.extraLarge), color: text(cover.color) },
    at: typeof r.at === "number" && Number.isFinite(r.at) ? r.at : 0,
  };
}

export function readOpened(): RecentAnime[] {
  try {
    localStorage.removeItem(OLD_QUERIES_KEY);
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    const seen = new Set<number>();
    return raw
      .map(parse)
      .filter((r): r is RecentAnime => r != null && !seen.has(r.id) && (seen.add(r.id), true))
      .slice(0, SEARCH.recentOpenedMax);
  } catch {
    return [];
  }
}

/** Remembers that `anime` was opened; returns the new list. */
export function pushOpened(anime: Pick<AnimeSummary, "id" | "titles" | "coverImage">, now = Date.now()): RecentAnime[] {
  const next = addOpened(readOpened(), anime, now);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode / blocked storage: recents simply do not persist.
  }
  return next;
}

/** Forgets one opened anime (the cross in the quick search's « Récents »); returns the new list. */
export function removeOpened(id: number): RecentAnime[] {
  const next = readOpened().filter((r) => r.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode / blocked storage: nothing was persisted, nothing to forget.
  }
  return next;
}

export function clearOpened(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
