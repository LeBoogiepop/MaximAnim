import { ANILIST } from "@/config/app";
import { entrySource, entrySourceWork } from "./editorial";
import { hasJapaneseScript } from "@/lib/utils/script";
import type {
  Anime,
  AnimeEntry,
  AnimeFormat,
  AnimeRelation,
  AnimeSeason,
  AnimeStatus,
  AnimeSummary,
  AnimeTitles,
  ExternalLink,
  FranchiseEdge,
  FranchiseNode,
  MediaSource,
  PartialDate,
  RelationType,
  SourceWorkRef,
  StaffCredit,
  StaffRoleGroup,
  Studio,
  TitlePreference,
} from "@/types/anime";
import type { RawMedia, RawSummary } from "./schema";

const FORMATS: readonly AnimeFormat[] = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"];
const STATUSES: readonly AnimeStatus[] = ["FINISHED", "RELEASING", "NOT_YET_RELEASED", "CANCELLED", "HIATUS"];
const SEASONS: readonly AnimeSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];
const RELATIONS: readonly RelationType[] = [
  "PREQUEL",
  "SEQUEL",
  "PARENT",
  "SIDE_STORY",
  "SPIN_OFF",
  "ALTERNATIVE",
  "SUMMARY",
  "COMPILATION",
  "OTHER",
];

const MEDIA_SOURCES: readonly MediaSource[] = [
  "ORIGINAL",
  "MANGA",
  "LIGHT_NOVEL",
  "VISUAL_NOVEL",
  "VIDEO_GAME",
  "NOVEL",
  "WEB_NOVEL",
  "DOUJINSHI",
  "ANIME",
  "LIVE_ACTION",
  "GAME",
  "COMIC",
  "MULTIMEDIA_PROJECT",
  "PICTURE_BOOK",
  "OTHER",
];

