/**
 * Domain model for anime metadata. AniList response shapes are normalized into
 * these types in `lib/anilist/normalize.ts` and never leak further into the UI.
 */

export type TitlePreference = "romaji" | "english" | "native";

export interface AnimeTitles {
  romaji: string | null;
  english: string | null;
  native: string | null;
}

export type AnimeFormat =
  | "TV"
  | "TV_SHORT"
  | "MOVIE"
  | "SPECIAL"
  | "OVA"
  | "ONA"
  | "MUSIC";

export type AnimeStatus =
  | "FINISHED"
  | "RELEASING"
  | "NOT_YET_RELEASED"
  | "CANCELLED"
  | "HIATUS";

export type AnimeSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";

export interface CoverImage {
  medium: string | null;
  large: string | null;
  extraLarge: string | null;
  /** Dominant colour provided by AniList, e.g. "#e4a15d". */
  color: string | null;
}

export interface NextAiring {
  episode: number;
  /** Unix seconds. */
  airingAt: number;
}

/** The light shape used by search results, cards, relations and the local library. */
export interface AnimeSummary {
  id: number;
  /** Optional catalogue popularity, used only within equally strong search matches. */
  popularity?: number;
  /** Verified explicit-content classification; absent in legacy cached metadata. */
  isAdult?: boolean;
  source?: MediaSource | null;
  titles: AnimeTitles;
  /** Title picked with the default preference; UI re-picks with the user's preference. */
  preferredTitle: string;
  coverImage: CoverImage;
  format: AnimeFormat | null;
  status: AnimeStatus | null;
  season: AnimeSeason | null;
  seasonYear: number | null;
  /** Total planned episodes; null when AniList does not know yet. */
  episodeCount: number | null;
  nextAiring: NextAiring | null;
}

export interface Studio {
  id: number;
  name: string;
  isMain: boolean;
  isAnimationStudio: boolean;
}

/** AniList's `source`: what the adaptation comes from. */
export type MediaSource =
  | "ORIGINAL"
  | "MANGA"
  | "LIGHT_NOVEL"
  | "VISUAL_NOVEL"
  | "VIDEO_GAME"
  | "NOVEL"
  | "WEB_NOVEL"
  | "DOUJINSHI"
  | "ANIME"
  | "LIVE_ACTION"
  | "GAME"
  | "COMIC"
  | "MULTIMEDIA_PROJECT"
  | "PICTURE_BOOK"
  | "OTHER";

/** AniList dates are partial: a year alone is common for what is announced. */
export interface PartialDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

/** The manga / novel an anime is adapted from, as AniList's own SOURCE relation says (never matched by title). */
export interface SourceWorkRef {
  id: number;
  /** AniList's format of the work: MANGA, NOVEL, ONE_SHOT. */
  format: "MANGA" | "NOVEL" | "ONE_SHOT" | null;
  titles: AnimeTitles;
  coverImage: CoverImage;
}

export interface ExternalLink {
  site: string;
  url: string;
}

export type StaffRoleGroup =
  | "director"
  | "composition"
  | "original"
  | "characterDesign"
  | "animationDirection"
  | "storyboard"
  | "artDirection"
  | "soundDirection"
  | "music";

/** One person, with every key role they hold on this anime (merged). */
export interface StaffCredit {
  id: number;
  name: string;
  nativeName: string | null;
  /** Ordered by importance; never empty. */
  groups: StaffRoleGroup[];
  image: string | null;
  /** What AniList wrote on their credits of THIS anime, as is (« Storyboard (ep 5) »). Absent on a detail saved by an older version. */
  roles?: string[];
}

export type RelationType =
  | "PREQUEL"
  | "SEQUEL"
  | "PARENT"
  | "SIDE_STORY"
  | "SPIN_OFF"
  | "ALTERNATIVE"
  | "SUMMARY"
  | "COMPILATION"
  | "OTHER";

export interface AnimeRelation {
  type: RelationType;
  anime: AnimeSummary;
}

