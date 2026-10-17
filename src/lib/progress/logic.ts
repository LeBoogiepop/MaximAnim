import { AIRING, HOME, PROGRESS } from "@/config/app";
import type { AnimeRecord, ProgressRecord } from "@/lib/db/types";
import { airedAt, isMonitored } from "@/lib/airing/schedule";
import { availableEpisodeCount } from "@/lib/anilist/normalize";
import type { AiringEntry } from "@/types/anime";
import { nextClock } from "@/lib/utils/hash";

/** Pure watch-progress rules. No IndexedDB here, so everything is unit-testable. */

export function progressId(animeId: number, episodeNumber: number): string {
  return `${animeId}:${episodeNumber}`;
}

export interface PlaybackSample {
  animeId: number;
  episodeNumber: number;
  providerId: string | null;
  providerEpisodeId: string | null;
  currentTime: number;
  duration: number;
  /** True when the media fired `ended`. */
  ended?: boolean;
  now: number;
  completionThreshold?: number;
}

export function computeProgress(previous: ProgressRecord | undefined, sample: PlaybackSample): ProgressRecord {
  const threshold = sample.completionThreshold ?? PROGRESS.defaultCompletionThreshold;
  const duration = Number.isFinite(sample.duration) && sample.duration > 0 ? sample.duration : 0;
  const currentTime = Math.max(0, Math.min(Number.isFinite(sample.currentTime) ? sample.currentTime : 0, duration || Infinity));
  const percentage = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const reachedEnd = Boolean(sample.ended) || (duration > 0 && percentage >= threshold);
  const dismissal = previous?.continueDismissal;
  return {
    id: progressId(sample.animeId, sample.episodeNumber),
    animeId: sample.animeId,
    episodeNumber: sample.episodeNumber,
    providerId: sample.providerId,
    providerEpisodeId: sample.providerEpisodeId,
    currentTime,
    duration,
    percentage,
    // Rewatching a finished episode must not un-finish it.
    completed: (previous?.completed ?? false) || reachedEnd,
    lastWatchedAt: sample.now,
    updatedAt: nextClock(previous?.updatedAt, sample.now),
    // Reopening around the same spot keeps the anime out of Continuer; watching on brings it back.
    ...(dismissal && !reachedEnd && !isStaleDismissal(dismissal, currentTime) ? { continueDismissal: dismissal } : {}),
  };
}

/** A dismissal no longer applies once playback moved meaningfully away from where it was made. */
export function isStaleDismissal(dismissal: { position: number }, currentTime: number): boolean {
  return Math.abs(currentTime - dismissal.position) >= HOME.continueDismissStaleSeconds;
}

/** Where playback should start, or 0 to start from the beginning. */
export function resumePosition(record: ProgressRecord | undefined, duration?: number): number {
  if (!record) return 0;
  const total = duration && duration > 0 ? duration : record.duration;
  if (record.completed && record.percentage >= 0.999) return 0;
  if (record.currentTime < PROGRESS.minMeaningfulSeconds) return 0;
  if (total > 0 && record.currentTime > total - PROGRESS.resumeEndMarginSeconds) return 0;
  return Math.max(0, record.currentTime - PROGRESS.resumeRewindSeconds);
}

/** An episode in progress: started, not finished. */
export function isInProgress(record: ProgressRecord): boolean {
  return !record.completed && record.currentTime >= PROGRESS.minMeaningfulSeconds;
}

export type EpisodeState = "unseen" | "partial" | "completed";

export function episodeState(record: ProgressRecord | undefined): EpisodeState {
  if (!record) return "unseen";
  if (record.completed) return "completed";
  return isInProgress(record) ? "partial" : "unseen";
}

/** Spoiler access follows the consecutive watched prefix, never the highest watched number. */
export function firstUnwatchedEpisode(records: readonly ProgressRecord[], numbers?: readonly number[]): number | undefined {
  const completed = new Set(records.filter(r => r.completed).map(r => r.episodeNumber));
  if (numbers) return numbers.find(n => !completed.has(n));
  let next = 1;
  while (completed.has(next)) next++;
  return next;
}

export function episodeArtworkAllowed(record: ProgressRecord | undefined, number: number, firstUnwatched: number | undefined): boolean {
  return episodeState(record) !== "unseen" || number === firstUnwatched;
}

/**
 * The episode to play next for one anime: the in-progress episode furthest
 * along in the story, else the one after the highest completed episode.
 * `available` bounds the suggestion (null = unknown, assume it exists).
 */
