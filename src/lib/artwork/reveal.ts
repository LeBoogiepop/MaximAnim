/**
 * Shared "no flash" technique, generalised from the Continuer posters: an image that is already decoded
 * (browser memory cache after a Back navigation, or painted before hydration) is shown at once, with no
 * opacity transition; only an image that really arrives late fades in over the colour that held its place.
 */
import { MEDIA } from "@/config/media";

const seen = new Set<string>();

/** Remember a successful presentation, not a promise that the browser still retains its decoded pixels. No pixels are held here. */
export function rememberArtwork(src: string): void {
  if (seen.has(src)) seen.delete(src);
  seen.add(src);
  if (seen.size > MEDIA.seenArtworkEntries) seen.delete(seen.values().next().value!);
}

export function hasSeenArtwork(src: string | null | undefined): boolean {
  return !!src && seen.has(src);
}

/**
 * The picture a season's hero revealed in this tab: the decision is made once per identity (an anime entry), so coming back to the
 * season shows the very same picture at once, and a catalogue answer that arrives later only ever serves a next visit. Memory only,
 * bounded: nothing here is user data and nothing is persisted.
 */
export interface HeroDecision { src: string; width: number; height: number; focus?: { x: number; y: number }; cors?: boolean }
const decisions = new Map<number, HeroDecision>();

export function rememberHeroDecision(entryId: number, decision: HeroDecision): void {
  decisions.delete(entryId);
  decisions.set(entryId, decision);
  if (decisions.size > MEDIA.seenArtworkEntries) decisions.delete(decisions.keys().next().value!);
}

/** The remembered picture of this entry, while its presentation record remains in our bounded URL set. */
export function recalledHeroDecision(entryId: number): HeroDecision | null {
  const decision = decisions.get(entryId);
  return decision && seen.has(decision.src) ? decision : null;
}

/** For tests. */
export function resetSeenArtwork(): void {
  seen.clear();
  decisions.clear();
}

/** The image element is already decoded and has pixels: nothing to wait for. */
export function isPainted(img: HTMLImageElement | null | undefined): boolean {
  return !!img && img.complete && img.naturalWidth > 0;
}
