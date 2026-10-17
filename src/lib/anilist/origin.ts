import type { Anime, MediaSource } from "@/types/anime";

/**
 * AniList tags many films and OVAs of an adapted franchise as `ORIGINAL`, because their story is not in the source work. That is
 * not « an original work »: the franchise IS an adaptation. This only qualifies what AniList says with what AniList's own
 * relations say about the neighbours (a direct relation whose source is an adaptation). It never replaces a source, never
 * walks the graph, and an entry without such a neighbour stays exactly as AniList states it. Pure.
 */
const NOT_A_SOURCE_WORK = new Set<MediaSource | null>(["ORIGINAL", "OTHER", "ANIME", null]);

const FRANCHISE_TIES = new Set<string>(["PREQUEL", "SEQUEL", "SIDE_STORY", "SPIN_OFF", "PARENT"]);

export interface FranchiseOrigin {
  /** The source of the adapted franchise next to this entry (« MANGA », « LIGHT_NOVEL »…). */
  source: MediaSource;
}

/** Non-null only for an entry tagged ORIGINAL that sits directly beside an entry adapted from a source work. */
export function unreleasedStoryOf(anime: Pick<Anime, "source" | "relations">): FranchiseOrigin | null {
  if (anime.source !== "ORIGINAL") return null;
  for (const relation of anime.relations) {
    // OTHER / ALTERNATIVE are crossovers and shared-character links, not a story belonging to the adapted franchise.
    if (!FRANCHISE_TIES.has(relation.type)) continue;
    const source = relation.anime.source ?? null;
    if (!NOT_A_SOURCE_WORK.has(source)) return { source: source! };
  }
  return null;
}
