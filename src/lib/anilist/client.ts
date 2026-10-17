import type { z } from "zod";
import { ANILIST, FRANCHISE, SEARCH } from "@/config/app";
import type { AiringEntry, Anime, AnimeFormat, AnimeSeason, AnimeStatus, AnimeSummary, FranchiseNode } from "@/types/anime";
import { normalizeAnime, normalizeFranchiseNode, normalizeSummary } from "./normalize";
import { AIRING_REFRESH_QUERY, ANIME_DETAIL_QUERY, FRANCHISE_NODES_QUERY, type SearchArgument, searchAnimeQuery, searchFallbackQuery, searchPrefixQuery } from "./queries";
import { airingRefreshResponseSchema, fallbackResponseSchema, franchiseNodesResponseSchema, graphqlEnvelopeSchema, mediaResponseSchema, searchResponseSchema } from "./schema";

export type AniListErrorKind = "offline" | "rateLimited" | "notFound" | "server" | "invalidResponse";

export class AniListError extends Error {
  constructor(
    readonly kind: AniListErrorKind,
    message: string,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "AniListError";
  }

  get retryable(): boolean {
    return this.kind === "offline" || this.kind === "rateLimited" || this.kind === "server";
  }
}

/** The caller's signal and the request's own time limit, whichever comes first. */
function withTimeout(signal?: AbortSignal): AbortSignal | undefined {
  if (typeof AbortSignal.timeout !== "function" || typeof AbortSignal.any !== "function") return signal;
  const limit = AbortSignal.timeout(ANILIST.requestTimeoutMs);
  return signal ? AbortSignal.any([signal, limit]) : limit;
}

export async function request<S extends z.ZodType>(
  query: string,
  variables: Record<string, unknown>,
  schema: S,
  signal?: AbortSignal,
): Promise<z.infer<S>> {
  let response: Response;
  try {
    response = await fetch(ANILIST.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: withTimeout(signal),
    });
  } catch (error) {
    // Aborts are not failures: let TanStack Query see them as cancellations.
    // (The time limit is a TimeoutError: that one is a failure — AniList did not answer.)
    if ((error as { name?: string } | null)?.name === "AbortError") throw error;
    throw new AniListError("offline", "AniList est injoignable.");
  }

  if (response.status === 429) {
    const header = Number(response.headers.get("Retry-After"));
    throw new AniListError(
      "rateLimited",
      "AniList limite temporairement les requêtes.",
      Number.isFinite(header) && header > 0 ? header : ANILIST.defaultRetryAfterSeconds,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new AniListError("invalidResponse", "Réponse AniList illisible.");
  }

  const envelope = graphqlEnvelopeSchema.safeParse(json);
  if (!envelope.success) throw new AniListError("invalidResponse", "Réponse AniList inattendue.");
  const firstError = envelope.data.errors?.[0];
  if (firstError?.status === 404) throw new AniListError("notFound", "Anime introuvable.");
  if (!response.ok || (firstError && !envelope.data.data)) {
    throw new AniListError(response.status >= 500 ? "server" : "invalidResponse", firstError?.message ?? `HTTP ${response.status}`);
  }

  const parsed = schema.safeParse(envelope.data.data);
  if (!parsed.success) throw new AniListError("invalidResponse", "Données AniList inattendues.");
  return parsed.data;
}

export type AniListSort = "SEARCH_MATCH" | "POPULARITY_DESC" | "SCORE_DESC" | "START_DATE_DESC" | "TRENDING_DESC";

export interface BrowseParams {
  showAdult?: boolean;
  search?: string | null;
  sort: AniListSort[];
  format?: AnimeFormat[] | null;
  status?: AnimeStatus | null;
  season?: AnimeSeason | null;
  seasonYear?: number | null;
  genre?: string | null;
}

/** A search result with the alternative titles AniList matched it on (empty for rails and filters, which do not ask). */
export interface BrowseEntry {
  anime: AnimeSummary;
  synonyms: string[];
}

/** Search and discovery (rails, filters): one query, every argument optional. */
export async function browseAnime(params: BrowseParams, signal?: AbortSignal): Promise<AnimeSummary[]> {
  return (await browseEntries(params, signal)).map((e) => e.anime);
}

/** Like `browseAnime`, keeping the synonyms of a text search's results (what the quality check of the answer needs). */
export async function browseEntries(params: BrowseParams, signal?: AbortSignal): Promise<BrowseEntry[]> {
  const optional: Record<SearchArgument, unknown> = {
    search: params.search || null,
    format: params.format?.length ? params.format : null,
    status: params.status ?? null,
    season: params.season ?? null,
    seasonYear: params.seasonYear ?? null,
    genre: params.genre ?? null,
  };
  const used = (Object.keys(optional) as SearchArgument[]).filter((k) => optional[k] != null);
  const variables: Record<string, unknown> = { perPage: SEARCH.perPage, sort: params.sort };
  for (const k of used) variables[k] = optional[k];
  const data = await request(searchAnimeQuery(used, params.showAdult), variables, searchResponseSchema, signal);
  return (data.Page?.media ?? [])
    .filter((m): m is NonNullable<typeof m> => m != null && (params.showAdult === true || m.isAdult !== true))
    .map((m) => ({ anime: normalizeSummary(m), synonyms: (m.synonyms ?? []).filter((t): t is string => typeof t === "string" && t.trim().length > 0) }));
}

export function searchAnime(search: string, signal?: AbortSignal): Promise<AnimeSummary[]> {
  return browseAnime({ search, sort: ["SEARCH_MATCH"] }, signal);
}

