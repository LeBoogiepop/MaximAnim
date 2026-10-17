import type { SubtitleChoice } from "@/lib/subtitles/select";
import type { SubtitleStyle } from "@/lib/subtitles/style";
import type { Anime, AnimeSummary, TitlePreference } from "@/types/anime";

/** All timestamps are epoch milliseconds so records serialize to JSON unchanged. */

export interface ListEntry {
  animeId: number;
  addedAt: number;
}

export interface ListRecord {
  id: string;
  name: string;
  emoji: string;
  /** Position among lists; lower first. */
  order: number;
  /** Ordered anime references; the array order is the display order. */
  entries: ListEntry[];
  createdAt: number;
  updatedAt: number;
}

/** Local reference to an anime: what the library needs to render offline. */
export interface AnimeRecord {
  id: number;
  summary: AnimeSummary;
  /** Last full detail fetched, kept so the detail page survives offline. */
  detail: Anime | null;
  detailFetchedAt: number | null;
  updatedAt: number;
}

export interface ProgressRecord {
  /** `${animeId}:${episodeNumber}` — progress is per episode, whatever the source. */
  id: string;
  animeId: number;
  episodeNumber: number;
  providerId: string | null;
  providerEpisodeId: string | null;
  /** Seconds. */
  currentTime: number;
  /** Seconds; 0 when unknown (manually marked). */
  duration: number;
  /** 0..1 */
  percentage: number;
  completed: boolean;
  lastWatchedAt: number;
  /** Last local modification (sync clock); differs from lastWatchedAt on manual marks. */
  updatedAt: number;
  /**
   * "Retirer de Continuer", made at `position`: hides this episode from
   * Continuer while playback stays around there. Playing it meaningfully
   * further drops it (see `computeProgress`). Progress, history and lists are
   * untouched. Optional and unindexed: no schema version needed.
   */
  continueDismissal?: ContinueDismissal | null;
}

export interface ContinueDismissal {
  /** Seconds: the episode position when it was dismissed. */
  position: number;
  at: number;
}

export interface HistoryRecord {
  id?: number;
  /** Stable across devices: `${animeId}:${episodeNumber}:${startedAt}`. */
  uid: string;
  animeId: number;
  episodeNumber: number;
  providerId: string | null;
  startedAt: number;
  /** Last activity within this viewing session. */
  watchedAt: number;
  position: number;
  duration: number;
}

export interface Preferences {
  interfaceLanguage?: import("@/lib/i18n/language").InterfaceLanguage;
  accent?: import("@/lib/utils/accent").Accent;
  titleLanguage: TitlePreference;
  playbackRate: number;
  completionThreshold: number;
  preferredProviderId: string | null;
  /** CC menu choice; applies to every episode that has subtitles. */
  subtitleLanguage: SubtitleChoice;
  /** How inline subtitles look (Standard / Lisible; `minimal` is legacy, still read and rendered). */
  subtitleStyle: SubtitleStyle;
  /** Subtitle size: an index into `SUBTITLES.size.multipliers`. Global, bounded. */
  subtitleSize: number;
  /** Subtitle height: an index into `SUBTITLES.height.lines` (the WebVTT `line` of ordinary cues). Global, bounded. */
  subtitleHeight: number;
  /** Contour of the subtitle text: an index into `SUBTITLES.outline.radii`; null = the look's own default. Global, bounded. */
  subtitleOutline: number | null;
  /** Translate English subtitles to French when no French track exists. Off by default: the API is only used when asked. */
  translateSubtitles: boolean;
  /** Explicit-content discovery is off unless the owner opts in. */
  showAdult?: boolean;
}

export interface PreferencesRecord extends Preferences {
  id: "prefs";
  updatedAt?: number;
}

export type SourcePreferenceValue = string | boolean | string[];

/** Values of an extension's own settings (language, server, quality…). */
export interface SourcePrefsRecord {
  /** Installed source id. */
  id: string;
  values: Record<string, SourcePreferenceValue>;
  updatedAt: number;
}

/** AniList anime ↔ the media entry of one source. */
export interface SourceMappingRecord {
  /** `${sourceId}|${animeId}` */
  id: string;
  sourceId: string;
  animeId: number;
  /** Opaque identifier/link of the anime inside the source. */
  mediaId: string;
  title: string | null;
  /** Chosen by the user in "Choisir la correspondance". */
  manual: boolean;
  updatedAt: number;
}

/** Automatic mode or exact source chosen for one anime. */
export interface AnimeSourceRecord {
  animeId: number;
  /** An `auto:*` mode ID or an opaque provider ID. */
  providerId: string;
  updatedAt: number;
}

/**
 * "Suivre les sorties": an explicit choice to monitor an airing anime in
 * "Cette semaine". Watching an episode or listing an anime never creates one.
 */
export interface AiringFollowRecord {
  animeId: number;
  followedAt: number;
  updatedAt: number;
}

