import { ui } from "@/lib/i18n/translate";
import { SUBTITLES } from "@/config/app";

/**
 * How subtitles look inline: presets rendered by the engine's own `::cue` (see globals.css), plus a size and a height.
 * Four looks are offered (RC9): Lisible (the default for a new profile) = white, bold, a firm outline, no box;
 * Cinéma = warm cream, a heavy black outline, no box; Contraste = white on a compact translucent black backing, for
 * bright scenes; Standard = neutral white, medium weight, a thin outline, no box. RC9.1: the looks share ONE base size, so
 * a look changes colour, weight, outline or backing and the size slider alone changes size. The stored keys never change (saved preferences and
 * backups): `cinema` reads « Standard » (it always did), `readable` « Lisible », `film` « Cinéma », `contrast`
 * « Contraste ». `minimal` (« Discret ») is no longer offered, but a backup or a synced profile that holds it still
 * reads, and still renders, exactly as before.
 */
export const SUBTITLE_STYLES = ["cinema", "readable", "minimal", "film", "contrast"] as const;

export type SubtitleStyle = (typeof SUBTITLE_STYLES)[number];

/** What the look sheet offers a viewer, in order. `minimal` is only listed while it is the stored choice. */
export const SUBTITLE_STYLE_CHOICES: readonly SubtitleStyle[] = ["readable", "film", "contrast", "cinema"];

/** What a NEW profile starts with (the preset the viewer preferred on a real iPhone). A look already chosen is never changed; a backup without the field restores as `cinema`, as before. */
export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = "readable";

export const SUBTITLE_STYLE_LABELS: Record<SubtitleStyle, string> = { cinema: "Standard", get readable() { return ui("Lisible"); }, get minimal() { return ui("Discret"); }, get film() { return ui("Cinéma"); }, get contrast() { return ui("Contraste"); } };

/** A stored value read back (a sync, a backup, an old device): a known look, else the one a profile without the field always had. */
export function normalizeSubtitleStyle(value: unknown): SubtitleStyle {
  return typeof value === "string" && (SUBTITLE_STYLES as readonly string[]).includes(value) ? (value as SubtitleStyle) : "cinema";
}

const SIZE_MAX = SUBTITLES.size.multipliers.length - 1;
const HEIGHT_MAX = SUBTITLES.height.lines.length - 1;

/** The stored size index, whatever arrived (a sync, a backup): an integer inside the steps, else the default. */
export function clampSubtitleSize(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= SIZE_MAX ? value : SUBTITLES.size.default;
}

export function clampSubtitleHeight(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= HEIGHT_MAX ? value : SUBTITLES.height.default;
}

export const SUBTITLE_SIZE_MAX = SIZE_MAX;
export const SUBTITLE_HEIGHT_MAX = HEIGHT_MAX;

const indices = (n: number) => Array.from({ length: n }, (_, i) => i);

/**
 * Stored size indices from the smallest to the largest, and height indices from the lowest to the highest on the picture:
 * what a slider walks. The stored index never moves (RC9.1 appended the new extremes), so the slider position is the
 * index's rank here, not the index itself.
 */
export const SUBTITLE_SIZE_STEPS: readonly number[] = indices(SIZE_MAX + 1).sort((a, b) => SUBTITLES.size.multipliers[a]! - SUBTITLES.size.multipliers[b]!);
export const SUBTITLE_HEIGHT_STEPS: readonly number[] = indices(HEIGHT_MAX + 1).sort((a, b) => SUBTITLES.height.lines[b]! - SUBTITLES.height.lines[a]!);

/** The lowest WebVTT line a cue may be given (the bottom of the height range). */
export const SUBTITLE_LOWEST_LINE = Math.max(...SUBTITLES.height.lines);

export function subtitleSizeMultiplier(size: number): number {
  return SUBTITLES.size.multipliers[clampSubtitleSize(size)]!;
}

/** The WebVTT `line` percentage (bottom edge of the cue) of a stored height. */
export function subtitleLinePercent(height: number): number {
  return SUBTITLES.height.lines[clampSubtitleHeight(height)]!;
}

// ------------------------------------------------------------------------------------------------ contour (RC9.2)

const OUTLINE_MAX = SUBTITLES.outline.radii.length - 1;

/** The stored contour read back (a sync, a backup, an old device): an index inside the steps, else null = « the look's own ». */
export function clampSubtitleOutline(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= OUTLINE_MAX ? value : null;
}

export const SUBTITLE_OUTLINE_MAX = OUTLINE_MAX;

/** A look drawn on a backing (Contraste) or legacy (Discret) has no ring: the contour does not apply to it. */
export function outlineApplies(style: SubtitleStyle): boolean {
  return style !== "contrast" && style !== "minimal";
}

/** The step that really applies: the viewer's own when set, else the look's default. */
export function effectiveOutline(style: SubtitleStyle, stored: number | null | undefined): number {
  return clampSubtitleOutline(stored) ?? SUBTITLES.outline.defaults[normalizeSubtitleStyle(style)];
}

/** Standard keeps one short, clean drop under the text whatever its ring (« almost no outline, a short dark shadow only »). */
const SHORT_DROP = "0 1px 2px rgba(0, 0, 0, 0.9)";

/**
 * The crisp ring: hard, unblurred shadows on a circle of `radius` px, enough of them that no gap shows at that radius. Never a
 * blur, never a stack of glows — a black edge the width the viewer chose. The one source of the strings in globals.css
 * (`::cue` rules, checked by a test) and of the preview.
 */
export function ringShadow(radius: number): string {
  if (radius <= 0) return "none";
  const count = radius <= 1.1 ? 8 : radius <= 2 ? 12 : 16;
  const r = (n: number) => `${Math.round(n * 100) / 100}px`.replace(/^-0px$/, "0px");
  const shadows = Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count;
    return `${r(Math.cos(angle) * radius)} ${r(Math.sin(angle) * radius)} 0 #000`;
  });
  return shadows.join(", ");
}

/** The `text-shadow` of a look at a contour step; null when the look has none of its own (Contraste, Discret: their own rule). */
export function cueTextShadow(style: SubtitleStyle, outline: number): string | null {
  if (!outlineApplies(style)) return null;
  const radius = SUBTITLES.outline.radii[Math.min(Math.max(0, outline), OUTLINE_MAX)]!;
  const ring = ringShadow(radius);
  if (style === "cinema") return ring === "none" ? SHORT_DROP : `${ring}, ${SHORT_DROP}`;
  return ring;
}
