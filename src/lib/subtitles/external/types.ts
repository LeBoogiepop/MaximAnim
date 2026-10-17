/**
 * External subtitles: a subtitle PROVIDER is independent of the video source (`PlaybackProvider`).
 * A video from any source can receive a French file from a provider below. Pure types, shared by the server
 * (providers, routes) and the client (hook, cache) — nothing here touches the network.
 */

export type ExternalProviderId = "opensubtitles" | "gestdown";

export const EXTERNAL_PROVIDER_LABELS: Record<ExternalProviderId, string> = {
  opensubtitles: "OpenSubtitles",
  gestdown: "Addic7ed",
};

/** What the provider tells about who wrote the file. Most cannot say: that is `unknown`, never `human`. */
export type SubtitleOrigin = "human" | "machine" | "unknown";

/**
 * Does the release name prove the episode?
 * - verified: it explicitly names the expected episode;
 * - unknown: no episode can be read from it (loses to verified);
 * - contradicted: it names another episode (dropped before anything else).
 */
export type EpisodeMatch = "verified" | "unknown" | "contradicted";

/** External identifiers of the anime (AniList → IMDb / TMDB / TVDB), with where they came from. */
export interface ExternalIds {
  imdb: string | null;
  tmdb: number | null;
  tvdb: number | null;
}

/**
 * How the AniList episode number maps onto the numbering a provider uses.
 * - season: a demonstrated (season, episode) pair;
 * - cumulative: one AniList entry spread over several IMDb seasons (Bleach, One Piece): the dataset gives (season, episode),
 *   and the release may also carry the AniList number itself (absolute);
 * - absolute: a long-running series with no demonstrable season structure: the provider is asked for absolute N and ONLY
 *   a release that names N is kept.
 */
export type ExternalEpisodeRef =
  | { kind: "season"; season: number; episode: number; tvdb: ExternalTvdbEpisode | null; reason: string }
  | { kind: "cumulative"; season: number; episode: number; absolute: number; tvdb: ExternalTvdbEpisode | null; reason: string }
  | { kind: "absolute"; season: 1; episode: number; absolute: number; tvdb: null; reason: string };

/** The same episode in TVDB's numbering (what Addic7ed / Gestdown use), when the dataset gives it. */
export interface ExternalTvdbEpisode {
  season: number;
  episode: number;
}

/** Everything a provider may need to search, built by the shared resolver — never by the client. */
export interface ExternalSubtitleQuery {
  anilistId: number;
  language: string;
  ids: ExternalIds;
  ref: ExternalEpisodeRef;
  /** IMDb's title of that episode when known: a second, independent database to cross-check a provider's episode with. */
  episodeTitle: string | null;
}

export interface ExternalSubtitleCandidate {
  provider: ExternalProviderId;
  /** The provider's own file identifier (strictly validated; the client never supplies a URL). */
  id: string;
  language: string;
  releaseName: string | null;
  /** What the RELEASE NAME says (never the provider's echo of the query). */
  declared: { season: number | null; episode: number | null };
  hearingImpaired: boolean | null;
  origin: SubtitleOrigin;
  fps: number | null;
  match: EpisodeMatch;
  /** Why it was judged so (internal / diagnostics). */
  reason: string;
  ids: ExternalIds;
}

export interface ExternalSubtitleFile {
  provider: ExternalProviderId;
  id: string;
  /** Decoded text (SRT / ASS / VTT), UTF-8. */
  text: string;
}

export interface ExternalSearchResult {
  /** Null: no reliable mapping, so no provider was asked. */
  ref: ExternalEpisodeRef | null;
  ids: ExternalIds | null;
  /** Why nothing was asked (diagnostics, never shown raw). */
  notApplicable: string | null;
  candidates: ExternalSubtitleCandidate[];
  /** One entry per provider asked: it answered (`ok`), had nothing to ask (`skipped`), or failed. */
  providers: { id: ExternalProviderId; status: "ok" | "skipped" | "failed" }[];
}

/** The seam: one implementation per provider, no plugin machinery. */
export interface ExternalSubtitleProvider {
  id: ExternalProviderId;
  label: string;
  /** Exact hosts this provider's code ever calls. */
  allowedHosts: readonly string[];
  /** Null when this provider cannot be asked for that anime (missing id it needs): `skipped`, not a failure. */
  search(query: ExternalSubtitleQuery, signal: AbortSignal): Promise<ExternalSubtitleCandidate[] | null>;
  /** `id` is validated by the provider; the URL is built here from fixed hosts. */
  fetchFile(id: string, signal: AbortSignal): Promise<ExternalSubtitleFile>;
}

/** The only anime facts a search needs (all from AniList, supplied by the app's own metadata). */
export interface ExternalAnimeFacts {
  anilistId: number;
  /** Episode count AniList knows (null while airing). */
  episodeCount: number | null;
  format: string | null;
}
