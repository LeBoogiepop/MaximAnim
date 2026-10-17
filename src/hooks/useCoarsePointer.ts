"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(pointer: coarse)";

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia?.(QUERY);
  mq?.addEventListener?.("change", onChange);
  return () => mq?.removeEventListener?.("change", onChange);
}

/** A touch screen is the primary pointer (phone, tablet): menus become sheets. False on the server and in engines without matchMedia. */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => typeof window !== "undefined" && window.matchMedia?.(QUERY).matches === true,
    () => false,
  );
}
