/** Media-delivery thresholds (kept apart from app.ts so the media area owns its own numbers). */
export const MEDIA = {
  /** Source URLs remembered as "already loaded" for flash-free remounts. */
  seenArtworkEntries: 256,
  /**
   * How long the hero waits for the verified catalogue artwork before it paints the AniList banner it already has.
   * The catalogue answer is a server chain (mapping + up to 4 TMDB calls) that can take seconds when cold, but a CDN
   * hit is a few hundred ms: this is long enough to paint the verified backdrop first on a normal visit.
   * A slower answer is not discarded: the verified backdrop then cross-fades over the provisional banner.
   */
  heroCatalogueBudgetMs: 900,
  /**
   * The title never shows its typographic fallback before this: a skeleton holds its place so the logo, when it exists,
   * is the first thing drawn (no text-then-logo flash). Past it the readable title is final for the visit
   * and a still-later answer only warms the next one.
   */
  heroTitleBudgetMs: 3000,
  /**
   * Episode thumbnails hold a neutral frame (never the series banner or cover as a stand-in) until the exact-still sources have
   * answered or this budget ends, so a thumbnail is drawn once instead of showing a generic picture and then another.
   */
  thumbnailSettleBudgetMs: 1500,
  /** A season being fetched shows its stale details dimmed, and its episodes as placeholders, only after this long (a cached one never does). */
  staleContentDelayMs: 150,
  /** Persisted catalogue answers (localStorage) so a relaunch decides instantly. */
  storedArtworkEntries: 40,
  storedArtworkKey: "maxime-anime:tmdb-artwork:v1",
  /** Desktop: the sharp hero frame is clamped to this range (cropped only inside it); the rest is a softened copy of the same art. */
  heroMinRatio: 1.5,
  heroMaxRatio: 2.3,
  /** Assumed ratio of an AniList banner before its real size is known (they are ~1900x400). */
  bannerAssumedRatio: 4.75,
  /**
   * Title logos on a phone (`lib/artwork/title-fit.ts`). A logo is bounded by a height AND a visual area, so a stacked or
   * mid-ratio logo (the ones that used to hit a flat 6.75 rem height cap and read as a block) is smaller than before while a
   * wide wordmark, which the width of the row already bounds, is not touched. 82 rem² is about 21 000 css px².
   */
  logoMaxHeightRem: 5.75,
  logoAreaRem2: 82,
  /** Typographic titles (no logo): shrink with length, never below this fraction of the base size. About 30 characters fit at full size. */
  titleFullSizeChars: 30,
  titleMinScale: 0.78,
  /** A season qualifier (« Season 2 Part 2 », « Entertainment District Arc ») longer than this is a subtitle, not a season: the title is not split. */
  titleQualifierMaxChars: 42,
} as const;

/**
 * The phone hero (`lib/artwork/hero-art.ts`, `features/anime/AnimeHero.tsx`): ONE stage — the picture, the title or logo and the
 * season row — whose height does not depend on the picture, with ONE picture layer dissolved by a mask into the page's own black.
 */
export const HERO = {
  /** Stage height under the safe area, as a share of the (capped) stage width: tall enough for characters to be the subject, short enough that the season row and the first episodes stay on the first screen. */
  sceneRatio: 1,
  /** A tablet's stage is as wide as this at most: past it the picture is cropped, not stretched. */
  sceneMaxWidthRem: 34,
  /** The picture stops this far above the stage's bottom edge (it has dissolved by then). */
  plateInsetPx: 8,
  /** The iPhone safe area the reference frame is judged with (the page reads `env(safe-area-inset-top)`). */
  refSafePx: 47,
  /** Device pixels drawn per source pixel (at 3x) above which a picture is too soft to be a hero. */
  maxUpscale: 2.6,
  /** A picture must keep at least this share of its area inside the tall frame (a 4.75:1 banner keeps ~20 %: fragments). */
  minVisible: 0.42,
  /** Ratios: below `posterMaxRatio` a picture is a poster; from `stripMinRatio` an ultra-wide banner. */
  posterMaxRatio: 1.1,
  stripMinRatio: 2.2,
  /** Height of the strip plate (ultra-wide banner), as a share of the stage width, under the safe area. */
  stripReach: 0.57,
  /** Where the dissolve starts, as a share of the plate's height: below the faces, which sit around 25–55 %. */
  fadeStart: { poster: 0.74, wide: 0.72, strip: 0.78 },
  /** Vertical anchor of a poster / a wide picture inside its plate (%): biased to the top, where the faces are and an embedded title is not. */
  posterFocusY: 14,
  wideFocusY: 30,
  /** What an unmeasured image is assumed to be (AniList extraLarge cover, AniList banner). */
  assumed: { coverWidth: 460, coverHeight: 650, bannerWidth: 1900, bannerHeight: 400 },
  /** How long a cold hero waits for the catalogue (it may carry a reviewed vertical picture) before it commits to the cover. A later answer serves the next visit. */
  decisionBudgetMs: 250,
  /** Neutral stage → picture fade (ms). */
  revealMs: 220,
  /**
   * Choosing another season: the picture being left stays under the stage while the new one loads, the new one fades in over it
   * (`crossfadeMs`), and only then the old one fades out (`ghostFadeMs`, once the new one is opaque, so the two never add up to a dip
   * towards black). The old one is held at most `holdMs` after the new entry is on show: it is a transition, never a stand-in.
   */
  crossfadeMs: 200,
  ghostFadeMs: 140,
  holdMs: 1800,
} as const;
