import { EXTERNAL_SUBTITLES } from "@/config/app";
import { cuesOf, parseVttCues } from "../vtt-cues";

/**
 * Timing helpers for external tracks, on the WebVTT the player already gets (after `toWebVtt`). Text-only maths:
 * - `shiftVtt`: the manual ±0.5 s offset, rewriting only the timing lines;
 * - `lastCueEnd`: input of the gross-duration gate;
 * - `estimateShift`: optional subtitle-to-subtitle alignment on the video source's own English track
 *   (same idea as ffsubsync's subtitle reference, without Pyodide: correlate when speech is on). Quality-gated:
 *   a weak alignment returns null and the file is left exactly as it was.
 * No time-stretch, no audio.
 */

const TIMING = /^(\s*)(?:(\d+):)?(\d{1,2}):(\d{2})\.(\d{3})(\s*-->\s*)(?:(\d+):)?(\d{1,2}):(\d{2})\.(\d{3})(.*)$/;

export interface CueSpan {
  start: number;
  end: number;
}

function seconds(h: string | undefined, m: string, s: string, ms: string): number {
  return Number(h ?? 0) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
}

function clock(total: number): string {
  const ms = Math.round(total * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
}

/** Every cue's start/end, in seconds, file order. */
export function cueSpans(vtt: string): CueSpan[] {
  const out: CueSpan[] = [];
  for (const cue of cuesOf(parseVttCues(vtt))) {
    const m = TIMING.exec(cue.head[cue.head.length - 1]!);
    if (m) out.push({ start: seconds(m[2], m[3]!, m[4]!, m[5]!), end: seconds(m[7], m[8]!, m[9]!, m[10]!) });
  }
  return out;
}

export function lastCueEnd(vtt: string): number | null {
  const spans = cueSpans(vtt);
  return spans.length ? Math.max(...spans.map((s) => s.end)) : null;
}

/**
 * The file with every cue moved by `delta` seconds (positive = later). Settings after the timings, ids, NOTE / STYLE
 * blocks and texts are untouched; a cue pushed entirely before 0 is removed, one straddling 0 starts at 0.
 */
export function shiftVtt(vtt: string, delta: number): string {
  if (!delta) return vtt;
  return parseVttCues(vtt)
    .blocks.map((b) => {
      if (b.kind === "raw") return b.text;
      const timing = b.head[b.head.length - 1]!;
      const m = TIMING.exec(timing);
      if (!m) return [...b.head, b.text].join("\n");
      const end = seconds(m[7], m[8]!, m[9]!, m[10]!) + delta;
      if (end <= 0.001) return "";
      const start = Math.max(0, seconds(m[2], m[3]!, m[4]!, m[5]!) + delta);
      const head = [...b.head.slice(0, -1), `${m[1]}${clock(start)}${m[6]}${clock(end)}${m[11]}`];
      return [...head, b.text].join("\n");
    })
    .join("");
}

export interface ShiftEstimate {
  /** Seconds to add to the target so it lines up with the reference. */
  shift: number;
  /** 0..1: how much better the peak is than a typical shift. */
  confidence: number;
  /** How much better the peak is than leaving the file as it is. */
  gain: number;
}

function activity(spans: readonly CueSpan[], step: number, length: number): Float32Array {
  const bins = new Float32Array(length);
  for (const { start, end } of spans) {
    const from = Math.max(0, Math.floor(start / step));
    const to = Math.min(length - 1, Math.ceil(end / step));
    for (let i = from; i <= to; i++) bins[i] = 1;
  }
  return bins;
}

/**
 * Where does `target` sit against `reference`? Cosine similarity of the two "someone is speaking" signals for every
 * shift within ±maxShift. Needs enough cues on both sides and a clear peak; returns null otherwise (and when the
 * best shift is negligible), so a doubtful alignment is never applied.
 */
export function estimateShift(reference: readonly CueSpan[], target: readonly CueSpan[], options: Partial<typeof EXTERNAL_SUBTITLES.align> = {}): ShiftEstimate | null {
  const { maxShiftSeconds, stepSeconds, minCues, minConfidence, minGain, minShiftSeconds } = { ...EXTERNAL_SUBTITLES.align, ...options };
  if (reference.length < minCues || target.length < minCues) return null;
  const horizon = Math.max(...reference.map((c) => c.end), ...target.map((c) => c.end)) + maxShiftSeconds;
  const length = Math.ceil(horizon / stepSeconds) + 1;
  const a = activity(reference, stepSeconds, length);
  const b = activity(target, stepSeconds, length);
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < length; i++) {
    sumA += a[i]!;
    sumB += b[i]!;
  }
  if (!sumA || !sumB) return null;
  const norm = Math.sqrt(sumA * sumB);
  const maxBins = Math.round(maxShiftSeconds / stepSeconds);
  const scores: number[] = [];
  let best = { bins: 0, score: -1 };
  let zero = 0;
  for (let bins = -maxBins; bins <= maxBins; bins++) {
    let overlap = 0;
    // target moved later by `bins`: target[i] meets reference[i + bins].
    const from = Math.max(0, -bins);
    const to = Math.min(length, length - bins);
    for (let i = from; i < to; i++) if (b[i]! && a[i + bins]!) overlap++;
    const score = overlap / norm;
    scores.push(score);
    if (bins === 0) zero = score;
    if (score > best.score) best = { bins, score };
  }
  const sorted = [...scores].sort((x, y) => x - y);
  const median = sorted[Math.floor(sorted.length / 2)]!;
  const confidence = best.score <= median ? 0 : (best.score - median) / (1 - median);
  const gain = best.score - zero;
  const shift = Math.round(best.bins * stepSeconds * 1000) / 1000;
  if (Math.abs(shift) < minShiftSeconds || confidence < minConfidence || gain < minGain) return null;
  return { shift, confidence, gain };
}

/** Clamp the viewer's offset to its bound, on the button grid. */
export function clampOffset(seconds: number): number {
  const bound = EXTERNAL_SUBTITLES.offsetMaxSeconds;
  return Math.max(-bound, Math.min(bound, Math.round(seconds * 10) / 10));
}
