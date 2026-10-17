"use client";

import { useSyncExternalStore } from "react";

/** The desktop layout starts at Tailwind's `lg` (64rem): the watch page and the fiche switch their arrangement there. */
const QUERY = "(min-width: 64rem)";

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia?.(QUERY);
  mq?.addEventListener?.("change", onChange);
  return () => mq?.removeEventListener?.("change", onChange);
}

/** True from 64rem up. False on the server, in engines without matchMedia — and so on a phone, the design authority. */
export function useDesktopLayout(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => typeof window !== "undefined" && window.matchMedia?.(QUERY).matches === true,
    () => false,
  );
}
