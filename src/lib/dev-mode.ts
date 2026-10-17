/**
 * Developer mode: shows the local demo source, the diagnostics screen and
 * technical error details. Off for normal users; toggled in Réglages or with
 * `?debug=1` (remembered on this device only).
 */

const KEY = "maxime-anime:developer-mode";
const listeners = new Set<() => void>();

export function isDeveloperMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const param = new URLSearchParams(window.location.search).get("debug");
    if (param === "1") localStorage.setItem(KEY, "1");
    if (param === "0") localStorage.removeItem(KEY);
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setDeveloperMode(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  for (const l of listeners) l();
}

export function subscribeDeveloperMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