export interface FallbackCandidate {
  anime: AnimeSummary;
  synonyms: string[];
  popularity: number;
}

const prefixPools = new Map<string, { until: number; entries: BrowseEntry[] }>();
/** The pool is bounded to 100 real entries and 16 filter combinations. Cancelled
 * requests never populate it; filters, including adult visibility, are part of the key. */
export async function fetchPrefixCandidates(params: BrowseParams, signal?: AbortSignal): Promise<BrowseEntry[]> {
  const optional: Partial<Record<SearchArgument, unknown>> = {
    format: params.format?.length ? params.format : null, status: params.status ?? null,
    season: params.season ?? null, seasonYear: params.seasonYear ?? null, genre: params.genre ?? null,
  };
  const used = (Object.keys(optional) as SearchArgument[]).filter(k => optional[k] != null);
  const variables: Record<string, unknown> = { poolSize: SEARCH.popularPoolPageSize };
  for (const k of used) variables[k] = optional[k];
  const key = JSON.stringify([variables, params.showAdult === true]);
  signal?.throwIfAborted();
  const cached = prefixPools.get(key);
  if (cached && cached.until > Date.now()) return cached.entries;
  const data = await request(searchPrefixQuery(used, params.showAdult), variables, fallbackResponseSchema, signal);
  signal?.throwIfAborted();
  const entries = new Map<number, BrowseEntry>();
  for (const page of Object.values(data)) for (const m of page?.media ?? []) {
    if (!m || (params.showAdult !== true && m.isAdult === true)) continue;
    entries.set(m.id, { anime: normalizeSummary(m), synonyms: (m.synonyms ?? []).filter((t): t is string => Boolean(t?.trim())) });
  }
  const result = [...entries.values()];
  if (prefixPools.size >= SEARCH.prefixPoolCacheEntries) prefixPools.delete(prefixPools.keys().next().value!);
  prefixPools.set(key, { entries: result, until: Date.now() + SEARCH.popularPoolTtlMs });
  return result;
}

/**
 * Typo-fallback candidates in one request: the variant searches, and the
 * popular pool when asked (`poolPages` > 0). Deduplicated per group.
 */
export async function fetchFallbackCandidates(variants: string[], poolPages: number, signal?: AbortSignal): Promise<{ found: FallbackCandidate[]; pool: FallbackCandidate[] | null }> {
  const used = variants.slice(0, SEARCH.fallbackVariants);
  const variables: Record<string, unknown> = { perPage: SEARCH.fallbackPerVariant, poolSize: SEARCH.popularPoolPageSize };
  used.forEach((q, i) => (variables[`q${i}`] = q));
  const data = await request(searchFallbackQuery(used.length, poolPages), variables, fallbackResponseSchema, signal);
  const collect = (prefix: string) => {
    const byId = new Map<number, FallbackCandidate>();
    for (const [alias, page] of Object.entries(data)) {
      if (!alias.startsWith(prefix)) continue;
      for (const m of page?.media ?? []) {
        if (!m || byId.has(m.id)) continue;
        byId.set(m.id, {
          anime: normalizeSummary(m),
          synonyms: (m.synonyms ?? []).filter((t): t is string => typeof t === "string" && t.trim().length > 0),
          popularity: m.popularity ?? 0,
        });
      }
    }
    return [...byId.values()];
  };
  return { found: collect("v"), pool: poolPages > 0 ? collect("p") : null };
}

/**
 * Card fields of followed anime (status, next episode) and their airing
 * schedule between `from` and `to` (unix seconds), in one request.
 */
export async function fetchAiringUpdate(ids: number[], from: number, to: number, signal?: AbortSignal): Promise<{ summaries: AnimeSummary[]; schedule: AiringEntry[] }> {
  const data = await request(AIRING_REFRESH_QUERY, { ids, perPage: ids.length, from, to }, airingRefreshResponseSchema, signal);
  const summaries = (data.followed?.media ?? []).filter((m): m is NonNullable<typeof m> => m != null).map(normalizeSummary);
  const seen = new Set<string>();
  const schedule: AiringEntry[] = [];
  for (const e of [...(data.schedule?.airingSchedules ?? []), ...(data.schedule2?.airingSchedules ?? [])]) {
    if (!e || seen.has(`${e.mediaId}:${e.episode}`)) continue;
    seen.add(`${e.mediaId}:${e.episode}`);
    schedule.push({ animeId: e.mediaId, episode: e.episode, airingAt: e.airingAt });
  }
  return { summaries, schedule };
}

export async function fetchAnime(id: number, signal?: AbortSignal): Promise<Anime> {
  const data = await request(ANIME_DETAIL_QUERY, { id, staffPerPage: ANILIST.staffPerPage }, mediaResponseSchema, signal);
  if (!data.Media) throw new AniListError("notFound", "Anime introuvable.");
  return normalizeAnime(data.Media);
}

/**
 * The entries and their direct relations, in one request (up to `FRANCHISE.batchSize` ids). An id AniList does not
 * return (not an anime, removed) is simply absent from the answer.
 */
export async function fetchFranchiseNodes(ids: readonly number[], signal?: AbortSignal): Promise<FranchiseNode[]> {
  if (!ids.length) return [];
  const data = await request(FRANCHISE_NODES_QUERY, { ids: [...ids], perPage: Math.min(ids.length, FRANCHISE.batchSize) }, franchiseNodesResponseSchema, signal);
  return (data.Page?.media ?? []).filter((m): m is NonNullable<typeof m> => m != null).map(normalizeFranchiseNode);
}