export function nextEpisodeFor(records: ProgressRecord[], available: number | null): number | null {
  if (!records.length) return available === 0 ? null : 1;
  const lastCompleted = Math.max(0, ...records.filter((r) => r.completed).map((r) => r.episodeNumber));
  const partialAfter = records
    .filter((r) => isInProgress(r) && r.episodeNumber > lastCompleted)
    .sort((a, b) => a.episodeNumber - b.episodeNumber)[0];
  if (partialAfter) return partialAfter.episodeNumber;
  const candidate = Math.floor(lastCompleted) + 1;
  if (available != null && candidate > available) return null;
  return candidate;
}

export interface ContinueItem {
  anime: AnimeRecord;
  progress: ProgressRecord;
}

/** Incomplete, recently watched episodes — one per anime, newest activity first. */
export function buildContinueWatching(progress: ProgressRecord[], anime: Map<number, AnimeRecord>, limit: number): ContinueItem[] {
  const latestByAnime = new Map<number, ProgressRecord>();
  for (const record of progress) {
    const current = latestByAnime.get(record.animeId);
    if (!current || record.lastWatchedAt > current.lastWatchedAt) latestByAnime.set(record.animeId, record);
  }
  const items: ContinueItem[] = [];
  for (const record of latestByAnime.values()) {
    const a = anime.get(record.animeId);
    // "Retirer de Continuer" hides the anime while its latest episode is still where it was dismissed.
    const dismissed = record.continueDismissal != null && !isStaleDismissal(record.continueDismissal, record.currentTime);
    if (a && isInProgress(record) && !dismissed) items.push({ anime: a, progress: record });
  }
  return items.sort((x, y) => y.progress.lastWatchedAt - x.progress.lastWatchedAt).slice(0, limit);
}

export interface UpNextItem {
  anime: AnimeRecord;
  episodeNumber: number;
  /** Ordering key: the latest activity on the anime, or when its new episode aired. */
  lastActivity: number;
  /** The episode aired recently, after the latest activity ("Nouveau"). */
  isNew: boolean;
  artworkAllowed: boolean;
}

/**
 * Anime whose latest activity was *finishing* an episode, pointing at the next
 * one — only once it has aired. Anime currently mid-episode belong to
 * "Continuer" instead. A newly aired episode is flagged and ranked by its
 * airing time, so a weekly show surfaces when its episode comes out. An
 * airing anime whose aired count is unknown gets no guess.
 */
export function buildUpNext(progress: ProgressRecord[], anime: Map<number, AnimeRecord>, limit: number, now = Date.now(), schedule: readonly AiringEntry[] = []): UpNextItem[] {
  const byAnime = new Map<number, ProgressRecord[]>();
  for (const record of progress) {
    const list = byAnime.get(record.animeId) ?? [];
    list.push(record);
    byAnime.set(record.animeId, list);
  }
  const items: UpNextItem[] = [];
  for (const [animeId, records] of byAnime) {
    const a = anime.get(animeId);
    if (!a) continue;
    const latest = records.reduce((x, y) => (y.lastWatchedAt > x.lastWatchedAt ? y : x));
    if (!latest.completed) continue;
    if (latest.continueDismissal && !isStaleDismissal(latest.continueDismissal, latest.currentTime)) continue;
    // Episodes aired since this copy was fetched count too (the schedule knows them).
    const known = availableEpisodeCount(a.summary, now);
    const scheduled = schedule.reduce((max, e) => (e.animeId === animeId && e.airingAt * 1000 <= now ? Math.max(max, e.episode) : max), 0);
    const available = known == null && !scheduled ? null : Math.max(known ?? 0, scheduled);
    if (available == null && isMonitored(a.summary)) continue;
    const next = nextEpisodeFor(records, available);
    if (next == null) continue;
    const aired = airedAt(a.summary, next, schedule, now);
    const isNew = aired != null && aired * 1000 > latest.lastWatchedAt && now - aired * 1000 < AIRING.newForMs;
    items.push({ anime: a, episodeNumber: next, lastActivity: isNew ? aired! * 1000 : latest.lastWatchedAt, isNew, artworkAllowed: episodeArtworkAllowed(records.find(r => r.episodeNumber === next), next, firstUnwatchedEpisode(records)) });
  }
  return items.sort((x, y) => y.lastActivity - x.lastActivity).slice(0, limit);
}

export function watchedCount(records: ProgressRecord[]): number {
  return records.filter((r) => r.completed).length;
}
