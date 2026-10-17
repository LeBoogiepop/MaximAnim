import { ARTWORK_PALETTE as ART, TONE } from "@/config/app";

/**
 * RC10 borrows artwork hue at bounded lightness/chroma, never raw cover colour behind text.
 * The original rose-biased helpers remain for legacy consumers; renovated pages use the cached artwork palette.
 */

export interface Tone {
  /** Safe as text, a line or a small fill on the ink background. */
  accent: string;
  /** The hero glow: the accent at a low opacity. */
  glow: string;
  /** The accent at a whisper, for a quiet fill (an active row, a selected season). */
  soft: string;
  /** Text colour that reads on a surface filled with `accent`. */
  on: string;
}

const INK = "#0d0e12";
const PAPER = "#f4f1ea";
const ROSE = "#f2768d";

type Rgb = [number, number, number];
type Oklch = { l: number; c: number; h: number };

function parseHex(color: string): Rgb | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return null;
  const h = m[1]!.length === 3 ? [...m[1]!].map((c) => c + c).join("") : m[1]!;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

const toLinear = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

/** sRGB → OKLCH (Björn Ottosson's OKLab). */
function toOklch([r, g, b]: Rgb): Oklch {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}

/** OKLCH → linear sRGB, unclamped (so the caller can tell whether it is inside the gamut). */
function toLinearRgb({ l, c, h }: Oklch): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_, -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_, -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_];
}

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);

function toHex(color: Oklch): string {
  // Gamut-mapped by reducing chroma (never by clipping, which would shift the hue).
  let c = color.c;
  let rgb = toLinearRgb({ ...color, c });
  for (let i = 0; i < 40 && !inGamut(rgb); i++) {
    c *= 0.94;
    rgb = toLinearRgb({ ...color, c });
  }
  return `#${rgb.map((v) => Math.round(Math.min(1, Math.max(0, fromLinear(Math.min(1, Math.max(0, v))))) * 255).toString(16).padStart(2, "0")).join("")}`;
}

/** WCAG relative luminance and contrast ratio. */
function luminance([r, g, b]: Rgb): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(a: string, b: string): number {
  const [x, y] = [parseHex(a), parseHex(b)];
  if (!x || !y) return 1;
  const [hi, lo] = [Math.max(luminance(x), luminance(y)), Math.min(luminance(x), luminance(y))];
  return (hi + 0.05) / (lo + 0.05);
}

function toneOf(accent: string): Tone {
  const rgb = parseHex(accent)!;
  return {
    accent,
    glow: `rgba(${rgb.join(", ")}, ${TONE.glowAlpha})`,
    soft: `rgba(${rgb.join(", ")}, ${TONE.softAlpha})`,
    on: contrastRatio(accent, INK) >= contrastRatio(accent, PAPER) ? INK : PAPER,
  };
}

/** Rehydrate a bounded cached accent exactly, without a second gamut conversion. */
export function toneFromCachedAccent(accent: string): Tone | null {
  return /^#[a-f0-9]{6}$/i.test(accent) && contrastRatio(accent, INK) >= TONE.minContrastOnInk ? toneOf(accent) : null;
}

/** RC10 artwork hue, with bounded chroma/lightness rather than a raw dominant fill.
 * Warm paper/skin never becomes a loud orange interface; dark artwork gets a readable accent.
 */
export function toneFromArtwork(color: string | null | undefined): Tone {
  const rgb = color ? parseHex(color) : null;
  if (!rgb) return FALLBACK_TONE;
  const art = toOklch(rgb);
  if (art.c < TONE.minChroma) return toneOf(ART.neutral);
  const warm = art.h > ART.warmHueMin && art.h < ART.warmHueMax;
  return toneOf(toHex({ l: ART.lightness, c: Math.min(art.c, warm ? ART.warmMaxChroma : ART.maxChroma), h: art.h }));
}

/** A small deterministic chromatic histogram, not an average of skin, paper and ink.
 * Samples come from an already-loaded same-origin optimized cover; no remote fetch or dependency.
 */
