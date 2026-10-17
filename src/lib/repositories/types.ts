/**
 * Source repositories (AnymeX / Mangayomi style catalogues).
 *
 * Two separate concepts, on purpose:
 * - a *catalogue* lists extensions (metadata only — discovering ≠ executing);
 * - a *runtime* (see `runtime.ts`) is what could turn a catalogue entry into a
 *   PlaybackProvider. Importing a repository never downloads or runs code.
 */

/** Ecosystem an extension was written for. */
export type SourceFormat =
  | "mangayomi-js"
  | "anymex-dart"
  | "sora"
  | "aniyomi"
  | "cloudstream"
  | "unknown";

/** Catalogue file format a repository was recognised as. */
export type CatalogueFormat = "mangayomi" | "sora" | "aniyomi" | "cloudstream";

export type Compatibility = "compatible" | "experimental" | "unsupported";

export interface SourceRepositoryRecord {
  id: string;
  name: string;
  /** What the user pasted. */
  url: string;
  /** The catalogue file actually fetched on refresh. */
  normalizedIndexUrl: string;
  sourceType: CatalogueFormat;
  addedAt: number;
  lastUpdatedAt: number;
  /** Last local modification (sync clock). */
  updatedAt: number;
  enabled: boolean;
  /**
   * Holds only the curated « Sources recommandées » picked out of an upstream
   * catalogue: a refresh updates those, it never adds the rest. Adding the
   * repository by hand turns it into a full repository.
   */
  curated?: boolean;
  /** Summary of the latest refresh, for "2 mises à jour · 1 nouvelle source". */
  lastRefresh: RefreshSummary | null;
}

export interface InstalledSourceRecord {
  /** `${repositoryId}:${externalId}` */
  id: string;
  repositoryId: string;
  /** Id of the extension inside its catalogue (stable across refreshes). */
  externalId: string;
  name: string;
  language: string;
  version: string | null;
  iconUrl: string | null;
  extensionUrl: string | null;
  sourceFormat: SourceFormat;
  /** User choice. Only effective when compatibility allows it. */
  enabled: boolean;
  /** Snapshot at import time; the UI re-evaluates it against installed runtimes. */
  compatibility: Compatibility;
  compatibilityReason: string | null;
  /** Previous version when the last refresh changed it (update indicator). */
  previousVersion: string | null;
  /** Small, forward-compatible extras (base URL, NSFW flag, min app version…). */
  metadata: Record<string, string | number | boolean | null>;
  /** Network access the user granted to this extension. */
  permissions: SourcePermissions;
  /** The exact extension code that runs (null until first enabled). */
  pinned: PinnedCode | null;
  addedAt: number;
  /** Last local modification (sync clock). */
  updatedAt: number;
}

export interface SourcePermissions {
  /** Hostnames the user explicitly allowed (exact names). */
  approvedHosts: string[];
  /** Hosts the pinned (or pending) code declares/needs and that are not approved yet. */
  pendingHosts: string[];
  approvedAt: number | null;
  /**
   * Explicit, off-by-default opt-in (« Toujours autoriser les hôtes de sous-titres de <source> »): the exact hostname of a
   * subtitle track this source returns is approved when it is met. Never a wildcard, never another source's hosts, never
   * media or catalogue access. Absent = false.
   */
  trustSubtitleHosts?: boolean;
}

/** Identity of the code actually executed: repository + source + version + content hash. */
export interface PinnedCode {
  version: string | null;
  /** SHA-256 of the script, hex. */
  hash: string;
  url: string;
  pinnedAt: number;
}

/** A catalogue entry as parsed, before it is attached to a repository. */
export interface CatalogueEntry {
  externalId: string;
  name: string;
  language: string;
  version: string | null;
  iconUrl: string | null;
  extensionUrl: string | null;
  sourceFormat: SourceFormat;
  metadata: Record<string, string | number | boolean | null>;
}

export interface ParsedCatalogue {
  format: CatalogueFormat;
  entries: CatalogueEntry[];
  /** Entries dropped because they are manga/novel. */
  skippedNonAnime: number;
}

export interface RefreshSummary {
  added: number;
  removed: number;
  updated: number;
  total: number;
  at: number;
}
