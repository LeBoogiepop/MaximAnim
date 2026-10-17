/** Unicode folding for catalogue search; no playback catalogue matching. */
export function normalizeTitle(title: string): string { return title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’'`´]/g, "").replace(/&/g, " and ").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " "); }