export interface Anime extends AnimeSummary {
  bannerImage: string | null;
  /** Raw AniList description (may contain a small subset of HTML). Render via `parseDescription`. */
  description: string | null;
  genres: string[];
  /** Alternative titles (AniList synonyms), used to find the anime in a source. */
  synonyms: string[];
  studios: Studio[];
  staff: StaffCredit[];
  relations: AnimeRelation[];
  /** Minutes per episode. */
  episodeDuration: number | null;
  /** Kept in the data, never shown as product information. */
  averageScore: number | null;
  /** ISO 3166-1 alpha-2 (« JP »), when AniList gives one. */
  countryOfOrigin: string | null;
  /** Nature of the source work (« Manga », « Œuvre originale »…); null when AniList does not say. */
  source: MediaSource | null;
  startDate: PartialDate | null;
  endDate: PartialDate | null;
  /** Genres are the main classification; tags (rank ≥ `ANILIST.tagMinRank`, never spoilers) are the secondary themes. */
  tags: string[];
  /** AniList's SOURCE relation when it demonstrates the source work; null otherwise (the origin then stays plain text). */
  sourceWork: SourceWorkRef | null;
  siteUrl: string | null;
  externalLinks: ExternalLink[];
}

/** A card plus its start date: what the franchise graph, studio pages and filmographies need to order and label entries. */
export interface AnimeEntry extends AnimeSummary {
  startDate: PartialDate | null;
  /** When it ended (null: not over, or not known). Absent on entries cached before RC9. */
  endDate?: PartialDate | null;
}

/** An anime of a filmography or a studio page: its card, its start date and what it was adapted from. */
export interface CatalogueEntry extends AnimeEntry {
  source: MediaSource | null;
}

/** One AniList relation edge towards another ANIME (manga, novels and characters are not part of the franchise). */
export interface FranchiseEdge {
  type: RelationType;
  to: AnimeEntry;
}

/** An entry and its direct relations, as fetched (the unit the resolver walks). */
export interface FranchiseNode {
  entry: AnimeEntry;
  edges: FranchiseEdge[];
}

/** How an entry sits in its franchise. `main` entries are the series proper (« S1, S2… »), the rest is secondary. */
export type FranchiseKind = "main" | "movie" | "special" | "sideStory" | "spinOff" | "alternative" | "other";

export interface FranchiseMember {
  /** The verified graph edge, kept separately from format/season grouping. */
  relation?: RelationType;
  relationFrom?: number;
  entry: AnimeEntry;
  kind: FranchiseKind;
  /**
   * 1-based « Saison N » in release order, null for the others — and for EVERY entry of a continuous series (a long runner
   * is not made of seasons). A continuation cour (« Part 2 », « 2nd Cour » in its own title) shares the number of the
   * season it continues.
   */
  season: number | null;
  /** The cour number (2, 3…) when the entry's own title says it continues the season above; null otherwise. */
  part: number | null;
}

/**
 * A series seen as ONE thing in the interface, without ever merging AniList entries: a local, ephemeral grouping of
 * independent AniList media. There is no canonical franchise id; `anchorId` is just the entry it was resolved from.
 */
/** One relation of the AniList graph between two entries the franchise knows, as AniList states it (`from` has `to` as `type`). */
export interface FranchiseLink { from: number; to: number; type: RelationType }

export interface Franchise {
  anchorId: number;
  /** The earliest main entry (else the anchor): names and illustrates the franchise. */
  lead: AnimeEntry;
  main: FranchiseMember[];
  others: FranchiseMember[];
  /**
   * A long runner (one of its entries has run for `FRANCHISE.longRunnerEpisodes` or more): it stays one continuous series,
   * the entries AniList splits it into are listed without « Saison N ». No arc is ever invented.
   */
  continuous: boolean;
  /** The walk stopped at its bounds: the graph may hold more than what is listed. */
  truncated: boolean;
  /** The proven relations between the entries above, so what an entry is TO the one being read can be said from any page. */
  edges?: FranchiseLink[];
}

/** One scheduled (or aired) episode of an anime. */
export interface AiringEntry {
  animeId: number;
  episode: number;
  /** Unix seconds. */
  airingAt: number;
}
