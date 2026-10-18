export const VLOGS = [
  { id: "p58g3idAiqc", title: "HOKKAIDO ROAD TRIP" },
  { id: "78l6NygYXJY", title: "KAGOSHIMA & KUMAMOTO" },
  { id: "n1shV0VoBnQ", title: "TOMOGASHIMA & SHIRAHAMA" },
] as const;
// Owner-authorized public videos; the official player decides runtime availability.
const approved: readonly (typeof VLOGS)[number][] = VLOGS;
export type DemoSession = { key: string; sessionId: string; revision: string; id: string; title: string; position: number; duration: number; updatedAt: number };
export type PlaybackIntent = { kind: "new" } | { kind: "resume" } | { kind: "session"; sessionId: string };
const STORAGE = "maximanim-portfolio:demo:v1";
const MAX = 64;
let serial = 0;
const identity = () => globalThis.crypto?.randomUUID?.() ?? `play-${Date.now()}-${++serial}`;
type StoragePort = Pick<Storage, "getItem" | "setItem">;

/** Session identity belongs to a navigation entry, never to a React render or a permanent episode assignment. */
export function createDemoLibrary(storage?: StoragePort, newId = identity) {
  let fallback: DemoSession[] | null = null;
  function rows(): DemoSession[] {
    if (fallback) return fallback;
    if (!storage) return [];
    try {
      const raw: unknown = JSON.parse(storage.getItem(STORAGE) ?? "[]");
      if (!Array.isArray(raw)) return [];
      return raw.flatMap((value: unknown): DemoSession[] => {
        if (!value || typeof value !== "object") return [];
        const row = value as Record<string, unknown>;
        const video = VLOGS.find(item => item.id === row.id);
        if (!video || typeof row.key !== "string" || typeof row.position !== "number" || !Number.isFinite(row.position) || row.position < 0 || typeof row.duration !== "number" || !Number.isFinite(row.duration) || row.duration < 0) return [];
        // Read the previous per-episode format without clearing its saved media or position.
        return [{ key: row.key, sessionId: typeof row.sessionId === "string" ? row.sessionId : `legacy:${row.key}`, revision: typeof row.revision === "string" ? row.revision : "legacy", ...video, position: row.position, duration: row.duration, updatedAt: typeof row.updatedAt === "number" && Number.isFinite(row.updatedAt) ? row.updatedAt : 0 }];
      }).slice(-MAX);
    } catch { fallback = []; return fallback; }
  }
  function persist(values: DemoSession[]) {
    fallback = values.slice(-MAX);
    try { if (storage) { storage.setItem(STORAGE, JSON.stringify(fallback)); fallback = null; } } catch { /* Keep a bounded in-memory session when storage is blocked/full. */ }
  }
  function activate(value: DemoSession) {
    persist([...rows().filter(row => row.sessionId !== value.sessionId), value]);
    return value;
  }
  function select(candidates: readonly (typeof VLOGS)[number][], random: () => number) {
    const draw = random();
    return candidates[Math.min(candidates.length - 1, Math.max(0, Math.floor((Number.isFinite(draw) ? draw : 0) * candidates.length)))]!;
  }
  function current(value: DemoSession) {
    const latest = rows().findLast(row => row.key === value.key);
    return latest?.sessionId === value.sessionId && latest.revision === value.revision && latest.id === value.id;
  }
  return {
    open(key: string, intent: PlaybackIntent, random = Math.random): DemoSession {
      const saved = rows();
      const previous = intent.kind === "new" ? undefined : intent.kind === "session" ? saved.find(row => row.key === key && row.sessionId === intent.sessionId) : saved.findLast(row => row.key === key);
      if (previous) return activate({ ...previous, revision: newId() });
      const lastId = saved.at(-1)?.id;
      // Avoid an immediate repeat whenever the catalogue offers another approved video.
      const candidates = approved.filter(video => approved.length === 1 || video.id !== lastId);
      return activate({ key, sessionId: newId(), revision: newId(), ...select(candidates, random), position: 0, duration: 0, updatedAt: Date.now() });
    },
    save(value: DemoSession): boolean {
      if (!current(value) || !Number.isFinite(value.position) || value.position < 0 || !Number.isFinite(value.duration) || value.duration < 0) return false;
      persist(rows().map(row => row.sessionId === value.sessionId ? value : row));
      return true;
    },
    replace(value: DemoSession, rejected: readonly string[], random = Math.random): DemoSession | null {
      if (!current(value)) return null;
      const candidates = VLOGS.filter(video => video.id !== value.id && !rejected.includes(video.id));
      if (!candidates.length) return null;
      return activate({ ...value, ...select(candidates, random), revision: newId(), position: 0, duration: 0, updatedAt: Date.now() });
    },
    current,
  };
}
const library = createDemoLibrary({ getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) });
export const openDemo = library.open;
export const storeDemo = library.save;
export const nextDemo = library.replace;
export const isCurrentDemo = library.current;