export function toneFromPixels(pixels: ArrayLike<number>, fallback: string | null): Tone {
  const buckets = new Map<number, { weight: number; rgb: Rgb }>();
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3]! < ART.minAlpha) continue;
    const rgb: Rgb = [pixels[i]!, pixels[i + 1]!, pixels[i + 2]!];
    const c = toOklch(rgb);
    if (c.l < ART.sampleMinLightness || c.l > ART.sampleMaxLightness || c.c < ART.sampleMinChroma) continue;
    const skin = c.h > ART.warmHueMin && c.h < ART.skinHueMax;
    const weight = c.c * (skin ? ART.skinWeight : 1);
    const key = Math.floor(c.h / ART.hueBucketDegrees);
    const bucket = buckets.get(key) ?? { weight: 0, rgb: [0, 0, 0] };
    bucket.weight += weight;
    for (let n = 0; n < 3; n++) bucket.rgb[n] = bucket.rgb[n]! + rgb[n]! * weight;
    buckets.set(key, bucket);
  }
  const best = [...buckets.entries()].sort((a, b) => b[1].weight - a[1].weight || a[0] - b[0])[0]?.[1];
  // Artwork with no readable hue (muted, monochrome) and no metadata colour is neutral: the brand rose would be a colour it does not have.
  if (!best) return toneFromMetadata(fallback);
  const hex = `#${best.rgb.map(v => Math.round(v / best.weight).toString(16).padStart(2, "0")).join("")}`;
  return toneFromArtwork(hex);
}

export const FALLBACK_TONE: Tone = toneOf(ROSE);

/** What the page wears while the chosen season is still arriving: neither the previous season's colour nor the brand's, so no identity is mixed. */
export const NEUTRAL_TONE: Tone = toneOf(ART.neutral);

/**
 * What an entry wears before (or without) a pixel sample: the colour AniList declares for its cover, else neutral. An entry with no
 * declared colour (or an unreadable one) is not rose: the brand pink is for screens that are not about one work, and borrowing it for
 * artwork that has no such hue (Girls' Last Tour: a muted cover, `color: null`) reads as the wrong atmosphere.
 */
export function toneFromMetadata(color: string | null | undefined): Tone {
  return color && parseHex(color) ? toneFromArtwork(color) : NEUTRAL_TONE;
}

/** Batch A palette candidates, tied to entry ids so loading/caching cannot change them.
 * Subject to visual acceptance; unknown entries retain the brand rose. No colour extraction or stored-data change.
 */
const ANIME_PALETTES: Readonly<Record<number, string>> = {
  9253: "#b4c4df", // Steins;Gate: cool slate, never an orange wash.
  21127: "#b4c4df", // Steins;Gate 0.
  154587: "#b9cfbb", // Frieren: pale sage, used only as atmosphere/action.
};

export function toneForAnime(id: number): Tone {
  const accent = ANIME_PALETTES[id];
  return accent && contrastRatio(accent, INK) >= TONE.minContrastOnInk ? toneOf(accent) : FALLBACK_TONE;
}
const BRAND = toOklch(parseHex(ROSE)!);

/** The shortest signed arc from hue `a` to hue `b`, in degrees (−180…180). */
const arc = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180;

export function toneFromCover(color: string | null | undefined): Tone {
  const rgb = color ? parseHex(color) : null;
  if (!rgb) return FALLBACK_TONE;
  const cover = toOklch(rgb);
  // Grey, off-white or near-black covers have no hue worth borrowing.
  if (cover.c < TONE.minChroma) return FALLBACK_TONE;
  const accent = toHex({ l: BRAND.l, c: BRAND.c, h: (BRAND.h + arc(BRAND.h, cover.h) * TONE.hueShare + 360) % 360 });
  // Same lightness as the rose, so this should always hold; belt and braces.
  return contrastRatio(accent, INK) >= TONE.minContrastOnInk ? toneOf(accent) : FALLBACK_TONE;
}

/** A hex colour's OKLCH (lightness 0–1, chroma, hue in degrees); null when it does not parse. For tests and tooling. */
export function oklchOf(color: string): Oklch | null {
  const rgb = parseHex(color);
  return rgb ? toOklch(rgb) : null;
}
