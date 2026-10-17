export const VLOGS = [
  { id: "p58g3idAiqc", title: "HOKKAIDO ROAD TRIP" },
  { id: "78l6NygYXJY", title: "KAGOSHIMA & KUMAMOTO" },
  { id: "n1shV0VoBnQ", title: "TOMOGASHIMA & SHIRAHAMA" },
] as const;
// Owner requested these vlogs; public channel and official oEmbed confirmed 2026-10-17.
export type DemoSession = { key: string; id: string; title: string; position: number; duration: number; updatedAt: number; mode?: "youtube" | "html5" };
const STORAGE = "maximanim-portfolio:demo:v1";
const MAX = 64;
function sessions(): DemoSession[] { try { const raw: unknown = JSON.parse(localStorage.getItem(STORAGE) ?? "[]"); return Array.isArray(raw) ? raw.filter((v): v is DemoSession => !!v && typeof v.key === "string" && VLOGS.some(item => item.id === v.id) && Number.isFinite(v.position) && v.position >= 0 && Number.isFinite(v.duration)).slice(-MAX) : []; } catch { return []; } }
export function storeDemo(value: DemoSession) { try { const rows = sessions(); const previous = rows.find(row => row.key === value.key); localStorage.setItem(STORAGE, JSON.stringify([...rows.filter(row => row.key !== value.key), { ...value, mode: previous?.mode ?? value.mode }].slice(-MAX))); } catch { /* Playback remains usable with blocked storage. */ } }
export function setDemoMode(key: string, mode: "youtube" | "html5") { try { localStorage.setItem(STORAGE, JSON.stringify(sessions().map(row => row.key === key ? { ...row, mode } : row))); } catch {} }
export function chooseDemo(key: string, random = Math.random): DemoSession {
  const previous = sessions().find(row => row.key === key);
  if (previous) return previous;
  const selected = VLOGS[Math.min(VLOGS.length - 1, Math.max(0, Math.floor(random() * VLOGS.length)))]!;
  const value = { key, ...selected, position: 0, duration: 0, updatedAt: Date.now() };
  storeDemo(value); return value;
}
