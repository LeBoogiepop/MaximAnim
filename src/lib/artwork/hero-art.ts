import { RC10 } from "@/config/app";
import { HERO } from "@/config/media";
import type { Focus, FocusWindow } from "@/lib/artwork/focal";
import type { TmdbArtwork } from "@/lib/artwork/tmdb";

/**
 * Which picture a phone hero is drawn from, and how. Pure.
 *
 * A phone hero is a tall frame (one stage: the picture, the title or logo, the season row). A picture is only as good a hero as
 * the share of it that survives that frame: a 4.75:1 AniList banner cropped to a portrait frame shows ~20 % of its width — a hat,
 * half a face — while the same entry's cover is a poster whose whole composition fits. So the choice looks at what each real
 * picture would be IN the frame (visible share, enlargement), never only at which source it came from, and never invents a
 * resource: the candidates are the pictures MaximAnim already has for this very entry.
 */

/** `portrait`: a vertical picture a reviewed descriptor pinned (TMDB). `backdrop`: TMDB 16:9. `banner` / `cover`: AniList. */
export type HeroArtKind = "portrait" | "backdrop" | "banner" | "cover";
/** `poster`: full-bleed tall picture. `wide`: a wide picture cropped to the tall frame around its centre. `strip`: an ultra-wide banner
 *  as a short plate. `card`: a small picture shown as an object on the page's own ground, never enlarged into a backdrop. */
export type HeroClass = "poster" | "wide" | "strip" | "card";

export interface HeroSource {
  src: string;
  kind: HeroArtKind;
  /** Pixels when known (a TMDB answer, a decoded image). Unknown ones are assumed per kind until the image is decoded. */
  width?: number;
  height?: number;
}

export interface HeroFit {
  class: HeroClass;
  /** Width / height actually used (measured, else assumed). */
  ratio: number;
  /** Share of the picture's area that stays visible in the frame. */
  visible: number;
  /** Device pixels drawn per source pixel at 3x. */
  upscale: number;
}

const ASSUMED = {
  cover: { width: HERO.assumed.coverWidth, height: HERO.assumed.coverHeight },
  banner: { width: HERO.assumed.bannerWidth, height: HERO.assumed.bannerHeight },
  // TMDB sources always carry their size; these are only a type's last resort.
  backdrop: { width: 1280, height: 720 },
  portrait: { width: 1000, height: 1500 },
} as const;

/** The reference iPhone frame the choice is judged against (375 css px wide). The CSS then follows the real width. */
const REF_WIDTH = 375;
const frameHeight = () => REF_WIDTH * HERO.sceneRatio + HERO.refSafePx - HERO.plateInsetPx;
const stripHeight = () => HERO.refSafePx + REF_WIDTH * HERO.stripReach;

function size(source: HeroSource): { width: number; height: number } {
  const known = source.width && source.height && source.width > 0 && source.height > 0;
  return known ? { width: source.width!, height: source.height! } : ASSUMED[source.kind];
}

/** How a source would look in the phone frame, or null when it would not make a hero (a fragment, or too soft). */
export function fitHeroSource(source: HeroSource): HeroFit | null {
  const { width, height } = size(source);
  const ratio = width / height;
  const frame = { width: REF_WIDTH, height: frameHeight() };
  const scale = Math.max(frame.width / width, frame.height / height);
  const upscale = scale * 3;
  const visible = (frame.width * frame.height) / (scale * width * scale * height);
  if (ratio >= HERO.stripMinRatio) {
    // An ultra-wide banner: a short plate, enlarged to its own height.
    const plate = stripHeight() / height;
    return plate * 3 <= HERO.maxUpscale ? { class: "strip", ratio, visible: frame.width / (plate * width), upscale: plate * 3 } : null;
  }
  const usable = upscale <= HERO.maxUpscale && visible >= HERO.minVisible;
  if (ratio < HERO.posterMaxRatio) {
    if (usable) return { class: "poster", ratio, visible, upscale };
    // A small cover is still the entry's own poster: shown as an object, never enlarged into a backdrop.
    return source.kind === "cover" ? { class: "card", ratio, visible: 1, upscale: Math.min(upscale, 2) } : null;
  }
  return usable ? { class: "wide", ratio, visible, upscale } : null;
}

/** Preference among pictures that fit: a reviewed portrait, then a poster (cover), then wide pictures, then a strip, then a card. */
const PREFERENCE: Record<HeroClass, number> = { poster: 1, wide: 2, strip: 3, card: 4 };

/**
 * The phone candidates in the order they should be tried: the unusable ones are dropped (not "last": a fragment is worse than no
 * picture). `measured` carries sizes learnt once an image is decoded, so a cover that turns out small is rejected before it is
 * ever revealed.
 */
export function rankHeroSources(sources: readonly HeroSource[], measured: ReadonlyMap<string, { width: number; height: number }> = new Map()): { source: HeroSource; fit: HeroFit }[] {
  const ranked: { source: HeroSource; fit: HeroFit; order: number }[] = [];
  sources.forEach((source, index) => {
    const m = measured.get(source.src);
    const sized = m ? { ...source, width: m.width, height: m.height } : source;
    const fit = fitHeroSource(sized);
    if (fit) ranked.push({ source: sized, fit, order: (source.kind === "portrait" ? 0 : PREFERENCE[fit.class]) * 10 + index });
  });
  return ranked.sort((a, b) => a.order - b.order).map(({ source, fit }) => ({ source, fit }));
}