function pick<T extends string>(allowed: readonly T[], value: string | null | undefined): T | null {
  return value != null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function pickTitle(titles: AnimeTitles, preference: TitlePreference): string {
  const order: Record<TitlePreference, (keyof AnimeTitles)[]> = {
    romaji: ["romaji", "english", "native"],
    english: ["english", "romaji", "native"],
    native: ["native", "romaji", "english"],
  };
  for (const key of order[preference]) {
    const title = titles[key];
    // AniList's terminal (TV) is a catalogue disambiguator, not part of a
    // display label. Raw titles/IDs remain available for matching/adaptations.
    if (title && (preference === "native" || !hasJapaneseScript(title))) return title.replace(/\s*\(TV\)\s*$/i, "");
  }
  return "Titre inconnu";
}

/** Secondary line under the main title: the native title unless it is already the main one. */
export function secondaryTitle(titles: AnimeTitles, preference: TitlePreference): string | null {
  const main = pickTitle(titles, preference);
  if (preference === "native") return titles.romaji && titles.romaji !== main ? titles.romaji : null;
  return titles.native && titles.native !== main ? titles.native : null;
}

export function normalizeSummary(raw: RawSummary): AnimeSummary {
  const titles: AnimeTitles = {
    romaji: clean(raw.title?.romaji),
    english: clean(raw.title?.english),
    native: clean(raw.title?.native),
  };
  return {
    id: raw.id,
    ...(raw.popularity != null ? { popularity: raw.popularity } : {}),
    source: entrySource(raw.id, pick(MEDIA_SOURCES, raw.source)),
    ...(raw.isAdult != null ? { isAdult: raw.isAdult } : {}),
    titles,
    preferredTitle: pickTitle(titles, "english"),
    coverImage: {
      medium: clean(raw.coverImage?.medium),
      large: clean(raw.coverImage?.large),
      extraLarge: clean(raw.coverImage?.extraLarge),
      color: clean(raw.coverImage?.color),
    },
    format: pick(FORMATS, raw.format),
    status: pick(STATUSES, raw.status),
    season: pick(SEASONS, raw.season),
    seasonYear: raw.seasonYear ?? null,
    episodeCount: raw.episodes != null && raw.episodes > 0 ? raw.episodes : null,
    nextAiring: raw.nextAiringEpisode
      ? { episode: raw.nextAiringEpisode.episode, airingAt: raw.nextAiringEpisode.airingAt }
      : null,
  };
}

function normalizeStudios(raw: RawMedia["studios"]): Studio[] {
  const byId = new Map<number, Studio>();
  for (const edge of raw?.edges ?? []) {
    const node = edge?.node;
    if (!node) continue;
    const known = byId.get(node.id);
    // AniList may list a studio twice (MAPPA as a main and as a non-main credit of the same work): it is main if ANY edge
    // says so, whatever the order the edges came in.
    if (known) known.isMain ||= edge.isMain ?? false;
    else byId.set(node.id, { id: node.id, name: node.name, isMain: edge.isMain ?? false, isAnimationStudio: node.isAnimationStudio ?? false });
  }
  const studios = [...byId.values()];
  // The animation studio is what the viewer cares about; producers come after.
  return studios.sort(
    (a, b) =>
      Number(b.isAnimationStudio) - Number(a.isAnimationStudio) || Number(b.isMain) - Number(a.isMain),
  );
}

/** A per-episode role is a headline credit only when this few people hold it (see `RoleMatcher.crowdedOver`). */
const CROWDED_OVER = 3;

interface RoleMatcher {
  group: StaffRoleGroup;
  pattern: RegExp;
  /**
   * Roles credited episode by episode (storyboard, animation director) fill a whole page on a TV series: they are only a
   * headline credit on a short work (a film, an ONA of a few episodes) AND when at most this many people hold them;
   * otherwise they stay in « Tout le staff ». (The fetched credits are a page of the full list, so « few holders » on a
   * long series would only mean « few of them were fetched » — never read as headline.)
   */
  crowdedOver?: number;
}

const ROLE_MATCHERS: RoleMatcher[] = [
  { group: "director", pattern: /^(chief |series )?director(\s*\(.*\))?$/i },
  // Exact roles only: "Original Work Assistance" or "Original Character Design" are not these.
  { group: "original", pattern: /^original (creator|story|work)(\s*\(.*\))?$/i },
  { group: "composition", pattern: /^series composition(\s*\(.*\))?$/i },
  { group: "characterDesign", pattern: /^character design(\s*\(.*\))?$/i },
  { group: "animationDirection", pattern: /^chief animation director(\s*\(.*\))?$/i },
  { group: "animationDirection", pattern: /^animation director(\s*\(.*\))?$/i, crowdedOver: CROWDED_OVER },
  { group: "storyboard", pattern: /^storyboard(\s*\(.*\))?$/i, crowdedOver: CROWDED_OVER },
  { group: "artDirection", pattern: /^art director(\s*\(.*\))?$/i },
  { group: "soundDirection", pattern: /^sound director(\s*\(.*\))?$/i },
  { group: "music", pattern: /^music(\s*\(.*\))?$/i },
];

/** Display order of the headline credits. */
const GROUP_ORDER: StaffRoleGroup[] = ["director", "composition", "original", "characterDesign", "animationDirection", "storyboard", "artDirection", "soundDirection", "music"];
export const MAX_STAFF = 16;
const MAX_PER_GROUP = 3;

/** Credits of a dub (« Director (English) ») are not the original production's. */
const DUB_CREDIT = /\([^)]*\b(?:english|spanish|french|german|italian|portuguese|russian|korean|dub)\b[^)]*\)/i;

function matcherOf(role: string): RoleMatcher | undefined {
  const trimmed = role.trim();
  return DUB_CREDIT.test(trimmed) ? undefined : ROLE_MATCHERS.find((m) => m.pattern.test(trimmed));
}

export function roleGroup(role: string): StaffRoleGroup | null {
  return matcherOf(role)?.group ?? null;
}

