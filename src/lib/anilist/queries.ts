/**
 * GraphQL documents. Search asks for the minimal card shape only: staff,
 * studios and relations are fetched by the detail page that displays them.
 */
import { SEARCH } from "@/config/app";

export const SUMMARY_FIELDS = /* GraphQL */ `
  id
  type
  isAdult
  source(version: 3)
  title { romaji english native }
  coverImage { medium large extraLarge color }
  format
  status
  season
  seasonYear
  episodes
  nextAiringEpisode { episode airingAt }
`;

/** Optional search/filter arguments: name → GraphQL type and the `media(...)` argument it feeds. */
export const SEARCH_ARGUMENTS = {
  search: { type: "String", arg: "search" },
  format: { type: "[MediaFormat]", arg: "format_in" },
  status: { type: "MediaStatus", arg: "status" },
  season: { type: "MediaSeason", arg: "season" },
  seasonYear: { type: "Int", arg: "seasonYear" },
  genre: { type: "String", arg: "genre" },
} as const;

export type SearchArgument = keyof typeof SEARCH_ARGUMENTS;

/**
 * Search, discovery rails and filters share one document shape, built with
 * only the arguments in use: AniList does NOT treat a null variable as
 * absent (`format_in: null` fails, `status: null` matches nothing).
 */
export function searchAnimeQuery(used: readonly SearchArgument[], showAdult = false): string {
  const vars = ["$perPage: Int!", "$sort: [MediaSort]", ...used.map((k) => `$${k}: ${SEARCH_ARGUMENTS[k].type}`)].join(", ");
  const args = ["type: ANIME", "sort: $sort", ...(!showAdult ? ["isAdult: false"] : []), ...used.map((k) => `${SEARCH_ARGUMENTS[k].arg}: $${k}`)].join(", ");
  // AniList matches a text search against titles AND synonyms (that is where a French title lives: AniList has no French title field), so
  // the synonyms of what it returns are asked for too: judging the answer without them calls a good answer « poor ».
  const synonyms = used.includes("search") ? "synonyms popularity" : "";
  return /* GraphQL */ `
  query SearchAnime(${vars}) {
    Page(page: 1, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(${args}) {
        ${SUMMARY_FIELDS}
        ${synonyms}
      }
    }
  }
`;
}

/**
 * Typo fallback: a few variant searches and, when not cached yet, a pool of
 * popular titles — all in ONE request (aliases), with the synonyms needed to
 * rank candidates locally. `count` is 0..3 variants, `poolPages` 0..2.
 */
export function searchFallbackQuery(count: number, poolPages: number): string {
  const fields = `${SUMMARY_FIELDS} synonyms popularity`;
  // GraphQL rejects declared-but-unused variables: declare only what this shape uses.
  const vars = [...Array.from({ length: count }, (_, i) => `$q${i}: String!`), count ? "$perPage: Int!" : null, poolPages ? "$poolSize: Int!" : null].filter(Boolean).join(", ");
  const variants = Array.from({ length: count }, (_, i) => `v${i}: Page(page: 1, perPage: $perPage) { media(search: $q${i}, type: ANIME, sort: [SEARCH_MATCH], isAdult: false) { ${fields} } }`);
  const pool = Array.from({ length: poolPages }, (_, i) => `p${i}: Page(page: ${i + 1}, perPage: $poolSize) { media(type: ANIME, sort: [POPULARITY_DESC], isAdult: false) { ${fields} } }`);
  return /* GraphQL */ `
  query SearchFallback(${vars}) {
    ${[...variants, ...pool].join("\n    ")}
  }
`;
}

/** Two popular pages, filtered by AniList, for short title prefixes which its
 * whole-word search does not return. No guessed expansion of the query. */
export function searchPrefixQuery(used: readonly SearchArgument[], showAdult = false): string {
  const vars = ["$poolSize: Int!", ...used.map(k => `$${k}: ${SEARCH_ARGUMENTS[k].type}`)].join(", ");
  const args = ["type: ANIME", "sort: [POPULARITY_DESC]", ...(!showAdult ? ["isAdult: false"] : []), ...used.map(k => `${SEARCH_ARGUMENTS[k].arg}: $${k}`)].join(", ");
  return `query SearchPrefix(${vars}) { ${Array.from({ length: SEARCH.popularPoolPages }, (_, i) => `p${i}: Page(page: ${i + 1}, perPage: $poolSize) { media(${args}) { ${SUMMARY_FIELDS} synonyms popularity } }`).join(" ")} }`;
}

/**
 * Lightweight airing refresh for followed anime: their card fields (status,
 * next episode) and the airing schedule of a time window — one request per
 * batch of ids. Two schedule pages (AniList caps a page at 50).
 */
export const AIRING_REFRESH_QUERY = /* GraphQL */ `
  query AiringRefresh($ids: [Int], $perPage: Int!, $from: Int!, $to: Int!) {
    followed: Page(page: 1, perPage: $perPage) {
      media(id_in: $ids, type: ANIME) {
        ${SUMMARY_FIELDS}
      }
    }
    schedule: Page(page: 1, perPage: 50) {
      airingSchedules(mediaId_in: $ids, airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) { mediaId episode airingAt }
    }
    schedule2: Page(page: 2, perPage: 50) {
      airingSchedules(mediaId_in: $ids, airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) { mediaId episode airingAt }
    }
  }
`;

/** A card with its start date: what the franchise graph orders and labels entries with. */
export const ENTRY_FIELDS = /* GraphQL */ `
  ${SUMMARY_FIELDS}
  startDate { year month day }
  endDate { year month day }
`;

/**
 * The relations of up to 50 entries in ONE request (the walk of a franchise level). Every edge target carries its card,
 * so entries beyond the walked chain (films, side stories) are labelled without being fetched.
 */
export const FRANCHISE_NODES_QUERY = /* GraphQL */ `
  query FranchiseNodes($ids: [Int], $perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(id_in: $ids, type: ANIME) {
        ${ENTRY_FIELDS}
        relations {
          edges {
            relationType(version: 2)
            node { ${ENTRY_FIELDS} }
          }
        }
      }
    }
  }
`;

export const ANIME_DETAIL_QUERY = /* GraphQL */ `
  query AnimeDetail($id: Int!, $staffPerPage: Int!) {
    Media(id: $id, type: ANIME) {
      ${SUMMARY_FIELDS}
      bannerImage
      description(asHtml: false)
      genres
      tags { name rank isMediaSpoiler }
      synonyms
      duration
      averageScore
      countryOfOrigin
      source(version: 3)
      startDate { year month day }
      endDate { year month day }
      siteUrl
      externalLinks { url site }
      studios {
        edges {
          isMain
          node { id name isAnimationStudio }
        }
      }
      staff(perPage: $staffPerPage, sort: [RELEVANCE, ID]) {
        edges {
          role
          node {
            id
            name { full native }
            image { medium large }
          }
        }
      }
      favStaff: staff(perPage: 25, sort: [FAVOURITES_DESC]) {
        edges {
          role
          node {
            id
            name { full native }
            image { medium large }
          }
        }
      }
      relations {
        edges {
          relationType(version: 2)
          node { ${SUMMARY_FIELDS} }
        }
      }
    }
  }
`;
