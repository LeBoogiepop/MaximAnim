import type { AnimeStatus } from "@/types/anime";
import type { SeasonRelation } from "@/lib/airing/season";

/**
 * The status shown under a title is a property of THAT entry (never of its
 * franchise), and only when it tells something useful. "Terminé" is the
 * default state of the catalogue: repeating it carries no information.
 */
export type EntryStatusTag = "airing" | "upcoming" | "hiatus" | "cancelled";

const TAGS: Partial<Record<AnimeStatus, EntryStatusTag>> = {
  RELEASING: "airing",
  NOT_YET_RELEASED: "upcoming",
  HIATUS: "hiatus",
  CANCELLED: "cancelled",
};

/** Only exceptional or live states. `relation` hides what the whole season page already says. */
export function entryStatusTag(status: AnimeStatus | null | undefined, relation?: SeasonRelation): EntryStatusTag | null {
  const tag = status ? TAGS[status] ?? null : null;
  // A future season is entirely "À venir": repeating it under every poster is noise.
  if (tag === "upcoming" && relation === "future") return null;
  return tag;
}

/** "ép. 07": zero-padded whole numbers so the episode reads at a glance; films have no number. */
export function historyEpisodeText(episode: number, single: boolean, prefix: string, film: string): string {
  if (single) return film;
  const n = Number.isInteger(episode) ? String(episode).padStart(2, "0") : episode.toFixed(1).replace(".", ",").padStart(4, "0");
  return `${prefix} ${n}`;
}