/** Local cache of pinned extension code. Never synced: re-fetched from its repository. */
export interface ExtensionCodeRecord {
  /** `${sourceId}@${hash}` */
  id: string;
  sourceId: string;
  version: string | null;
  hash: string;
  url: string;
  code: string;
  fetchedAt: number;
}

/**
 * What the viewer said about a title, beyond watching it. Only two explicit states exist: « Abandonné » (no longer
 * wanted in Continuer) and « Terminé » (declared finished). « À continuer » is never stored: it is derived, like the
 * automatic part of « Terminés » (see `lib/library/views.ts`).
 */
export type LibraryState = "abandoned" | "completed";

/** Synced and in backups. One row per title; no row = no explicit state. Progress and history are never touched by it. */
export interface LibraryStateRecord {
  animeId: number;
  state: LibraryState;
  /** When the viewer chose it (epoch ms): watching anything later lifts « abandoned » (they are back). */
  at: number;
  /** Sync clock. */
  updatedAt: number;
}

export type SyncCollection =
  | "lists"
  | "anime"
  | "progress"
  | "history"
  | "preferences"
  | "repositories"
  | "sources"
  | "sourcePrefs"
  | "sourceMappings"
  | "animeSources"
  | "airingFollows"
  | "libraryStates";

/** A local deletion waiting to reach the cloud (and remembered so it is not resurrected). */
export interface TombstoneRecord {
  /** `${collection}|${recordId}` */
  id: string;
  collection: SyncCollection;
  recordId: string;
  deletedAt: number;
}

export interface SyncStateRecord {
  id: "state";
  userId: string | null;
  /** Server timestamp (ISO) of the newest pulled row. */
  cursor: string | null;
  /** Local changes with updatedAt >= this are still to push. */
  pushedUpTo: number;
  lastSyncAt: number | null;
  lastError: string | null;
}

/** One playback attempt with a source, as measured on this device. */
export interface PlaybackAttempt {
  at: number;
  animeId: number;
  episode: number;
  ok: boolean;
  /** Player outcome or failure stage ("native-hls", "timeout", "resolve"…). */
  outcome: string;
  /** Video resolution (the source's "videos" call), ms; null when served from cache. */
  resolveMs: number | null;
  /** From stream ready to first frame, ms. */
  startupMs: number | null;
  /** From opening the episode to first frame, ms. */
  ttffMs: number | null;
  /** Highest declared height among the options offered; null if none declared. */
  maxHeight: number | null;
  /** Declared height of the option that played (the source's label). */
  selectedHeight: number | null;
  /** Player mode: native-hls / hls.js / progressive. */
  mode?: string | null;
  /** Decoded size measured on the <video> (videoWidth × videoHeight) at the start… */
  actualWidth?: number | null;
  actualHeight?: number | null;
  /** …and the largest one seen during the first seconds (adaptive HLS climbs). */
  maxObservedHeight?: number | null;
  /** Languages of the subtitle tracks the played option carried. */
  subtitleLanguages?: string[];
  /** Width of the largest decoded frame (wide UHD encodes keep 3840 but lose lines). */
  maxObservedWidth?: number | null;
  /** Burned-in subtitle language, from an explicit version marker ("[VOSTFR]"). */
  hardSubtitle?: string | null;
  /** Audio language of an announced dub ("VF"). */
  dubLanguage?: string | null;
  /** The version was stated (text tracks or an explicit marker), even if it offers no FR/EN subtitles. */
  versionKnown?: boolean;
}

/**
 * Whether a source has an anime, as learnt from matching and its episode list.
 * Only answers are stored: a timeout or a crash is never "absent".
 */
export interface AvailabilityEntry {
  ok: boolean;
  maxEpisode: number | null;
  at: number;
  /** `codeVersion` of the source when learnt (absent on records written before it existed). */
  code?: string | null;
}

/**
 * Device-local playback profile of one provider (keyed by provider id). Rolling
 * window of attempts plus what is known about each anime's availability. Never
 * leaves the device.
 */
export interface SourceStatsRecord {
  id: string;
  language: string;
  attempts: PlaybackAttempt[];
  /** animeId → the source has it (with its highest episode), or it does not. */
  availability: Record<number, AvailabilityEntry>;
  lastSuccessAt: number | null;
}

/** A translated subtitle file, cached on this device only (see lib/db/translations.ts). */
export interface SubtitleTranslationRecord {
  /** Source-file hash + languages + translator id/version + format version. */
  id: string;
  vtt: string;
  createdAt: number;
  lastUsedAt: number;
}

/**
 * External subtitles, cached on this device only (see lib/db/external-subtitles.ts). Never synced, never in backups:
 * - file: the converted WebVTT of one provider file (what a cached track plays offline);
 * - search: the validated candidate list of one episode (`payload` is JSON);
 * - offset: the viewer's (or the alignment's) shift in seconds for one episode + file (`payload` is JSON).
 */
export interface ExternalSubtitleRecord {
  /** `<kind>|<animeId>|<episode>|…` — see the key builders. */
  id: string;
  kind: "file" | "search" | "offset";
  vtt?: string;
  payload?: string;
  createdAt: number;
  lastUsedAt: number;
}