/**
 * The headline credits of an anime, merged per person, strictly matched, in the order a viewer reads them: direction,
 * composition, original work, character design, animation direction, storyboard (when few), art direction, sound, music.
 * Everything else is « Tout le staff ».
 */
export function selectStaff(raw: RawMedia["staff"], shortWork = false): StaffCredit[] {
  const byPerson = new Map<number, StaffCredit>();
  const holders = new Map<string, Set<number>>();
  const staged: { id: number; group: StaffRoleGroup; matcher: RoleMatcher; role: string; node: NonNullable<NonNullable<NonNullable<RawMedia["staff"]>["edges"]>[number]>["node"] }[] = [];
  for (const edge of raw?.edges ?? []) {
    const node = edge?.node;
    const role = edge?.role?.trim();
    const matcher = role ? matcherOf(role) : undefined;
    if (!node || !matcher || (matcher.crowdedOver != null && !shortWork)) continue;
    staged.push({ id: node.id, group: matcher.group, matcher, role: role!, node });
    const key = `${matcher.group}:${matcher.crowdedOver ?? ""}`;
    (holders.get(key) ?? holders.set(key, new Set()).get(key)!).add(node.id);
  }
  const perGroup = new Map<StaffRoleGroup, Set<number>>();
  for (const { id, group, matcher, role, node } of staged) {
    if (matcher.crowdedOver != null && (holders.get(`${group}:${matcher.crowdedOver}`)?.size ?? 0) > matcher.crowdedOver) continue;
    const name = clean(node?.name?.full) ?? clean(node?.name?.native);
    if (!node || !name) continue;
    const people = perGroup.get(group) ?? perGroup.set(group, new Set()).get(group)!;
    if (!people.has(id) && people.size >= MAX_PER_GROUP) continue;
    people.add(id);
    const existing = byPerson.get(id);
    if (existing) {
      if (!existing.groups.includes(group)) existing.groups.push(group);
      if (!existing.roles!.includes(role)) existing.roles!.push(role);
      continue;
    }
    byPerson.set(id, { id, name, nativeName: clean(node.name?.native), groups: [group], image: clean(node.image?.large) ?? clean(node.image?.medium), roles: [role] });
  }
  const rank = (c: StaffCredit) => Math.min(...c.groups.map((g) => GROUP_ORDER.indexOf(g)));
  return [...byPerson.values()]
    .map((c) => ({ ...c, groups: [...c.groups].sort((a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b)) }))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, MAX_STAFF);
}

function normalizeRelations(raw: RawMedia["relations"]): AnimeRelation[] {
  const relations: AnimeRelation[] = [];
  const seen = new Set<number>();
  for (const edge of raw?.edges ?? []) {
    const node = edge?.node;
    const type = pick(RELATIONS, edge?.relationType);
    // AniList relations mix in manga and novels; the franchise is anime-only (the source work has its own field).
    if (!node || !type || node.type !== "ANIME" || seen.has(node.id)) continue;
    seen.add(node.id);
    relations.push({ type, anime: normalizeSummary(node) });
  }
  return relations;
}

const WORK_FORMATS = ["MANGA", "NOVEL", "ONE_SHOT"] as const;

/** Source works a given `source` can legitimately point at (a manga origin is not a novel, and the other way round). */
const SOURCE_WORK_FORMATS: Partial<Record<MediaSource, readonly string[]>> = {
  MANGA: ["MANGA", "ONE_SHOT"],
  COMIC: ["MANGA", "ONE_SHOT"],
  DOUJINSHI: ["MANGA", "ONE_SHOT"],
  LIGHT_NOVEL: ["NOVEL"],
  NOVEL: ["NOVEL"],
  WEB_NOVEL: ["NOVEL"],
};

/**
 * The work an anime is adapted from, ONLY as AniList's own SOURCE relation states it (never a guess from titles). One
 * SOURCE relation is the answer; several are narrowed by the kind of origin; if that still leaves more than one, or the
 * only one contradicts the stated origin (a « manga » origin pointing at a novel), nothing is claimed. A one-shot beside
 * exactly one real series is the series' pilot, not the source.
 */
