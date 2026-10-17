import type { Franchise, TitlePreference } from "@/types/anime";
import { tmdbLogo, type TmdbArtwork } from "./tmdb";

/**
 * Which entry's logo a season without a logo of its own may show: the first season of its franchise, and only when the logo
 * that entry holds is the show's own (`logoScope: "series"`, decided server-side). Pure.
 *
 * Policy, in order: the entry's own verified logo; else the franchise's common logo, when it is verified as the show's;
 * else the typographic title. Never a logo pinned for one part (Bleach 2004's flame logo is not Thousand-Year Blood War's; a
 * film's logo is not a season's), never for a film or a special, never from an entry in the middle of the chain, and
 * never when the walk was cut short (the earliest entry may then not be the real first one).
 */
export function franchiseLogoRoot(franchise: Franchise, resolved: boolean, entryId: number): number | null {
  if (!resolved || franchise.truncated || franchise.main.length < 2) return null;
  const root = franchise.main[0]?.entry;
  if (!root || root.id === entryId || !franchise.main.some(m => m.entry.id === entryId)) return null;
  return root.id;
}

/** The common logo of the franchise, from the answer for its first season. */
export function inheritedLogo(rootArtwork: TmdbArtwork | undefined, rootId: number | null, preference: TitlePreference) {
  if (rootId == null || !rootArtwork || rootArtwork.animeId !== rootId || rootArtwork.status !== "ready" || rootArtwork.logoScope !== "series") return null;
  return tmdbLogo(rootArtwork, preference);
}
