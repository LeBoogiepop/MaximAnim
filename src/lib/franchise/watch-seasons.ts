import { ui } from "@/lib/i18n/translate";
import type { AnimeEntry, AnimeStatus, Franchise, FranchiseMember } from "@/types/anime";
import { seasonLabel } from "./label";

/**
 * The franchise as the player's episode sheet needs it: a short ordered list of identified AniList entries (exact ids),
 * each saying WHAT it is (season, part, film, spin-off, side story) — only the entries whose place AniList's graph and
 * dates settle. Anything ambiguous is left out rather than numbered by guesswork: no invented season number, no
 * chronological claim for a film or a side story (they are listed after the series, in release order, nothing more).
 * Pure; see docs/v1-seasons-contract.md.
 */

export type WatchSeasonKind = "season" | "part" | "film" | "spinoff" | "sidestory";

export interface WatchSeason {
  /** The exact AniList id: the one the fiche and the player already use. */
  id: number;
  kind: WatchSeasonKind;
  /** « Saison 2 », « Saison 3, partie 2 », « Film », « Spin-off », « Histoire parallèle »: never a number AniList's data does not give. */
  label: string;
  /** The title of the entry, in the viewer's title language. Shown next to the label when it is not already the label. */
  title: string;
  /** Season / part numbers when the franchise is made of numbered seasons; null otherwise (a long runner, a film…). */
  seasonNumber: number | null;
  partNumber: number | null;
  /** Full start year, never abbreviated; null when AniList has none. */
  year: number | null;
  status: AnimeStatus | null;
  /** What AniList says (the planned total, else null): never counted from what aired. */
  episodeCount: number | null;
  current: boolean;
}

export interface WatchSeasons {
  /** Main series first (seasons / parts in story order), then films, spin-offs and side stories in release order. */
  items: WatchSeason[];
  /** Index of the entry being watched in `items`, -1 when it is not one of them (a special, an alternative version). */
  currentIndex: number;
  /** The walk stopped at its bounds, the list may lack entries. */
  truncated: boolean;
  /** Something is reachable beyond `items` (specials, alternatives…): the franchise page lists them. */
  hasMore: boolean;
}

const startYear = (e: AnimeEntry): number | null => e.startDate?.year ?? e.seasonYear ?? null;

function secondaryKind(m: FranchiseMember): WatchSeasonKind | null {
  switch (m.kind) {
    case "movie":
      return "film";
    case "spinOff":
      return "spinoff";
    case "sideStory":
      return "sidestory";
    default:
      return null;
  }
}

function secondaryLabel(kind: WatchSeasonKind): string {
  return kind === "film" ? ui("Film") : kind === "spinoff" ? "Spin-off" : ui("Histoire parallèle");
}

export function buildWatchSeasons(franchise: Franchise, currentId: number, titleOf: (entry: AnimeEntry) => string): WatchSeasons {
  const items: WatchSeason[] = [];
  // Undated main entries sort last in the franchise; with two of them their order is not settled, so they are not listed.
  const undated = franchise.main.filter((m) => startYear(m.entry) == null);
  for (const m of franchise.main) {
    if (startYear(m.entry) == null && undated.length > 1) continue;
    // A long runner is not made of numbered seasons: the entry's own title is its label.
    const numbered = !franchise.continuous && m.season != null;
    const label = numbered ? seasonLabel(m)! : titleOf(m.entry);
    items.push({
      id: m.entry.id,
      kind: numbered && m.part != null ? "part" : "season",
      label,
      title: titleOf(m.entry),
      seasonNumber: numbered ? m.season : null,
      partNumber: numbered ? m.part : null,
      year: startYear(m.entry),
      status: m.entry.status,
      episodeCount: m.entry.episodeCount,
      current: m.entry.id === currentId,
    });
  }
  let skipped = false;
  for (const m of franchise.others) {
    const kind = secondaryKind(m);
    if (!kind) {
      skipped = true;
      continue;
    }
    items.push({
      id: m.entry.id,
      kind,
      label: secondaryLabel(kind),
      title: titleOf(m.entry),
      seasonNumber: null,
      partNumber: null,
      year: startYear(m.entry),
      status: m.entry.status,
      episodeCount: m.entry.episodeCount,
      current: m.entry.id === currentId,
    });
  }
  return {
    items,
    currentIndex: items.findIndex((i) => i.current),
    truncated: franchise.truncated,
    hasMore: skipped || undated.length > 1,
  };
}
