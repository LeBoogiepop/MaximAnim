import { SEARCH } from "@/config/app";
import { normalizeTitle } from "@/lib/search/normalize-title";

/**
 * Typo tolerance for search, kept tiny: AniList matches whole words, so one
 * typo ("Oen Piece", "Nartuo") finds nothing. We build a bounded candidate
 * set (a few variant searches + a pool of popular titles) and rank it here
 * with an optimal-string-alignment distance (Levenshtein + adjacent
 * transpositions) over every title and synonym.
 */

/** Edit distance where swapping two adjacent letters costs 1 ("oen" → "one"). */
export function osaDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) rows[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(rows[i - 1]![j]! + 1, rows[i]![j - 1]! + 1, rows[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, rows[i - 2]![j - 2]! + 1);
      rows[i]![j] = d;
    }
  }
  return rows[a.length]![b.length]!;
}

function ratio(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  return longest ? 1 - osaDistance(a, b) / longest : 1;
}

/**
 * How close a title is to what was typed, 0..1: the better of the whole
 * string and a token-by-token match (each typed word against its closest
 * title word, weighted by length; extra title words cost a little).
 */
export function titleScore(query: string, title: string): number {
  const q = normalizeTitle(query);
  const t = normalizeTitle(title);
  if (!q || !t) return 0;
  if (t === q) return 1;
  const whole = ratio(q, t);
  const qTokens = q.split(" ");
  const tTokens = t.split(" ");
  let weighted = 0;
  let total = 0;
  for (const token of qTokens) {
    const best = Math.max(...tTokens.map((w) => ratio(token, w)));
    weighted += best * token.length;
    total += token.length;
  }
  const tokens = (weighted / total) * (0.9 + 0.1 * Math.min(1, qTokens.length / tTokens.length));
  return Math.max(whole, tokens);
}

/** Best score over every title/synonym of one anime. */
export function candidateScore(query: string, titles: (string | null | undefined)[]): number {
  return Math.max(0, ...titles.filter((t): t is string => Boolean(t)).map((t) => titleScore(query, t)));
}

/**
 * The few variant searches worth sending (all in one request): each
 * distinctive word on its own, longest first ("oen piece" → "piece"), and
 * for a single long word a short prefix.
 */
export function fallbackVariants(query: string): string[] {
  const q = normalizeTitle(query);
  const tokens = q.split(" ").filter((t) => t.length >= SEARCH.fallbackMinLength);
  const variants: string[] = [];
  if (q.includes(" ")) variants.push(...[...tokens].sort((a, b) => b.length - a.length));
  else if (q.length >= SEARCH.fallbackMinLength + 2) variants.push(q.slice(0, Math.max(SEARCH.fallbackMinToken, Math.ceil(q.length * 0.6))));
  return [...new Set(variants)].filter((v) => v !== q).slice(0, SEARCH.fallbackVariants);
}
