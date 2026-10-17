import Dexie, { type EntityTable } from "dexie";
import { LISTS } from "@/config/app";
import { uid } from "@/lib/utils/id";
import type { InstalledSourceRecord, SourceRepositoryRecord } from "@/lib/repositories/types";
import { repositoryIdFor } from "@/lib/utils/hash";
import type {
  AiringFollowRecord,
  AnimeRecord,
  AnimeSourceRecord,
  ExtensionCodeRecord,
  LibraryStateRecord,
  HistoryRecord,
  ListRecord,
  PreferencesRecord,
  ProgressRecord,
  SourceMappingRecord,
  SourcePrefsRecord,
  SourceStatsRecord,
  ExternalSubtitleRecord,
  SubtitleTranslationRecord,
  SyncStateRecord,
  TombstoneRecord,
} from "./types";

export const DB_NAME = "maximanim-portfolio";

/**
 * Schema history. NEVER edit a published version: add a new `this.version(n)`
 * with an `.upgrade()` so existing users keep their data.
 *
 * v1 — lists, anime, progress, history, preferences
 * v2 — + repositories, sources (AnymeX/Mangayomi-style catalogues). Additive:
 *      existing tables are unchanged, so no data upgrade is needed.
 * v3 — extension runtime + cloud sync:
 *      + sourcePrefs, sourceMappings, animeSources (synced), extensionCode
 *        (local code cache), tombstones, syncState (local bookkeeping);
 *      history gets a stable `uid` (deduplicated), progress an `updatedAt`,
 *      repositories deterministic ids derived from their catalogue URL (so two
 *      devices importing the same catalogue agree), sources `permissions` and
 *      `pinned` code.
 * v4 — + sourceStats (device-local playback profile for Auto source selection;
 *      never synced, never in backups). Additive.
 * v5 — + airingFollows (synced, in backups): the explicit "Suivre les
 *      sorties" choice behind "Cette semaine". Additive, no upgrade: progress
 *      and list membership never implied a follow.
 * v6 — + subtitleTranslations (device-local cache of translated subtitle
 *      files; never synced, never in backups). Additive.
 * v7 — + externalSubtitles (device-local cache of French files from external
 *      subtitle providers, their searches and the viewer's timing offsets;
 *      never synced, never in backups). Additive, no upgrade.
 * v8 — + libraryStates (synced, in backups): the explicit « Abandonné » /
 *      « Terminé » of a title, behind the smart views of the library.
 *      Additive, no upgrade: no existing row implied either state.
 */
