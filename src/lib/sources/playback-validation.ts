import { PLAYBACK_VALIDATION as LIMIT } from "@/config/app";
import { ProviderError, type PlaybackContext, type PlaybackProvider, type ProviderEpisode, type ProviderMatch } from "@/lib/providers/types";

export const positiveDuration = (seconds: number | null | undefined): number | null => typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0 ? seconds : null;

/** Metadata is approximate; a missing/Infinity duration is never evidence of a bad video. */
export function durationVerdict(actual: number, expected?: number | null): "unknown" | "plausible" | "incompatible" {
  const duration = positiveDuration(actual);
  if (duration == null) return "unknown";
  const reference = positiveDuration(expected);
  if (reference != null) return duration + LIMIT.runtimeSlackSeconds < reference * LIMIT.minExpectedRatio ? "incompatible" : "plausible";
  return duration < LIMIT.minKnownSeconds ? "incompatible" : "plausible";
}

/** Check identities we actually possess. Opaque stream URLs prove no anime/episode identity. */
export function assertPlaybackIdentity(provider: Pick<PlaybackProvider, "id">, match: ProviderMatch, episode: ProviderEpisode, expected?: PlaybackContext): void {
  if ((match.providerId && match.providerId !== provider.id) || (expected && episode.number !== expected.episodeNumber)) {
    throw new ProviderError("invalidResponse", "La correspondance ne désigne pas le fournisseur ou l'épisode demandé.");
  }
}
