"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { BackButton } from "./BackButton";
import { Breadcrumbs } from "./Breadcrumbs";

/**
 * The top of a page that sits inside another (a franchise, a studio, a person, all the staff, a list): Back belongs to the
 * page's header, not to a block floating above its content. The back logic is `BackButton`'s, untouched (history pop when
 * the app has history, else the parent route, replacing the entry).
 *
 * `bar`: sticky under the notch, solid graphite, a hairline appearing only once the page scrolled under it, the page's
 * title fading in at the same moment. `overlay`: over hero artwork, no background, scrolls away with it.
 */
export function DetailTopBar({
  fallback,
  label,
  title,
  actions,
  variant = "bar",
  crumbs,
}: {
  /** Where Back goes when the app has no history of its own (same meaning as `BackButton`). */
  fallback: string;
  /** The accessible name of Back (« Retour à la fiche »). */
  label?: string;
  /** The page's name, shown in the bar once the page's own heading has scrolled away. */
  title?: string;
  /** Icon buttons on the right (44 px targets). */
  actions?: ReactNode;
  variant?: "bar" | "overlay";
  /** Desktop only: where this page sits (« Réglages › Sources »). */
  crumbs?: { label: string; href?: string }[];
}) {
  if (variant === "overlay") {
    return (
      <div className="px-safe absolute inset-x-0 top-0 z-20 flex items-center justify-between pt-3" style={{ paddingTop: "calc(var(--safe-top) + 0.5rem)" }}>
        <BackButton fallback={fallback} label={label} variant="overlay" />
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
    );
  }
  return <Bar fallback={fallback} label={label} title={title} actions={actions} crumbs={crumbs} />;
}

function Bar({ fallback, label, title, actions, crumbs }: { fallback: string; label?: string; title?: string; actions?: ReactNode; crumbs?: { label: string; href?: string }[] }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // The sentinel sits at the very top of the page, under the bar: once it has scrolled out, the page is under the bar.
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry!.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div className={`sticky top-0 z-30 bg-ink transition-[border-color] duration-150 motion-reduce:transition-none ${scrolled ? "border-b border-line" : "border-b border-transparent"}`} style={{ paddingTop: "var(--safe-top)" }} data-testid="detail-topbar" data-scrolled={scrolled}>
        <div className="px-safe flex h-12 items-center gap-2">
          <BackButton fallback={fallback} label={label} />
          {crumbs && <Breadcrumbs items={crumbs} />}
          {title && (
            <p className={`min-w-0 flex-1 truncate text-[15px] font-semibold transition-opacity duration-150 motion-reduce:transition-none ${scrolled ? "opacity-100" : "opacity-0"}`} aria-hidden={!scrolled}>
              {title}
            </p>
          )}
          {actions && <div className="ml-auto flex shrink-0 items-center gap-1">{actions}</div>}
        </div>
      </div>
      <div ref={sentinel} className="pointer-events-none -mt-px h-px" aria-hidden="true" />
    </>
  );
}
