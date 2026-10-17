export const VLOGS = [
  { id: "p58g3idAiqc", title: "HOKKAIDO ROAD TRIP" },
  { id: "78l6NygYXJY", title: "KAGOSHIMA & KUMAMOTO" },
  { id: "n1shV0VoBnQ", title: "TOMOGASHIMA & SHIRAHAMA" },
] as const;
// Owner-authorized public videos; the official player decides runtime availability.
export type DemoSession = { key: string; id: string; title: string; position: number; duration: number; updatedAt: number };
const STORAGE = "maximanim-portfolio:demo:v1";
const MAX = 64;
function sessions(): DemoSession[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE) ?? "[]");
    return Array.isArray(raw) ? raw.flatMap(value => {
      const video = VLOGS.find(item => item.id === value?.id);
      return video && typeof value.key === "string" && Number.isFinite(value.position) && value.position >= 0 && Number.isFinite(value.duration) && value.duration >= 0
        ? [{ key: value.key, ...video, position: value.position, duration: value.duration, updatedAt: Number.isFinite(value.updatedAt) ? value.updatedAt : 0 }] : [];
    }).slice(-MAX) : [];
  } catch { return []; }
}
function write(value: DemoSession) {
  try { localStorage.setItem(STORAGE, JSON.stringify([...sessions().filter(row => row.key !== value.key), value].slice(-MAX))); } catch { /* Playback works when storage is blocked. */ }
}
export function storeDemo(value: DemoSession) {
  // A rejected player's final callback cannot overwrite its replacement's identity.
  const previous = sessions().find(row => row.key === value.key);
  if (!previous || previous.id === value.id) write(value);
}
function select(key: string, candidates: readonly (typeof VLOGS)[number][], random: () => number): DemoSession | null {
  if (!candidates.length) return null;
  const selected = candidates[Math.min(candidates.length - 1, Math.max(0, Math.floor(random() * candidates.length)))]!;
  const value = { key, ...selected, position: 0, duration: 0, updatedAt: Date.now() };
  write(value); return value;
}
export function chooseDemo(key: string, random = Math.random): DemoSession {
  return sessions().find(row => row.key === key) ?? select(key, VLOGS, random)!;
}
export function nextDemo(session: DemoSession, rejected: readonly string[], random = Math.random): DemoSession | null {
  return select(session.key, VLOGS.filter(video => video.id !== session.id && !rejected.includes(video.id)), random);
}