/** The pictures a phone or desktop hero may be drawn from for one entry, in the order the page lists them. */
export function heroSources(input: { cover: string | null; banner: string | null; artwork?: TmdbArtwork; desktop: boolean }): HeroSource[] {
  const { cover, banner, artwork, desktop } = input;
  const ready = artwork?.status === "ready" ? artwork : null;
  const out: HeroSource[] = [];
  if (!desktop && ready?.portrait) out.push({ src: ready.portrait.src, kind: "portrait", width: ready.portrait.width, height: ready.portrait.height });
  if (desktop) {
    // A wide frame: the verified backdrop, then the banner; the cover is only ever an object (card).
    if (ready?.backdrop) out.push({ src: ready.backdrop.src, kind: "backdrop", width: ready.backdrop.width, height: ready.backdrop.height });
    if (banner) out.push({ src: banner, kind: "banner" });
    if (cover) out.push({ src: cover, kind: "cover" });
    return out;
  }
  if (cover) out.push({ src: cover, kind: "cover" });
  if (ready?.backdrop) out.push({ src: ready.backdrop.src, kind: "backdrop", width: ready.backdrop.width, height: ready.backdrop.height });
  if (banner) out.push({ src: banner, kind: "banner" });
  return out;
}

/** The dissolve: smoothstep from opaque at `start` (0–1 of the plate) to transparent at the bottom edge, so it has no visible start or end. */
export function dissolveMask(start: number): string {
  const f0 = Math.min(0.95, Math.max(0.3, start));
  const stops: string[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const alpha = 1 - t * t * (3 - 2 * t);
    stops.push(`rgb(0 0 0 / ${alpha.toFixed(3)}) ${(f0 * 100 + (100 - f0 * 100) * t).toFixed(1)}%`);
  }
  return `linear-gradient(to bottom, #000 0, #000 ${(f0 * 100).toFixed(1)}%, ${stops.join(", ")})`;
}

/** The window of the picture the phone frame can show, for `findFocus`: poster = a band of full width, wide / strip = a band of full height. */
export function focusWindowFor(fit: HeroFit): FocusWindow | null {
  const frame = { width: REF_WIDTH, height: frameHeight() };
  if (fit.class === "poster") return { visibleX: 1, visibleY: Math.min(1, frame.height / (REF_WIDTH / fit.ratio)), opaque: HERO.fadeStart.poster };
  if (fit.class === "wide") return { visibleX: Math.min(1, frame.width / frame.height / fit.ratio), visibleY: 1, opaque: HERO.fadeStart.wide };
  if (fit.class === "strip") return { visibleX: Math.min(1, REF_WIDTH / (stripHeight() * fit.ratio)), visibleY: 1, opaque: HERO.fadeStart.strip };
  return null;
}

/**
 * `sizes` of a plate's <img>. A wide picture (a 16:9 backdrop) is cropped to the tall phone frame, so it is DRAWN wider than the
 * viewport (~1.96× at 375 px): asking for `100vw` fetched a rendition about half as wide as what was painted, soft on a 3× screen.
 * Only a wide plate on a phone changes; posters fill the width, and desktop has its own bound. Capped at 199vw (Next reads at most
 * three digits) and by the largest rendition the loader serves.
 */
export function plateSizes(fit: HeroFit, desktop: boolean): string {
  if (desktop || fit.class !== "wide") return RC10.heroImageSizes;
  const drawn = Math.ceil((fit.ratio * frameHeight()) / REF_WIDTH * 100);
  return `${Math.min(199, Math.max(100, drawn))}vw`;
}

/** Where a class starts to dissolve (share of the plate height) and how its picture is anchored inside the plate (around the focus when known). */
export function plateStyle(fit: HeroFit, focus?: Focus | null): { fadeStart: number; position: string } {
  const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;
  if (fit.class === "poster") return { fadeStart: HERO.fadeStart.poster, position: `50% ${focus ? pct(focus.y) : `${HERO.posterFocusY}%`}` };
  if (fit.class === "wide") return { fadeStart: HERO.fadeStart.wide, position: `${focus ? pct(focus.x) : "50%"} ${HERO.wideFocusY}%` };
  if (fit.class === "strip") return { fadeStart: HERO.fadeStart.strip, position: `${focus ? pct(focus.x) : "50%"} 50%` };
  return { fadeStart: HERO.fadeStart.poster, position: "50% 50%" };
}

/** The phone stage's numbers as CSS variables: the page, its loading state and the plate all read the SAME ones (nothing is duplicated in the CSS). */
export const heroStageVars = {
  "--hero-k": HERO.sceneRatio,
  "--hero-max-w": `${HERO.sceneMaxWidthRem}rem`,
  "--hero-inset": `${HERO.plateInsetPx}px`,
  "--hero-strip": HERO.stripReach,
} as Record<string, string | number>;
