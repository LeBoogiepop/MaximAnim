import { SUBTITLES } from "@/config/app";
import { SUBTITLE_LOWEST_LINE, subtitleLinePercent } from "./style";

/**
 * Subtitle height, applied on the cues the browser already parsed: `VTTCue.line`, never a CSS position and never a rebuilt
 * TextTrack. The files are converted once with `SUBTITLES.defaultCueLinePercent` on every ordinary cue (so cached
 * conversions and translations stay valid); the viewer's height only rewrites that number on the live cues.
 *
 * A cue is "ordinary" when it still carries one of the lines Maximanim writes (`line:<n>%,end`: percentage, bottom edge).
 * A cue that brought its own `line:` / `region:` / `vertical:` never matches and is left exactly as the file wrote it.
 */

/** Structural subset of a `VTTCue`: what is read and written here. */
export interface CueLike {
  snapToLines: boolean;
  line: number | "auto";
  lineAlign: string;
  /** The cue's text (lines separated by a newline), when the engine exposes it. */
  text?: string;
}

/**
 * Cues Maximanim placed itself: adopted the first time they are seen exactly where the conversion left them
 * (`defaultCueLinePercent`, percentage, bottom edge), and kept by identity from then on. A cue that arrives anywhere else —
 * a provider's own `line:80%,end`, say — is never adopted, even when its value happens to be one of the heights.
 */
const managed = new WeakSet<object>();

function isPlaceable(cue: unknown): cue is CueLike {
  return typeof cue === "object" && cue != null && "snapToLines" in cue && "line" in cue && "lineAlign" in cue;
}

export function isOrdinaryCue(cue: unknown): boolean {
  if (!isPlaceable(cue) || cue.snapToLines !== false || cue.lineAlign !== "end" || typeof cue.line !== "number") return false;
  if (managed.has(cue)) return true;
  if (cue.line !== SUBTITLES.defaultCueLinePercent) return false;
  managed.add(cue);
  return true;
}

/**
 * The line a cue really gets: the viewer's height, but never so high that a cue of three lines or more would leave the
 * picture (two lines always fit the highest step: see `SUBTITLES.height`).
 */
export function cueLineFor(cue: CueLike, wanted: number): number {
  const lines = typeof cue.text === "string" ? cue.text.split("\n").length : 1;
  if (lines <= 2) return wanted;
  return Math.min(SUBTITLE_LOWEST_LINE, Math.max(wanted, SUBTITLES.cueTopMargin + SUBTITLES.cueBlockShare * lines));
}

/** Moves every ordinary cue of `tracks` to the line of `height`; returns how many moved. Tracks whose cues are not loaded yet (null) are skipped. */
export function applyCueHeight(tracks: Iterable<{ cues: ArrayLike<unknown> | null }>, height: number): number {
  const wanted = subtitleLinePercent(height);
  let moved = 0;
  for (const track of tracks) {
    const cues = track.cues;
    if (!cues) continue;
    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      if (!isPlaceable(cue) || !isOrdinaryCue(cue)) continue;
      const line = cueLineFor(cue, wanted);
      if (cue.line === line) continue;
      cue.line = line;
      moved++;
    }
  }
  return moved;
}