export class MaximeAnimeDB extends Dexie {
  lists!: EntityTable<ListRecord, "id">;
  anime!: EntityTable<AnimeRecord, "id">;
  progress!: EntityTable<ProgressRecord, "id">;
  history!: EntityTable<HistoryRecord, "id">;
  preferences!: EntityTable<PreferencesRecord, "id">;
  repositories!: EntityTable<SourceRepositoryRecord, "id">;
  sources!: EntityTable<InstalledSourceRecord, "id">;
  sourcePrefs!: EntityTable<SourcePrefsRecord, "id">;
  sourceMappings!: EntityTable<SourceMappingRecord, "id">;
  animeSources!: EntityTable<AnimeSourceRecord, "animeId">;
  libraryStates!: EntityTable<LibraryStateRecord, "animeId">;
  extensionCode!: EntityTable<ExtensionCodeRecord, "id">;
  tombstones!: EntityTable<TombstoneRecord, "id">;
  syncState!: EntityTable<SyncStateRecord, "id">;
  sourceStats!: EntityTable<SourceStatsRecord, "id">;
  airingFollows!: EntityTable<AiringFollowRecord, "animeId">;
  subtitleTranslations!: EntityTable<SubtitleTranslationRecord, "id">;
  externalSubtitles!: EntityTable<ExternalSubtitleRecord, "id">;

  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores({
      lists: "id, order",
      anime: "id, updatedAt",
      progress: "id, animeId, lastWatchedAt, [animeId+episodeNumber]",
      history: "++id, watchedAt, animeId, [animeId+episodeNumber]",
      preferences: "id",
    });
    this.version(2).stores({
      repositories: "id, &normalizedIndexUrl",
      sources: "id, repositoryId",
    });
    this.version(3)
      .stores({
        lists: "id, order, updatedAt",
        progress: "id, animeId, lastWatchedAt, [animeId+episodeNumber], updatedAt",
        history: "++id, watchedAt, animeId, [animeId+episodeNumber], uid",
        repositories: "id, &normalizedIndexUrl, updatedAt",
        sources: "id, repositoryId, updatedAt",
        sourcePrefs: "id, updatedAt",
        sourceMappings: "id, sourceId, animeId, updatedAt",
        animeSources: "animeId, updatedAt",
        extensionCode: "id, sourceId",
        tombstones: "id, collection, deletedAt",
        syncState: "id",
      })
      .upgrade(async (tx) => {
        await tx
          .table<ProgressRecord, string>("progress")
          .toCollection()
          .modify((p) => {
            p.updatedAt ??= p.lastWatchedAt;
          });

        // Stable history ids; identical sessions (same episode, same start) collapse.
        const history = await tx.table<HistoryRecord, number>("history").toArray();
        const seen = new Set<string>();
        const duplicates: number[] = [];
        for (const h of history) {
          const uid = `${h.animeId}:${h.episodeNumber}:${h.startedAt}`;
          if (seen.has(uid)) duplicates.push(h.id!);
          seen.add(uid);
        }
        await tx.table("history").bulkDelete(duplicates);
        await tx
          .table<HistoryRecord, number>("history")
          .toCollection()
          .modify((h) => {
            h.uid = `${h.animeId}:${h.episodeNumber}:${h.startedAt}`;
          });

        const prefs = tx.table<PreferencesRecord, string>("preferences");
        await prefs.toCollection().modify((p) => {
          p.updatedAt ??= Date.now();
        });

        // Deterministic repository ids; sources are keyed by repository id, so move them too.
        const repos = await tx.table<SourceRepositoryRecord, string>("repositories").toArray();
        const sources = tx.table<InstalledSourceRecord, string>("sources");
        for (const repo of repos) {
          const nextId = repositoryIdFor(repo.normalizedIndexUrl);
          const owned = await sources.where("repositoryId").equals(repo.id).toArray();
          const moved = owned.map((s) => ({
            ...s,
            id: `${nextId}:${s.externalId}`,
            repositoryId: nextId,
            permissions: s.permissions ?? { approvedHosts: [], pendingHosts: [], approvedAt: null },
            pinned: s.pinned ?? null,
          }));
          await sources.bulkDelete(owned.map((s) => s.id));
          await sources.bulkPut(moved);
          if (nextId !== repo.id) await tx.table("repositories").delete(repo.id);
          await tx.table("repositories").put({ ...repo, id: nextId, updatedAt: repo.updatedAt ?? repo.lastUpdatedAt });
        }
      });

    // Additive: a device-local playback profile per source. Never synced, never in backups.
    this.version(4).stores({
      sourceStats: "id",
    });

    // Additive: explicit airing follows. Synced and in backups.
    this.version(5).stores({
      airingFollows: "animeId, updatedAt",
    });

    // Additive: translated subtitle files, a device-local cache. Never synced, never in backups.
    this.version(6).stores({
      subtitleTranslations: "id, lastUsedAt",
    });

    // Additive: external subtitle files / searches / offsets, a device-local cache. Never synced, never in backups.
    this.version(7).stores({
      externalSubtitles: "id, kind, lastUsedAt",
    });

    // Additive: the explicit Abandonné / Terminé of a title. Synced and in backups.
    this.version(8).stores({
      libraryStates: "animeId, updatedAt",
    });

    // `populate` runs once, when the database is first created — so a user who
    // deletes the default list never sees it come back.
    this.on("populate", (tx) => {
      const now = Date.now();
      void tx.table<ListRecord, string>("lists").add({
        id: uid(),
        name: LISTS.defaultList.name,
        emoji: LISTS.defaultList.emoji,
        order: 0,
        entries: [],
        createdAt: now,
        updatedAt: now,
      });
    });
  }
}

export const db = new MaximeAnimeDB();
