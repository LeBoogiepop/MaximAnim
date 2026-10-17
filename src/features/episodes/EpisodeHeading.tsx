"use client";

import { type EpisodeItem, episodeLabel, paddedEpisodeNumber, realEpisodeTitle } from "@/lib/providers/episodes";
import { usePreferences } from "@/features/settings/PreferencesContext";

/**
 * « 01 — Title » or just « Épisode 1 »: one piece of information, never « 1 · Épisode 1 ». The same markup in the episode
 * list and in the player's list (the text of `episodeHeading`, with the number and the separator quieter).
 */
export function EpisodeHeading({ episode, simple = false }: { episode: Pick<EpisodeItem, "number" | "title">; simple?: boolean }) {
  const { titleLanguage } = usePreferences();
  const title = realEpisodeTitle(episode, titleLanguage);
  if (simple || !title) return <>{episodeLabel(episode)}</>;
  return (
    <>
      <span className="inline-flex max-w-full items-baseline gap-2"><span className="shrink-0 tabular-nums text-soft">{paddedEpisodeNumber(episode.number)}</span>{" "}<span className="truncate">{title}</span></span>
    </>
  );
}

/** The episode's own title, or just « Épisode 1 »: for a row that has room to wrap, the number being said by the row itself. */
export function EpisodeTitleText({ episode }: { episode: Pick<EpisodeItem, "number" | "title"> }) {
  const { titleLanguage } = usePreferences();
  return <>{realEpisodeTitle(episode, titleLanguage) ?? episodeLabel(episode)}</>;
}
