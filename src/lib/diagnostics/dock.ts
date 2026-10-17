import { DOCK_DIAGNOSTICS } from "@/config/app";

export interface DockRecorder { freeze: () => string }
export type DockWindow = Window & { __mxDockDiagnostic?: DockRecorder };

/**
 * Serialized into the root's beforeInteractive script. Keep this function
 * self-contained: only browser APIs and the explicit arguments are available.
 * No DOM/style writes, focus, scrolling, click simulation or network requests.
 */
export function startDockDiagnostic(config: typeof DOCK_DIAGNOSTICS, sha: string) {
  try { if (localStorage.getItem(config.enabledKey) !== "1") return; } catch { return; }
  const target = window as DockWindow;
  if (target.__mxDockDiagnostic) return;

  const start = performance.now();
  let stopped = false;
  let firstInteractionAt: number | null = null;
  let lastPersisted = -Infinity;
  let frame = 0;
  let startupFrame = 0;
  const pending: { name: string; atMs: number }[] = [];
  const disposers: (() => void)[] = [];
  const samples: { reason: string; [key: string]: unknown }[] = [];
  const capture = { sha, startedAt: new Date().toISOString(), firstInteractionAt: null as number | null, samples };
  let previous: object[] = [];
  try {
    const stored = JSON.parse(localStorage.getItem(config.reportKey) ?? "null");
    if (stored?.schema === 1 && Array.isArray(stored.captures)) previous = stored.captures.slice(-(config.maxCaptures - 1));
  } catch { /* An unreadable old recording never prevents a new one. */ }
  const report = { schema: 1, captures: [...previous, capture] };
  const persist = (force = false) => {
    if (!force && performance.now() - lastPersisted < config.persistIntervalMs) return;
    try { localStorage.setItem(config.reportKey, JSON.stringify(report)); lastPersisted = performance.now(); } catch { /* The in-memory report can still be copied. */ }
  };
  const measure = (reason: string, events: { name: string; atMs: number }[] = []) => {
    if (stopped) return;
    const dock = document.querySelector(".app-navigation");
    const style = dock ? getComputedStyle(dock) : null;
    const rect = dock?.getBoundingClientRect();
    const home = document.querySelector(".home-screen.safe-top");
    const root = getComputedStyle(document.documentElement);
    const viewport = window.visualViewport;
    const active = document.activeElement;
    const tag = active?.tagName ?? "BODY";
    samples.push({
      at: new Date().toISOString(), atMs: performance.now() - start, reason, events,
      beforeFirstInteraction: firstInteractionAt === null,
      readyState: document.readyState,
      innerHeight: window.innerHeight, clientHeight: document.documentElement.clientHeight,
      screen: { height: window.screen.height, width: window.screen.width, availHeight: window.screen.availHeight },
      visualViewport: viewport ? { height: viewport.height, offsetTop: viewport.offsetTop, scale: viewport.scale } : null,
      standalone: { navigator: (navigator as Navigator & { standalone?: boolean }).standalone === true, media: window.matchMedia("(display-mode: standalone)").matches },
      scroll: { x: window.scrollX, y: window.scrollY },
      // Read-only geometry distinguishes a web-view resize from document or
      // nested-scroll overflow. No measuring element is inserted.
      document: {
        root: { scrollHeight: document.documentElement.scrollHeight, overflowY: root.overflowY, height: root.height },
        body: document.body ? { scrollHeight: document.body.scrollHeight, clientHeight: document.body.clientHeight, overflowY: getComputedStyle(document.body).overflowY, height: getComputedStyle(document.body).height } : null,
        scrollingElement: document.scrollingElement?.tagName ?? null,
      },
      // Never store input contents, names/ids, URLs, titles, key values or event targets.
      focus: { tag: ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A", "BODY", "HTML"].includes(tag) ? tag : "OTHER", editable: Boolean(active instanceof HTMLElement && active.isContentEditable) },
      dock: rect && style ? {
        rect: { x: rect.x, y: rect.y, top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height },
        position: style.position, top: style.top, bottom: style.bottom,
        padding: { top: style.paddingTop, right: style.paddingRight, bottom: style.paddingBottom, left: style.paddingLeft },
        marginBottom: style.marginBottom, transform: style.transform, visibility: style.visibility,
        // The dock CSS uses --safe-bottom directly as padding-bottom. Read that
        // resolved value; inserting a measuring probe could perturb the layout.
        safeArea: {
          topViaHomePadding: home ? getComputedStyle(home).paddingTop : null,
          bottomViaDockPadding: style.paddingBottom, leftViaDockPadding: style.paddingLeft, rightViaDockPadding: style.paddingRight,
          rawBottom: root.getPropertyValue("--safe-bottom").trim(), rawTop: root.getPropertyValue("--safe-top").trim(),
        },
      } : null,
    });
    if (samples.length > config.maxSamples) {
      const discard = samples.findIndex((sample, index) => index >= config.retainedInitialSamples && !["before-first-interaction", "after-first-interaction"].includes(sample.reason));
      samples.splice(discard, 1);
    }
    persist(reason === "dock-available" || reason === "before-first-interaction" || reason === "after-first-interaction");
  };
  const schedule = (name: string) => {
    if (stopped) return;
    if (pending.length < config.maxSamples) pending.push({ name, atMs: performance.now() - start });
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; measure("events", pending.splice(0)); });
  };
  const listen = (on: EventTarget, name: string, callback: EventListener) => {
    on.addEventListener(name, callback, { capture: true, passive: true });
    disposers.push(() => on.removeEventListener(name, callback, { capture: true }));
  };
  const first = () => {
    if (firstInteractionAt !== null || stopped) return;
    measure("before-first-interaction");
    firstInteractionAt = performance.now() - start;
    capture.firstInteractionAt = firstInteractionAt;
    persist(true);
    requestAnimationFrame(() => {
      measure("after-first-interaction");
      requestAnimationFrame(() => measure("after-first-interaction"));
    });
  };
  for (const name of ["pointerdown", "touchstart", "keydown"]) listen(document, name, first);
  for (const name of ["pointerup", "click", "focusin", "focusout"]) listen(document, name, () => schedule(name));
  for (const name of ["resize", "scroll", "orientationchange", "pageshow"]) listen(window, name, () => schedule(name));
  for (const name of ["resize", "scroll"]) if (window.visualViewport) listen(window.visualViewport, name, () => schedule("visualViewport:" + name));
  listen(document, "visibilitychange", () => { measure("visibility:" + document.visibilityState); persist(true); });
  listen(window, "pagehide", () => { measure("pagehide"); persist(true); });

  const initialFrames = (remaining: number) => {
    startupFrame = requestAnimationFrame(() => {
      if (stopped) return;
      measure("startup-frame");
      if (remaining > 1) initialFrames(remaining - 1); else persist(true);
    });
  };
  const findDock = () => {
    if (!document.querySelector(".app-navigation")) return false;
    measure("dock-available");
    initialFrames(config.startupFrames);
    return true;
  };
  if (!findDock()) {
    const observer = new MutationObserver(() => { if (findDock()) observer.disconnect(); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    disposers.push(() => observer.disconnect());
  }
  target.__mxDockDiagnostic = {
    freeze: () => {
      if (!stopped) {
        measure("freeze");
        persist(true);
        stopped = true;
        cancelAnimationFrame(frame); cancelAnimationFrame(startupFrame);
        disposers.forEach(dispose => dispose());
      }
      return JSON.stringify(report, null, 2);
    },
  };
}

export function dockDiagnosticScript(sha: string): string {
  return `(${startDockDiagnostic.toString()})(${JSON.stringify(DOCK_DIAGNOSTICS)},${JSON.stringify(sha)})`;
}
