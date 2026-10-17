import { SEARCH } from "@/config/app";
let requestedAt: number | null = null;
/** Returning through the tab resumes browsing; only an explicit clear resets it. */
export function beginSearchDiscovery(): void {
  requestedAt = null;
}
/** Called only by an unmodified navigation click, never by Back or URL restoration. */
export function requestSearchFocus(now = Date.now()): void {
  const field = document.querySelector<HTMLInputElement>('[data-testid="search-input"]');
  if (field) { field.focus({ preventScroll: true }); requestedAt = null; }
  else requestedAt = now;
}
export function consumeSearchFocus(now = Date.now()): boolean {
  const requested = requestedAt;
  requestedAt = null;
  return requested != null && now - requested >= 0 && now - requested <= SEARCH.focusIntentTtlMs;
}
