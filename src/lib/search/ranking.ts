import type { AnimeSummary } from "@/types/anime";
import { candidateScore } from "./fuzzy";

export const titleSignal = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Match strength first; never use title length as a popularity proxy. */
export function searchRank(query: string, anime: AnimeSummary, aliases: readonly string[] = []): number {
  const q = titleSignal(query);
  const titles = [...Object.values(anime.titles), ...aliases].filter((t): t is string => Boolean(t));
  return Math.max(...titles.map(t => {
    const s = titleSignal(t);
    if (s === q) return 10000 + (anime.format === "TV" ? 100 : 0);
    if (s.startsWith(q)) return 1000 + (anime.format === "TV" ? 100 : 0);
    if (s.split(" ").some(word => word.startsWith(q))) return 500;
    return candidateScore(query, [t]);
  }), 0);
}

export function matchesTitlePrefix(query: string, anime: AnimeSummary, aliases: readonly string[] = []): boolean {
  const q = titleSignal(query);
  return q.length >= 2 && [...Object.values(anime.titles), ...aliases].some(t => t && titleSignal(t).split(" ").some(word => word.startsWith(q)));
}

export function rankSearch(query: string, items: readonly AnimeSummary[], aliases: ReadonlyMap<number, readonly string[]> = new Map()): AnimeSummary[] {
  return [...items].sort((a, b) => searchRank(query, b, aliases.get(b.id)) - searchRank(query, a, aliases.get(a.id)) || (b.popularity ?? 0) - (a.popularity ?? 0));
}
