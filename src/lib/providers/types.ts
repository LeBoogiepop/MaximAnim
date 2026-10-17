import type { AnimeFormat, AnimeTitles } from "@/types/anime";

/**
 * The playback provider contract. The UI only ever talks to `PlaybackProvider`;
 * it never knows whether a provider runs in the browser (dev) or is backed by
 * a server-side adapter reached through `/api/providers/*`.
 */

/** Known codes, or any ISO 639 code an extension declares. */
export type ProviderLanguage = "en" | "fr" | "ja" | "multi" | (string & {});

export interface ProviderCapabilities {
  hls: boolean;
  mp4: boolean;
  /** Manual quality selection is possible (multi-variant HLS through hls.js). */
  qualities: boolean;
  subtitles: boolean;
  audioTracks: boolean;
  /** Provides episode titles/thumbnails rather than bare numbers. */
  episodeMetadata: boolean;
}

export type ProviderRuntime = "browser" | "server";

export interface ProviderDescriptor {
  id: string;
  displayName: string;
  language: ProviderLanguage;
  runtime: ProviderRuntime;
  capabilities: ProviderCapabilities;
  /** False for registered-but-unconfigured providers: shown in Settings, never used. */
  configured: boolean;
  /** Development/demo providers are labelled as such in the UI. */
  isDemo: boolean;
}

/** What a provider receives to find an anime in its own catalogue. */
export interface ProviderAnimeInput {
  anilistId: number;
  titles: AnimeTitles;
  /** AniList synonyms, when the detail is known. */
  synonyms?: string[];
  format: AnimeFormat | null;
  seasonYear: number | null;
  /** Episodes known to exist according to AniList; null if unknown. */
  availableEpisodes: number | null;
  /** The episode about to be watched, when known: evidence that the entry is the right one. */
  requestedEpisode?: number | null;
}

export interface ProviderMatch {
  providerId: string;
  /** Opaque identifier in the provider's catalogue. */
  providerAnimeId: string;
  /** A remembered entry was found implausible and replaced during this call. */
  corrected?: boolean;
}

export interface ProviderEpisode {
  /** Opaque identifier in the provider's catalogue. */
  id: string;
  number: number;
  title: string | null;
  thumbnail: string | null;
  durationSeconds: number | null;
  /** Other entries of the source for the same number (sub/dub, alternative releases). */
  variants?: { id: string; label: string | null }[];
}

export type StreamSourceType = "hls" | "mp4" | "webm";

export interface StreamSource {
  type: StreamSourceType;
  url: string;
  /** Quality as declared by the source ("1080p"); never invented. */
  quality?: string | null;
}

export interface SubtitleTrack {
  url: string;
  lang: string;
  label: string;
  default: boolean;
}

export type AudioVariant = "sub" | "dub" | "raw";

/**
 * One playable choice offered by a source: a server, a sub/dub variant, a
 * declared quality… `headers` are what the upstream requires; a <video>
 * element cannot send them, so such an option needs the playback relay
 * (`PlaybackProvider.preparePlayback`).
 */
export interface StreamOption {
  id: string;
  label: string;
  quality: string | null;
  audio: AudioVariant | null;
  sources: StreamSource[];
  subtitles: SubtitleTrack[];
  headers: Record<string, string>;
  /** True once URLs point at the relay (or when no relay is needed). */
  ready: boolean;
}

export interface ResolvedStream {
  /** Ordered by preference; the player uses the first one the device can play. */
  sources: StreamSource[];
  subtitles: SubtitleTrack[];
  /** Several servers/variants, when the source offers them (the first is the default). */
  options?: StreamOption[];
}

export interface PlaybackContext {
  animeId: number;
  episodeNumber: number;
}

export interface PlaybackProvider extends ProviderDescriptor {
  matchAnime(input: ProviderAnimeInput, signal?: AbortSignal): Promise<ProviderMatch | null>;
  getEpisodes(match: ProviderMatch, input: ProviderAnimeInput, signal?: AbortSignal): Promise<ProviderEpisode[]>;
  resolveEpisode(match: ProviderMatch, episode: ProviderEpisode, signal?: AbortSignal): Promise<ResolvedStream>;
  /** Makes an option playable (e.g. through the relay). Absent: options are always ready. */
  preparePlayback?(option: StreamOption, context: PlaybackContext, signal?: AbortSignal): Promise<StreamOption>;
  /**
   * Same-origin relay URLs for subtitle files of `option` the browser could not
   * read directly (null per URL whose host is not approved for this source).
   * Never widens access: approved hosts of an enabled, pinned source only.
   */
  relaySubtitles?(urls: string[], option: StreamOption, context: PlaybackContext, signal?: AbortSignal): Promise<(string | null)[]>;
  /** Search the source directly (manual "Choisir la correspondance"). */
  searchCatalogue?(query: string, signal?: AbortSignal, page?: number): Promise<{ items: { mediaId: string; title: string; image: string | null }[]; hasNextPage: boolean }>;
  /** Remember the user's choice of entry for an anime. */
  setMatch?(animeId: number, mediaId: string, title: string | null): Promise<void>;
  /** Forget this source's entry for an anime (matching runs again). Progress is untouched. */
  resetMatch?(animeId: number): Promise<void>;
  /** Starts the provider's runtime ahead of use (no network request for content). */
  warm?(): Promise<void>;
  /** Drops cached stream metadata for an episode (its URLs failed). */
  forgetStream?(episode: ProviderEpisode): void;
  /** Installed-source id when the provider comes from an extension. */
  sourceId?: string;
  /** Runtime label, for diagnostics ("Mangayomi JS", "Sora"). */
  runtimeLabel?: string;
  /**
   * Identity of the code answering (catalogue version + pinned hash). A
   * "not found" learnt from other code no longer says anything.
   */
  codeVersion?: string;
}

export type ProviderErrorKind = "notConfigured" | "notFound" | "unavailable" | "invalidResponse";

export class ProviderError extends Error {
  constructor(
    readonly kind: ProviderErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
