/**
 * Local timing marks for the tap → first frame path. Developer diagnostics only:
 * nothing leaves the device, and outside `next dev` / developer mode every call
 * is a no-op (one cheap check). Events live in a small ring buffer that the
 * Diagnostic screen reads.
 */
import { isDeveloperMode } from "@/lib/dev-mode";

export type PerfStage =
  | "tap"
  | "route"
  | "content"
  | "pick"
  | "match"
  | "episodes"
  | "stream"
  | "relay"
  | "video-metadata"
  | "first-frame"
  | "subs-source"
  | "subs-external"
  | "hunt"
  | "lane"
  | "prefetch";

export interface PerfEvent {
  id: number;
  /** performance.now() when the event was recorded. */
  at: number;
  stage: PerfStage;
  /** What it was about: a route, `anime:episode`, a provider id… */
  scope: string;
  /** Duration of the span, or the delay since the tap for `route` / `content`. */
  ms?: number;
  note?: string;
}

/** Events kept; older ones fall off. */
const RING_SIZE = 300;
/** A tap older than this is not what caused the route/content change we see now. */
const TAP_RELEVANCE_MS = 8_000;

const ring: PerfEvent[] = [];
const listeners = new Set<() => void>();
let snapshot: readonly PerfEvent[] = [];
let nextId = 1;
let lastTap: { at: number; scope: string } | null = null;

export function perfEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || isDeveloperMode();
}

function push(event: Omit<PerfEvent, "id" | "at"> & { at?: number }): void {
  ring.push({ id: nextId++, at: event.at ?? performance.now(), stage: event.stage, scope: event.scope, ms: event.ms, note: event.note });
  if (ring.length > RING_SIZE) ring.splice(0, ring.length - RING_SIZE);
  snapshot = [...ring];
  for (const l of listeners) l();
}

/** A point event. */
export function mark(stage: PerfStage, scope: string, note?: string): void {
  if (!perfEnabled()) return;
  push({ stage, scope, note });
}

/** A span: call the returned function when the work ends. */
export function span(stage: PerfStage, scope: string): (note?: string) => void {
  if (!perfEnabled()) return noop;
  const t0 = performance.now();
  let ended = false;
  return (note) => {
    if (ended) return;
    ended = true;
    push({ stage, scope, ms: Math.round(performance.now() - t0), note });
  };
}

/** Times an async step; the result (or error) passes through untouched. */
export async function timed<T>(stage: PerfStage, scope: string, work: () => Promise<T>): Promise<T> {
  const end = span(stage, scope);
  try {
    const value = await work();
    end();
    return value;
  } catch (e) {
    end("échec");
    throw e;
  }
}

const noop = () => undefined;

/** The finger went down on a link: the clock for tap → route → content. */
export function markTap(href: string): void {
  if (!perfEnabled()) return;
  lastTap = { at: performance.now(), scope: href };
  push({ stage: "tap", scope: href, at: lastTap.at });
}

function sinceTap(): number | undefined {
  if (!lastTap) return undefined;
  const ms = performance.now() - lastTap.at;
  return ms <= TAP_RELEVANCE_MS ? Math.round(ms) : undefined;
}

/** The pathname changed; a double rAF later the new route has had a chance to paint. */
export function markRoute(pathname: string): void {
  if (!perfEnabled()) return;
  push({ stage: "route", scope: pathname, ms: sinceTap(), note: "route" });
  if (typeof requestAnimationFrame !== "function") return;
  requestAnimationFrame(() => requestAnimationFrame(() => push({ stage: "route", scope: pathname, ms: sinceTap(), note: "visible" })));
}

/** First useful content of a screen (first query succeeded). */
export function markContent(scope: string): void {
  if (!perfEnabled()) return;
  push({ stage: "content", scope, ms: sinceTap() });
}

export function getPerf(): readonly PerfEvent[] {
  return snapshot;
}

export function subscribePerf(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearPerf(): void {
  ring.length = 0;
  snapshot = [];
  lastTap = null;
  for (const l of listeners) l();
}
