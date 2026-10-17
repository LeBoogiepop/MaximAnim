"use client";

import { useEffect, useState } from "react";
import { AIRING } from "@/config/app";

/** Refresh every airing surface at the slot, including a page restored from the background. */
export function useAiringClock(airingAt: number | null | undefined): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = airingAt != null && airingAt * 1000 > now
      ? setTimeout(update, Math.min(airingAt * 1000 - now, AIRING.availabilityRecheckMs)) : null;
    document.addEventListener("visibilitychange", update);
    return () => { if (timer != null) clearTimeout(timer); document.removeEventListener("visibilitychange", update); };
  }, [airingAt, now]);
  return now;
}
