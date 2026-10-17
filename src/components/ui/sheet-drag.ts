import { PLAYER } from "@/config/app";

/** Marks the zone a drag may always start from (the handle and the title bar). */
export const SHEET_GRIP_ATTR = "data-sheet-grip";

const SNAP_MS = 200;

/**
 * Controls that own their gesture: a finger that lands on one of these never starts a sheet pull, whatever the sheet
 * allows — a slider thumb dragged with a little vertical drift must not carry the whole sheet with it.
 */
const GESTURE_OWNERS = 'input, textarea, select, [role="slider"], [contenteditable="true"], [data-sheet-no-drag]';

/**
 * Where a pull may start. `handle+content` (default): the grip, the backdrop, or content scrolled to its very top
 * (long lists such as Épisodes). `handle`: the grip and the backdrop only — for sheets whose body is made of controls.
 */
export type SheetDragFrom = "handle" | "handle+content";

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** Whether no scrollable ancestor between `target` and `root` still has content above the visible part. */
function scrolledToTop(target: Element, root: Element): boolean {
  for (let el: Element | null = target; el && el !== root; el = el.parentElement) {
    const overflowY = getComputedStyle(el).overflowY;
    const scrollable = (overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight;
    if (scrollable && el.scrollTop > 0) return false;
  }
  return true;
}

/**
 * Swipe-down-to-dismiss for a bottom sheet (a native <dialog>), with touch events and no library.
 *
 * A pull starts from the grip (handle + title bar), the backdrop, or — unless `dragFrom` is `handle` — the content once
 * it is scrolled to its very top, so the inner scroll (and the virtualised episode list) keeps working. Sliders and
 * other form controls always keep their own gesture. While pulling, the sheet follows the
 * finger; on release it is dismissed past `sheetDismissShare` of its height (or a quick flick), else it snaps back.
 * Escape, the backdrop tap and the close button are not touched here.
 */
export function attachSheetDrag(dialog: HTMLDialogElement, onDismiss: () => void, dragFrom: SheetDragFrom = "handle+content"): () => void {
  let mode: "idle" | "pending" | "drag" | "scroll" = "idle";
  let startY = 0;
  let lastY = 0;
  let lastAt = 0;
  let velocity = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const reset = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    dialog.style.transition = "";
    dialog.style.transform = "";
  };

  const onStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      mode = "idle";
      return;
    }
    if (timer) reset();
    const touch = e.touches[0]!;
    startY = lastY = touch.clientY;
    lastAt = performance.now();
    velocity = 0;
    const target = e.target instanceof Element ? e.target : dialog;
    const fromGrip = target === dialog || target.closest(`[${SHEET_GRIP_ATTR}]`) != null;
    if (!fromGrip && target.closest(GESTURE_OWNERS) != null) {
      mode = "scroll";
      return;
    }
    mode = fromGrip || (dragFrom === "handle+content" && scrolledToTop(target, dialog)) ? "pending" : "scroll";
  };

  const onMove = (e: TouchEvent) => {
    // The backdrop is not content: the page behind must never scroll under it.
    if (e.target === dialog && e.cancelable) e.preventDefault();
    if (mode === "idle" || mode === "scroll" || e.touches.length !== 1) return;
    const y = e.touches[0]!.clientY;
    const dy = y - startY;
    if (mode === "pending") {
      if (dy > PLAYER.sheetDragSlopPx) mode = "drag";
      else {
        // Upward: the content scrolls, this gesture is not ours. Within the slop: still undecided.
        if (dy < -PLAYER.sheetDragSlopPx) mode = "scroll";
        return;
      }
    }
    if (e.cancelable) e.preventDefault();
    const now = performance.now();
    if (now > lastAt) velocity = (y - lastY) / (now - lastAt);
    lastY = y;
    lastAt = now;
    dialog.style.transition = "none";
    dialog.style.transform = `translateY(${Math.max(0, dy)}px)`;
  };

  // The system took the touch away (a scroll or a call began): never read that as a release — back to place, no dismiss.
  const onCancel = () => {
    const was = mode;
    mode = "idle";
    if (was !== "drag") return;
    if (reducedMotion()) {
      reset();
      return;
    }
    dialog.style.transition = `transform ${SNAP_MS}ms ease-out`;
    dialog.style.transform = "translateY(0)";
    timer = setTimeout(reset, SNAP_MS);
  };

  const onEnd = () => {
    const was = mode;
    mode = "idle";
    if (was !== "drag") return;
    const dy = Math.max(0, lastY - startY);
    const height = dialog.offsetHeight || 400;
    const dismiss = dy >= Math.max(PLAYER.sheetDismissMinPx, PLAYER.sheetDismissShare * height) || (velocity >= PLAYER.sheetDismissVelocity && dy >= PLAYER.sheetDismissMinPx);
    const still = reducedMotion();
    if (dismiss) {
      if (still) {
        onDismiss();
        return;
      }
      dialog.style.transition = `transform ${SNAP_MS}ms ease-in`;
      dialog.style.transform = "translateY(100%)";
      timer = setTimeout(() => {
        timer = null;
        onDismiss();
      }, SNAP_MS);
      return;
    }
    if (still) {
      reset();
      return;
    }
    dialog.style.transition = `transform ${SNAP_MS}ms ease-out`;
    dialog.style.transform = "translateY(0)";
    timer = setTimeout(reset, SNAP_MS);
  };

  dialog.addEventListener("touchstart", onStart, { passive: true });
  dialog.addEventListener("touchmove", onMove, { passive: false });
  dialog.addEventListener("touchend", onEnd);
  dialog.addEventListener("touchcancel", onCancel);
  return () => {
    dialog.removeEventListener("touchstart", onStart);
    dialog.removeEventListener("touchmove", onMove);
    dialog.removeEventListener("touchend", onEnd);
    dialog.removeEventListener("touchcancel", onCancel);
    reset();
  };
}
