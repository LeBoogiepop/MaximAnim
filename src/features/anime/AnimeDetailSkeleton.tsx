import type { CSSProperties } from "react";
import { DetailTopBar } from "@/components/layout/DetailTopBar";
import { heroStageVars } from "@/lib/artwork/hero-art";
import { routes } from "@/lib/utils/routes";

/**
 * What an anime page shows before it has anything: the geometry of the FINAL page, drawn with the same classes — the art zone and
 * the header behind the logo, the season row, the play action, the first episodes — so nothing moves when the real content
 * arrives, and the old poster-and-text placeholder is gone. Used by the route's loading boundary and by the page's own first
 * load (the same markup, so the two never differ).
 *
 * The motion of the loading state lives in `.anime-loading` (data-loading-motion): a quiet shimmer today, and the single place
 * where the chosen loading choreography will plug in without touching the layout.
 */
export function AnimeDetailSkeleton({ label }: { label: string }) {
  return (
    <article className="contextual-content anime-loading relative" aria-busy="true" aria-label={label} data-testid="page-loading" data-loading-motion="quiet">
      <div className="anime-stage relative" style={heroStageVars as CSSProperties}>
        <div className="anime-hero-art pointer-events-none absolute inset-x-0 top-0 overflow-hidden" aria-hidden="true" />
        <div className="anime-hero relative" data-artwork-pending="true" data-testid="anime-hero-skeleton" data-has-seasons="true">
          <DetailTopBar variant="overlay" fallback={routes.home()} />
          <header className="anime-heading px-safe absolute inset-x-0 z-10 flex flex-col items-center justify-end text-center">
            <div className="anime-title-logo"><span className="hero-title-skeleton" aria-hidden="true" /></div>
          </header>
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col" aria-hidden="true">
          <div className="pointer-events-none h-px" />
          <div className="anime-season-controls px-safe mt-3">
            <div className="season-rail">
              <div className="flex min-w-0 flex-1 gap-3"><span className="skeleton h-10 w-14 rounded-[1.25rem]" /><span className="skeleton h-10 w-14 rounded-[1.25rem]" /></div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col" aria-hidden="true">
        <div className="px-safe mt-4 flex flex-col gap-6">
          <EpisodesPlaceholder />
          <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="flex h-[2.1rem] items-center justify-between border-b border-line"><span className="skeleton h-3.5 w-16 rounded" /><span className="skeleton h-3.5 w-24 rounded" /></div>)}</div>
        </div>
      </div>
    </article>
  );
}

/** The episodes list without any picture of any season: the same frame as the real one (a header, then compact rows). */
export function EpisodesPlaceholder() {
  return (
    <div aria-hidden="true" data-testid="episodes-placeholder">
      <div className="mb-2 flex min-h-11 items-center"><span className="skeleton h-6 w-28 rounded" /></div>
      <div className="flex flex-col gap-1">
        {[0, 1, 2, 3].map(i => <div key={i} className="flex min-h-[5.25rem] items-center gap-3 p-1.5"><span className="skeleton aspect-video w-32 shrink-0 rounded-[var(--radius-poster)]" /><span className="flex flex-1 flex-col gap-2"><span className="skeleton h-3.5 w-3/4 rounded" /><span className="skeleton h-3 w-1/3 rounded" /></span></div>)}
      </div>
    </div>
  );
}