export function pickSourceWork(raw: RawMedia["relations"], origin: MediaSource | null): SourceWorkRef | null {
  const candidates = (raw?.edges ?? [])
    .filter((e) => e?.relationType === "SOURCE" && e.node && e.node.type !== "ANIME")
    .map((e) => e!.node!);
  const allowed = origin ? SOURCE_WORK_FORMATS[origin] : undefined;
  const fits = (n: RawSummary) => !allowed || (n.format != null && allowed.includes(n.format));
  let narrowed = candidates.filter(fits);
  // A pilot one-shot is never the work an anime adapts: when exactly one candidate is a real series (MANGA / NOVEL), it is the one.
  if (narrowed.length > 1) {
    const series = narrowed.filter((n) => n.format !== "ONE_SHOT");
    if (series.length === 1) narrowed = series;
  }
  if (narrowed.length !== 1) return null;
  const node = narrowed[0]!;
  const titles: AnimeTitles = { romaji: clean(node.title?.romaji), english: clean(node.title?.english), native: clean(node.title?.native) };
  const format = (WORK_FORMATS as readonly (string | null | undefined)[]).includes(node.format) ? (node.format as SourceWorkRef["format"]) : null;
  return { id: node.id, format, titles, coverImage: normalizeSummary(node).coverImage };
}

export function normalizeEntry(raw: RawSummary & { startDate?: RawMedia["startDate"]; endDate?: RawMedia["startDate"] }): AnimeEntry {
  return { ...normalizeSummary(raw), startDate: normalizeDate(raw.startDate), endDate: normalizeDate(raw.endDate) };
}

/** A node of the franchise graph: the entry and its relations towards other ANIME with a known relation type. */
export function normalizeFranchiseNode(raw: RawSummary & { startDate?: RawMedia["startDate"]; endDate?: RawMedia["startDate"]; relations?: RawMedia["relations"] }): FranchiseNode {
  const edges: FranchiseEdge[] = [];
  const seen = new Set<string>();
  for (const edge of raw.relations?.edges ?? []) {
    const node = edge?.node;
    const type = pick(RELATIONS, edge?.relationType);
    if (!node || !type || node.type !== "ANIME" || node.id === raw.id || seen.has(`${type}:${node.id}`)) continue;
    seen.add(`${type}:${node.id}`);
    edges.push({ type, to: normalizeEntry(node) });
  }
  return { entry: normalizeEntry(raw), edges };
}

export function normalizeDate(raw: RawMedia["startDate"]): PartialDate | null {
  if (!raw?.year) return null;
  return { year: raw.year, month: raw.month ?? null, day: raw.month ? (raw.day ?? null) : null };
}

/** Secondary themes: AniList tags that are relevant enough and never spoilers. */
function normalizeTags(raw: RawMedia["tags"]): string[] {
  return (raw ?? [])
    .filter((t): t is NonNullable<typeof t> => t != null && !t.isMediaSpoiler && (t.rank ?? 0) >= ANILIST.tagMinRank && Boolean(clean(t.name)))
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
    .slice(0, ANILIST.maxTags)
    .map((t) => clean(t.name)!);
}

