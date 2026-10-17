/**
 * Credits for the player, at two attribution levels that are never mixed:
 *  - `episode`: AniList itself wrote this episode number in the credit (« Storyboard (ep 5) »). Nothing else qualifies.
 *  - `series`: a general credit of the work (the director, the series composition, the music…), said about the series.
 * See docs/v1-credits-contract.md.
 */
export type CreditCategory = "original" | "direction" | "script" | "storyboard" | "characterDesign" | "animationDirection" | "artDirection" | "music" | "studio";

export type CreditLevel = "episode" | "series";

export interface CreditEntity {
  kind: "person" | "studio";
  /** AniList staff id or studio id: never invented. */
  id: number;
  name: string;
  nativeName: string | null;
  /** Maximanim page of the person / the studio. */
  href: string;
  /** What this entity did inside this category, said in French (« Réalisation d'épisode »). Empty for a studio. */
  roles: string[];
  /** AniList's own picture of this exact person (null for a studio, or when AniList has none). Verified at display time. */
  image: string | null;
}

export interface CreditGroup {
  category: CreditCategory;
  /** « Réalisation », « Scénario », « Storyboard »… */
  label: string;
  level: CreditLevel;
  entities: CreditEntity[];
  /** Entities beyond the per-group cap (not shown, reachable through « Tout le staff »). */
  more: number;
}

export interface WatchCredits {
  animeId: number;
  /** The episode asked for (1 for a film). */
  episode: number;
  /** Verified credits for THIS episode only. Empty when AniList names none for it: show nothing, never a placeholder. */
  episodeGroups: CreditGroup[];
  /** General credits of the series (or of the film). Never contains an episode-scoped credit. */
  seriesGroups: CreditGroup[];
  /** The work is a film / single item: the series credits are the credits of the film itself. */
  singleItem: boolean;
  /** Every staff page was read. False: the staff list is longer than what was loaded, so episode credits may exist beyond it. */
  complete: boolean;
  /** AniList names episodes in at least one credit of this work (an episode section is possible for some episodes). */
  hasEpisodeCredits: boolean;
}

/** A person as AniList's staff list gives them (merged or not, the builder merges). */
export interface StaffInput {
  id: number;
  name: string;
  nativeName: string | null;
  roles: readonly string[];
  image?: string | null;
}

export interface StudioInput {
  id: number;
  name: string;
  isMain: boolean;
  isAnimationStudio: boolean;
}
