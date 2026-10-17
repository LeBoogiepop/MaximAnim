"use client";

import { useRef, useState } from "react";
import { GRAPH_PAGES } from "@/config/app";

export interface CreditPageResult<T> { data?: { pages: T[] }; hasNextPage: boolean; isError?: boolean }
export interface CreditPages<T> extends CreditPageResult<T> { isFetchingNextPage: boolean; fetchNextPage: () => Promise<CreditPageResult<T>> }

/** Duplicate-only pages are neither exhaustion nor errors. Only the API ends the list. */
export async function advanceVisiblePages<T>(query: CreditPages<T>, keys: (pages: T[]) => readonly string[], limit = GRAPH_PAGES.autoPages): Promise<"added" | "exhausted" | "bounded" | "error"> {
  const known = new Set(keys(query.data?.pages ?? []));
  try {
    for (let i = 0; i < limit && query.hasNextPage; i++) {
      const result = await query.fetchNextPage();
      if (result.isError) return "error";
      if (keys(result.data?.pages ?? []).some(k => !known.has(k))) return "added";
      if (!result.hasNextPage) return "exhausted";
    }
    return query.hasNextPage ? "bounded" : "exhausted";
  } catch { return "error"; }
}

export function useVisiblePagination<T>(query: CreditPages<T>, keys: (pages: T[]) => readonly string[]) {
  const lock = useRef(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Awaited<ReturnType<typeof advanceVisiblePages>> | null>(null);
  const load = async () => {
    if (lock.current || query.isFetchingNextPage || !query.hasNextPage) return;
    lock.current = true; setLoading(true); setStatus(null);
    try { setStatus(await advanceVisiblePages(query, keys)); }
    finally { lock.current = false; setLoading(false); }
  };
  return { load, loading, failed: status === "error", bounded: status === "bounded" };
}
