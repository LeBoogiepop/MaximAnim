import { ui } from "@/lib/i18n/translate";
import { isSingleItem } from "@/lib/anilist/normalize";
import type { AnimeSummary, TitlePreference } from "@/types/anime";
import type { ProviderEpisode } from "./types";
import { hasJapaneseScript } from "@/lib/utils/script";

/** One row of the episode list, whatever its origin. */
export interface EpisodeItem {
  number: number;
  /** Only set when a provider supplies real metadata. */
  title: string | null;
  /** Exact-episode metadata alternatives; originals stay on providerEpisode. */
  titleAlternatives?: string[];
  thumbnail: string | null;
  /** Null when no provider lists this episode (not playable yet). */
  providerEpisode: ProviderEpisode | null;
}

/**
 * Merges what AniList knows (a count) with what the provider knows (a list).
 * AniList usually gives only a number, so bare entries are generated from it;
 * a provider may extend the list when AniList's count is unknown.
 */
export function buildEpisodeList(availableFromAniList: number | null, providerEpisodes: ProviderEpisode[] | null): EpisodeItem[] {
  const byNumber = new Map<number, EpisodeItem>();
  for (let n = 1; n <= (availableFromAniList ?? 0); n++) {
    byNumber.set(n, { number: n, title: null, thumbnail: null, providerEpisode: null });
  }
  for (const episode of providerEpisodes ?? []) {
    byNumber.set(episode.number, {
      number: episode.number,
      title: episode.title,
      thumbnail: episode.thumbnail,
      providerEpisode: episode,
    });
  }
  return [...byNumber.values()].sort((a, b) => a.number - b.number);
}

export function episodeLabel(item: Pick<EpisodeItem, "number">): string {
  return ui("Épisode {0}", formatEpisodeNumber(item.number));
}

/**
 * The episode's own title, or null: a missing title, and a placeholder that only repeats the number
 * (« Episode 3 », « Ép. 3 »), are not titles — the list then shows one thing, « Épisode 3 », not two.
 */
export function realEpisodeTitle(item: Pick<EpisodeItem, "number" | "title" | "titleAlternatives">, preference: TitlePreference = "english", alternatives: readonly (string | null | undefined)[] = []): string | null {
  const candidates = [item.title, ...(item.titleAlternatives ?? []), ...alternatives].map(title => cleanEpisodeTitle(item.number, title)).filter((t): t is string => Boolean(t));
  return preference === "native" ? candidates.find(hasJapaneseScript) ?? candidates[0] ?? null : candidates.find(t => !hasJapaneseScript(t)) ?? null;
}

function cleanEpisodeTitle(number: number, value: string | null | undefined): string | null {
  const title = value?.trim();
  if (!title) return null;
  if (/^(?:[ée]pisode|[ée]p\.?|e)\s*0*\d+(?:[.,]\d+)?\s*[-–—:·.]?\s*(?:\(?VOST(?:FR|EN)?\)?)?$/i.test(title)) return null;
  // A source that numbers its own titles (« 01 - Romance Dawn », « Episode 1: Romance Dawn ») would say the number twice once
  // ours is in front: only the part after its own number is the title.
  if (Number.isInteger(number)) {
    const own = new RegExp(`^(?:[ée]pisode|[ée]p\\.?|e)?\\s*0*${number}\\s*[-–—:·.](?:\\s+|$)`, "i");
    const stripped = title.replace(own, "").trim();
    if (stripped !== title) return stripped || null;
  }
  return title;
}

/**
 * The one way an episode is named in every list, whatever source supplied the row: « Épisode 1 » when there is no real title,
 * « 01 — Title » when there is. The number and the format come from here, never from a source's own naming.
 */
export function episodeHeading(item: Pick<EpisodeItem, "number" | "title">, preference: TitlePreference = "english"): string {
  const title = realEpisodeTitle(item, preference);
  return title ? `${paddedEpisodeNumber(item.number)} ${title}` : episodeLabel(item);
}

/** « 01 » for a single digit, so numbers line up in front of a title; larger and fractional numbers as they are. */
export function paddedEpisodeNumber(n: number): string {
  return Number.isInteger(n) && n < 10 ? `0${n}` : formatEpisodeNumber(n);
}

export function formatEpisodeNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}

/** Route slug for an episode: its number, stable across providers. */
export function episodeSlug(n: number): string {
  return String(n);
}

export function parseEpisodeSlug(slug: string): number | null {
  const n = Number(slug);
  return Number.isFinite(n) && n > 0 && n < 100_000 ? n : null;
}

/** "Film" for a film (one playable item), "ép. 12" otherwise. */
export function shortItemLabel(anime: Pick<AnimeSummary, "format" | "episodeCount">, episodeNumber: number): string {
  return isSingleItem(anime) ? "Film" : ui("ép. {0}", formatEpisodeNumber(episodeNumber));
}
