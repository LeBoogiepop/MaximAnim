/**
 * How deep the user is inside the app's own history, so "Retour" can pop it — or, when the app was launched straight
 * onto a deep page (home-screen PWA, shared link, reload on a fresh tab), go to a sensible parent instead of popping out
 * of the app (in a standalone PWA that does nothing at all: the user is stuck).
 *
 * RC9.2: depth is no longer inferred from `history.length` (it does not grow on a push made after going back, so
 * Anime → Studio → Back → Work looked like « no history » and sent Back Home). Every history entry now carries its own
 * position, `__mxIdx`, written by the one place that creates entries: the pushState / replaceState of the page.
 *
 *   - pushState    → the new entry sits one above the current one;
 *   - replaceState → the entry keeps its position (a season switch, `router.replace`), whatever state the caller passes;
 *   - popstate     → the position is simply read back from the entry that became current (back, forward, swipe, reload).
 *
 * Next.js writes its own state object on every navigation, so the position is merged into whatever the caller passes
 * instead of being stored beside it. An entry without a position (created before the tracker, or by foreign code) counts
 * as the root: Back then goes to the parent route — never a dead button.
 */
import { NAVIGATION } from "@/config/app";

const KEY = "__mxIdx";
const ORIGIN = "__mxOrigin";
const TABS = ["/search", "/schedule", "/lists", "/history"];

/** Secondary destinations still own their history; the mobile dock represents Home. */
export function mobileNavigationTab(tab: string): string {
  return tab === "/lists" || tab === "/history" ? "/" : tab;
}

/** Origin belongs to each history entry, so Back/Forward and season replacement keep it. */
export function navigationTab(path: string, state?: Record<string, unknown> | null): string {
  if (path === "/settings" || path.startsWith("/settings/") || path.startsWith("/auth/")) return "/settings";
  const tab = TABS.find(t => path === t || path.startsWith(`${t}/`));
  if (tab) return tab;
  if (/^\/(anime|franchise|studio|person|work|watch)\//.test(path)) {
    return TABS.includes(String(state?.[ORIGIN])) ? String(state?.[ORIGIN]) : "/";
  }
  return "/";
}

let installed = false;
let restore: (() => void) | null = null;
type TabEntry = { id: string; href: string; index: number; y: number; tab: string };
const entries = new Map<number, TabEntry>();
const tabs = new Map<string, TabEntry[]>();
const commits = new Set<() => void>();
let restoringTab = false;
let pendingScroll: { href: string; y: number } | null = null;
let cancelScroll: (() => void) | null = null;

function remember(): void {
  const index = currentIndex();
  const tab = navigationTab(window.location.pathname, window.history.state);
  const previous = entries.get(index);
  const entry: TabEntry = { id: previous?.id ?? crypto.randomUUID(), href: window.location.pathname + window.location.search + window.location.hash, index, y: window.scrollY, tab };
  entries.set(index, entry);
  if (!restoringTab) {
    const trail = tabs.get(tab) ?? [];
    const known = trail.findIndex(e => e.id === entry.id);
    tabs.set(tab, [...(known < 0 ? trail : trail.slice(0, known)), entry].slice(-NAVIGATION.retainedEntries));
  }
}

