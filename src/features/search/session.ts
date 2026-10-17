import { parseSearchUrl, searchUrlQuery } from "./url-state";
import { SEARCH } from "@/config/app";

const KEY = "maxime-anime:search-session:v1";
const HISTORY_KEY = "maxime-anime:search-history:v1";
const ENTRY_KEY = "maximanimSearchEntry";
type Snapshot = { query: string; y: number };

function snapshot(value: Partial<Snapshot> | null): Snapshot {
  return { query: searchUrlQuery(parseSearchUrl(typeof value?.query === "string" ? value.query : "")), y: typeof value?.y === "number" && Number.isFinite(value.y) ? Math.max(0, value.y) : 0 };
}
function entryIds(): string[] {
  try {
    const data: unknown = JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(data) ? data.filter((id): id is string => typeof id === "string").slice(-SEARCH.historyEntries) : [];
  } catch { return []; }
}
/** Application-owned identity; never copy or interpret Next's private history markers. */
export function searchEntryId(): string | null {
  const id: unknown = window.history.state?.[ENTRY_KEY];
  return typeof id === "string" ? id : null;
}
export function readSearchEntry(id: string | null): Snapshot | null {
  try {
    const value = id ? sessionStorage.getItem(`${HISTORY_KEY}:${id}`) : null;
    return value ? snapshot(JSON.parse(value)) : null;
  } catch { return null; }
}
export function replaceSearchUrl(id: string, query: string): void {
  // Next's public native-History integration preserves its own routing state.
  // The existing navigation tracker preserves the app's depth/origin fields.
  window.history.replaceState({ [ENTRY_KEY]: id }, "", `/search${query}`);
}
export function readSearchSession(): { query: string; y: number } {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    return snapshot(value);
  } catch { return { query: "", y: 0 }; }
}
export function saveSearchSession(query: string, y: number, id?: string) {
  try {
    const saved = snapshot({ query, y });
    sessionStorage.setItem(KEY, JSON.stringify(saved));
    if (id) {
      const key = `${HISTORY_KEY}:${id}`;
      // A scroll writes just two small snapshots, never the whole history map.
      if (sessionStorage.getItem(key) == null) {
        const ids = [...entryIds().filter(value => value !== id), id];
        for (const expired of ids.slice(0, -SEARCH.historyEntries)) sessionStorage.removeItem(`${HISTORY_KEY}:${expired}`);
        sessionStorage.setItem(HISTORY_KEY, JSON.stringify(ids.slice(-SEARCH.historyEntries)));
      }
      sessionStorage.setItem(key, JSON.stringify(saved));
    }
  } catch { /* Private storage is optional. */ }
}
