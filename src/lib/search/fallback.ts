import { SEARCH } from "@/config/app";
import { type FallbackCandidate, fetchFallbackCandidates } from "@/lib/anilist/client";
import type { AnimeSummary } from "@/types/anime";
import { candidateScore, fallbackVariants } from "./fuzzy";

/**
 * Bounded typo fallback. Only when the normal search found nothing useful:
 * ONE extra AniList request carrying up to three variant searches (and, at
 * most every few hours, a pool of popular titles), then local fuzzy ranking.
 */

let pool: { at: number; items: FallbackCandidate[] } | null = null;

const titlesOf = (a: AnimeSummary) => [a.titles.english, a.titles.romaji, a.titles.native];

/**
 * Normal results are "obviously poor" when none of the first ones resembles the query — by any title AniList knows for
 * them: romaji, English, native AND the synonyms it matched on. A French (or Spanish…) title lives only there, so a result
 * found through it is a good result, and no second « approximate » request is spent on it.
 */
export function isPoor(query: string, results: AnimeSummary[], synonyms: ReadonlyMap<number, readonly string[]> = new Map()): boolean {
  if (!results.length) return true;
  const best = Math.max(...results.slice(0, SEARCH.poorCheckTop).map((a) => candidateScore(query, [...titlesOf(a), ...(synonyms.get(a.id) ?? [])])));
  return best < SEARCH.poorResultScore;
}

export async function typoFallback(query: string, signal?: AbortSignal, fetcher = fetchFallbackCandidates, now = Date.now()): Promise<AnimeSummary[]> {
  const variants = fallbackVariants(query);
  const poolPages = !pool || now - pool.at > SEARCH.popularPoolTtlMs ? SEARCH.popularPoolPages : 0;
  let found: FallbackCandidate[] = [];
  if (variants.length || poolPages) {
    const result = await fetcher(variants, poolPages, signal);
    found = result.found;
    if (result.pool) pool = { at: now, items: result.pool };
  }
  const byId = new Map<number, FallbackCandidate>();
  for (const c of [...found, ...(pool?.items ?? [])]) if (!byId.has(c.anime.id)) byId.set(c.anime.id, c);
  return [...byId.values()]
    .map((c) => ({ c, score: candidateScore(query, [...titlesOf(c.anime), ...c.synonyms]) }))
    .filter((x) => x.score >= SEARCH.fallbackMinScore)
    .sort((a, b) => b.score - a.score || b.c.popularity - a.c.popularity)
    .slice(0, SEARCH.perPage)
    .map((x) => x.c.anime);
}

/** Tests only. */
export function resetFallbackPool(): void {
  pool = null;
}