function normalizeLinks(raw: RawMedia["externalLinks"]): ExternalLink[] {
  const seen = new Set<string>();
  const links: ExternalLink[] = [];
  for (const l of raw ?? []) {
    const url = clean(l?.url);
    const site = clean(l?.site);
    if (!url || !site || !/^https:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    links.push({ site, url });
  }
  return links;
}

export function normalizeAnime(raw: RawMedia): Anime {
  const summary = normalizeSummary(raw);
  const origin = entrySource(raw.id, pick(MEDIA_SOURCES, raw.source));
  // A film or an ONA of a few episodes: its episode-by-episode credits are headline credits, a series' are not.
  const shortWork = summary.format === "MOVIE" || (summary.episodeCount != null && summary.episodeCount <= 4);
  return {
    ...summary,
    bannerImage: clean(raw.bannerImage),
    description: clean(raw.description),
    genres: (raw.genres ?? []).filter((g): g is string => typeof g === "string" && g.length > 0),
    tags: normalizeTags(raw.tags),
    synonyms: (raw.synonyms ?? []).filter((t): t is string => typeof t === "string" && t.trim().length > 0).slice(0, 12),
    studios: normalizeStudios(raw.studios),
    // Relevance order misses e.g. the composer on big productions; favourites order catches them.
    staff: selectStaff({ edges: [...(raw.staff?.edges ?? []), ...(raw.favStaff?.edges ?? [])] }, shortWork),
    relations: normalizeRelations(raw.relations),
    episodeDuration: raw.duration ?? null,
    averageScore: raw.averageScore ?? null,
    countryOfOrigin: /^[A-Z]{2}$/.test(raw.countryOfOrigin ?? "") ? raw.countryOfOrigin! : null,
    source: origin,
    startDate: normalizeDate(raw.startDate),
    endDate: normalizeDate(raw.endDate),
    sourceWork: pickSourceWork(raw.relations, origin),
    siteUrl: clean(raw.siteUrl),
    externalLinks: normalizeLinks(raw.externalLinks),
  };
}

/**
 * A detail saved by an earlier version lacks the fields added since: read it with defaults (the page then simply has
 * less to show until the next successful fetch refreshes the copy).
 */
export function hydrateAnime(saved: Partial<Anime> & Pick<Anime, "id">): Anime {
  return {
    ...(saved as Anime),
    tags: saved.tags ?? [],
    countryOfOrigin: saved.countryOfOrigin ?? null,
    source: entrySource(saved.id, saved.source ?? null),
    startDate: saved.startDate ?? null,
    endDate: saved.endDate ?? null,
    sourceWork: entrySourceWork(saved.id, saved.sourceWork ?? null),
    siteUrl: saved.siteUrl ?? null,
    externalLinks: saved.externalLinks ?? [],
    staff: saved.staff ?? [],
    studios: saved.studios ?? [],
    relations: saved.relations ?? [],
    genres: saved.genres ?? [],
    synonyms: saved.synonyms ?? [],
  };
}

/** Strips a full anime down to the summary stored in the local library. */
export function toSummary(anime: AnimeSummary): AnimeSummary {
  return {
    id: anime.id,
    isAdult: anime.isAdult,
    source: anime.source,
    titles: anime.titles,
    preferredTitle: anime.preferredTitle,
    coverImage: anime.coverImage,
    format: anime.format,
    status: anime.status,
    season: anime.season,
    seasonYear: anime.seasonYear,
    episodeCount: anime.episodeCount,
    nextAiring: anime.nextAiring,
  };
}

/**
 * Episodes that can actually be watched today. For airing shows AniList's
 * `episodes` is the planned total, while `nextAiring.episode - 1` is what exists.
 */
export function availableEpisodeCount(anime: AnimeSummary, now = Date.now()): number | null {
  if (anime.nextAiring) {
    // The stored "next" episode may already have aired since this copy was fetched.
    const aired = anime.nextAiring.airingAt * 1000 <= now;
    return Math.max(0, aired ? anime.nextAiring.episode : anime.nextAiring.episode - 1);
  }
  if (anime.status === "NOT_YET_RELEASED") return 0;
  if (anime.episodeCount == null && isSingleItem(anime) && anime.status === "FINISHED") return 1;
  return anime.episodeCount;
}

/** A film: one playable item, not an episode list. */
export function isSingleItem(anime: Pick<AnimeSummary, "format" | "episodeCount">): boolean {
  return anime.format === "MOVIE" && (anime.episodeCount == null || anime.episodeCount <= 1);
}
