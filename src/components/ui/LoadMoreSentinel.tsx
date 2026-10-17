"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { useEffect, useRef } from "react";
import { GRAPH_PAGES } from "@/config/app";

/**
 * Long lists load as the viewer nears their end: the next page is asked for `GRAPH_PAGES.prefetchMarginPx` before the
 * last row, a few pages by themselves (AniList's rate limit and a 25-row page are the reason), then a plain text button
 * takes over — also after an error, and wherever IntersectionObserver does not exist. Never a bordered « Afficher plus ».
 */
export function LoadMoreSentinel({
  hasMore,
  loading,
  failed = false,
  pages,
  onLoad,
  label = ui("Afficher la suite"),
  manualDuringAuto = false,
}: {
  hasMore: boolean;
  loading: boolean;
  failed?: boolean;
  /** Pages already loaded: past `GRAPH_PAGES.autoPages` the viewer asks for the next one. */
  pages: number;
  onLoad: () => void;
  label?: string;
  manualDuringAuto?: boolean;
}) {
  useInterfaceLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const supported = typeof IntersectionObserver !== "undefined";
  const auto = supported && !failed && pages < GRAPH_PAGES.autoPages;

  useEffect(() => {
    const el = ref.current;
    if (!hasMore || !auto || loading || !el) return;
    // Observed again after every page: a list still short of the screen's end keeps loading until it is not.
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && onLoad(), { rootMargin: `${GRAPH_PAGES.prefetchMarginPx}px` });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, auto, loading, onLoad, pages]);

  if (!hasMore) return null;
  return (
    <div ref={ref} className="py-3" aria-live="polite" data-testid="load-more">
      {loading ? (
        <p className="text-[13px] text-soft">{ui("Chargement…")}</p>
      ) : auto && !manualDuringAuto ? (
        <span className="block h-6" aria-hidden="true" />
      ) : (
        <button type="button" onClick={onLoad} className="min-h-11 text-[15px] font-medium text-accent active:opacity-70" data-testid="load-more-button">
          {failed ? ui("Réessayer") : label}
        </button>
      )}
    </div>
  );
}