/** Restore the real browser entry when possible: its parent, cached UI and scroll belong together. */
export async function restoreNavigationTab(tab: string, push: (href: string) => void, { root = false }: { root?: boolean } = {}): Promise<boolean> {
  installNavigationTracker();
  remember();
  const trail = tabs.get(tab);
  if (restoringTab) return true;
  if (!trail?.length) return false;
  // A second tap on the active tab returns to its existing root entry. Reuse
  // that entry (including Search's query), so Back keeps its real parent.
  const targetIndex = root ? trail.findLastIndex(entry => entry.href.split(/[?#]/)[0] === tab) : trail.length - 1;
  if (targetIndex < 0) return false;
  const target = trail[targetIndex]!;
  const targetTrail = trail.slice(0, targetIndex + 1);
  pendingScroll = { href: target.href, y: target.y };
  const live = entries.get(target.index);
  if (live?.id === target.id) {
    if (target.index !== currentIndex()) window.history.go(target.index - currentIndex());
    return true;
  }
  // A new navigation after Back discards the browser's forward branch. Rebuild
  // only the missing part of this tab through Next's public router, in order.
  restoringTab = true;
  try {
    const anchor = targetTrail.findLastIndex(e => entries.get(e.index)?.id === e.id);
    const rebuilt = targetTrail.slice(0, anchor + 1);
    if (anchor >= 0) {
      const entry = targetTrail[anchor]!;
      if (entry.index !== currentIndex()) await committed(() => window.history.go(entry.index - currentIndex()), entry.href);
    }
    for (const entry of targetTrail.slice(anchor + 1)) {
      if (window.location.pathname + window.location.search + window.location.hash !== entry.href) await committed(() => push(entry.href), entry.href);
      const restored = entries.get(currentIndex());
      if (restored) rebuilt.push(restored);
    }
    tabs.set(tab, rebuilt);
  } finally { restoringTab = false; }
  remember();
  return true;
}

function restoreScroll(): void {
  if (!pendingScroll || pendingScroll.href !== window.location.pathname + window.location.search + window.location.hash) return;
  const target = pendingScroll;
  pendingScroll = null;
  cancelScroll?.();
  const started = performance.now();
  let frame = 0;
  const cancel = () => {
    cancelAnimationFrame(frame);
    for (const name of ["pointerdown", "touchmove", "wheel", "keydown"]) window.removeEventListener(name, cancel);
  };
  const attempt = () => {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (max < target.y && performance.now() - started < NAVIGATION.restoreTimeoutMs) { frame = requestAnimationFrame(attempt); return; }
    window.scrollTo({ top: Math.min(target.y, max), behavior: "instant" });
    cancel();
  };
  for (const name of ["pointerdown", "touchmove", "wheel", "keydown"]) window.addEventListener(name, cancel, { once: true, passive: true });
  frame = requestAnimationFrame(attempt);
  cancelScroll = cancel;
}

function committed(navigate: () => void, href: string): Promise<void> {
  return new Promise(resolve => {
    const done = () => {
      if (window.location.pathname + window.location.search + window.location.hash !== href) return;
      clearTimeout(timer); commits.delete(done); resolve();
    };
    const timer = setTimeout(() => { commits.delete(done); resolve(); }, NAVIGATION.restoreTimeoutMs);
    commits.add(done);
    navigate();
  });
}

function readIndex(state: unknown): number | null {
  if (state && typeof state === "object" && KEY in state) {
    const value = (state as Record<string, unknown>)[KEY];
    if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  }
  return null;
}

/** The position of the entry the browser is on (0 = the first entry of this app session). */
function currentIndex(): number {
  return typeof window === "undefined" ? 0 : (readIndex(window.history.state) ?? 0);
}

function withIndex(data: unknown, index: number): unknown {
  // Primitive or null state (a bare `replaceState(null, …)`): wrap it so the position still survives.
  if (data && typeof data === "object") return { ...(data as Record<string, unknown>), [KEY]: index };
  return { [KEY]: index };
}

/** Wraps history.pushState / replaceState once and gives the first entry its position. Safe to call on every render. */
export function installNavigationTracker(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const history = window.history;
  const push = history.pushState.bind(history);
  const replace = history.replaceState.bind(history);
  const originals = { pushState: history.pushState, replaceState: history.replaceState };
  const pop = () => { remember(); for (const cb of commits) cb(); };
  window.addEventListener("popstate", pop);
  restore = () => { Object.assign(history, originals); window.removeEventListener("popstate", pop); };
  history.pushState = (data: unknown, unused: string, url?: string | URL | null) => {
    remember();
    const origin = navigationTab(window.location.pathname, history.state);
    for (const i of entries.keys()) if (i > currentIndex()) entries.delete(i);
    push({ ...(withIndex(data, currentIndex() + 1) as object), [ORIGIN]: origin }, unused, url);
    remember();
  };
  history.replaceState = (data: unknown, unused: string, url?: string | URL | null) => {
    // The position of the entry being replaced wins over anything the caller put (or forgot to put) in `data`.
    replace({ ...(withIndex(data, currentIndex()) as object), [ORIGIN]: history.state?.[ORIGIN] }, unused, url);
    remember();
  };
  // The entry the app opened on has no position yet.
  if (readIndex(history.state) == null) replace(withIndex(history.state, 0), "");
  remember();
}

/** Called once per route (pathname) change, including the first render. */
export function recordNavigation(): void {
  installNavigationTracker();
  remember();
  for (const cb of commits) cb();
  restoreScroll();
}

export function hasInAppHistory(): boolean {
  return currentIndex() > 0;
}

/** Tests only: puts the real history functions back and forgets the tracker. */
export function resetNavigation(): void {
  restore?.();
  restore = null;
  installed = false;
  entries.clear(); tabs.clear(); commits.clear(); restoringTab = false;
  pendingScroll = null; cancelScroll?.(); cancelScroll = null;
}
