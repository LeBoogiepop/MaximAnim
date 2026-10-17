"use client";

import { useEffect, useState } from "react";

/** True only once `flag` has stayed true for `ms` without a break: a state that usually ends at once is never shown at all. */
export function useDelayedFlag(flag: boolean, ms: number): boolean {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    if (!flag) { const reset = setTimeout(() => setElapsed(false), 0); return () => clearTimeout(reset); }
    const timer = setTimeout(() => setElapsed(true), ms);
    return () => clearTimeout(timer);
  }, [flag, ms]);
  return flag && elapsed;
}
