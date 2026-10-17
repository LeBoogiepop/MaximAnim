"use client";

import { useEffect, useRef } from "react";
import { markContent } from "./marks";

/** Marks the first useful content of a screen once, when `ready` first becomes true. */
export function useContentMark(scope: string, ready: boolean): void {
  const done = useRef(false);
  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    markContent(scope);
  }, [scope, ready]);
}
