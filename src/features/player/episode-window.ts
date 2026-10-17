/**
 * The maths of the windowed episode list: which rows exist in the DOM, where
 * to scroll to bring one into view, and what « Aller à l'épisode » accepts.
 * Pure, so a 1 200-episode series is tested without a browser.
 */

export interface RowWindow {
  /** First and last (exclusive) row to render. */
  start: number;
  end: number;
}

export function visibleWindow(scrollTop: number, viewport: number, total: number, rowHeight: number, overscan: number): RowWindow {
  if (total <= 0 || rowHeight <= 0) return { start: 0, end: 0 };
  const top = Math.max(0, scrollTop);
  const first = Math.floor(top / rowHeight);
  const last = Math.ceil((top + Math.max(0, viewport)) / rowHeight);
  return { start: Math.max(0, first - overscan), end: Math.min(total, last + overscan) };
}

/** scrollTop that centres row `index` (clamped to the list). */
export function scrollTopFor(index: number, viewport: number, total: number, rowHeight: number): number {
  const max = Math.max(0, total * rowHeight - viewport);
  return Math.min(max, Math.max(0, index * rowHeight - (viewport - rowHeight) / 2));
}

/**
 * « Aller à l'épisode »: "400", " 12 ", "12.5" → the listed episode with that
 * number, else null. Never a guess at the nearest one.
 */
export function findEpisodeNumber<T extends { number: number }>(list: readonly T[], input: string): T | null {
  const text = input.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const n = Number(text);
  return list.find((e) => e.number === n) ?? null;
}
