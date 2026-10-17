/**
 * Which kind of input the viewer is using right now, published as `<html data-input="pointer|keyboard">`.
 *
 * WebKit draws `:focus-visible` rings on elements that regain focus by script (a sheet closing, a route restoring focus) even
 * after a tap, so a pale ring appeared around an episode thumbnail that nobody had tabbed to. CSS can now keep the ring for the
 * keyboard (which must see where it is) and drop it after a finger or a mouse. Pure functions here; the listeners are installed
 * once by the app shell.
 */
export type InputModality = "pointer" | "keyboard";

/** Keys that mean « I am navigating with the keyboard »; typing in a field or pressing a modifier alone does not. */
const NAVIGATION_KEYS = new Set(["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown", "Enter", " ", "Escape"]);

export function modalityForKey(event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey">): InputModality | null {
  if (event.metaKey || event.ctrlKey || event.altKey) return null;
  return NAVIGATION_KEYS.has(event.key) ? "keyboard" : null;
}

export function installInputModality(root: HTMLElement = document.documentElement): () => void {
  const set = (next: InputModality) => { if (root.dataset.input !== next) root.dataset.input = next; };
  const onKey = (event: KeyboardEvent) => { const next = modalityForKey(event); if (next) set(next); };
  const onPointer = () => set("pointer");
  set("pointer");
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("pointerdown", onPointer, { capture: true, passive: true });
  return () => {
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("pointerdown", onPointer, true);
    delete root.dataset.input;
  };
}
