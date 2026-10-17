import { MEDIA } from "@/config/media";

/**
 * The tallest a title logo may be, from its own proportions. Pure.
 *
 * A flat height cap makes the logos with a ratio between 2 and 3.3 the biggest things on the page (they hit the cap and are
 * still wide), while a wide wordmark is already bounded by the row. Bounding the drawn AREA as well gives every ratio about the
 * same visual weight: height = min(cap, sqrt(area / ratio)). A wide wordmark's value is above what its row allows, so it is unchanged.
 */
export function logoMaxHeightRem(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) return MEDIA.logoMaxHeightRem;
  return Math.min(MEDIA.logoMaxHeightRem, Math.sqrt(MEDIA.logoAreaRem2 / ratio));
}

/** Font-size factor for a typographic title: 1 up to a comfortable length, then smoothly smaller, down to a floor. Pure. */
export function titleScale(text: string): number {
  const length = [...text.trim()].length;
  if (length <= MEDIA.titleFullSizeChars) return 1;
  return Math.max(MEDIA.titleMinScale, Math.sqrt(MEDIA.titleFullSizeChars / length));
}

/**
 * A later season's title as « the franchise's name » + « which season », so the typographic title keeps the same words, the same size
 * and the same place from one season to the next (only the small line under it changes). `root` is the first season's title. Pure.
 * Not split when the title does not start with the root at a word boundary, has nothing after it, or what follows is not a short
 * qualifier (a different subtitle is not a season).
 */
export function splitSeasonTitle(title: string, root: string | null | undefined): { main: string; qualifier: string } | null {
  if (!root) return null;
  const full = title.trim(), base = root.trim();
  if (full.length <= base.length || !full.toLowerCase().startsWith(base.toLowerCase())) return null;
  const tail = full.slice(base.length);
  if (/^[\p{L}\p{N}]/u.test(tail)) return null;
  const qualifier = tail.replace(/^[\s:：\-–—·,]+/, "").trim();
  return qualifier && [...qualifier].length <= MEDIA.titleQualifierMaxChars ? { main: full.slice(0, base.length), qualifier } : null;
}
