"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Zoomable } from "@/components/ui/ImageViewer";
import { BackButton } from "./BackButton";

/**
 * The header of a page that sits inside another (a person, a studio, the whole staff, the work an anime comes from, a
 * franchise): ONE composition — Back | a small image when there is one | the page's context and title — instead of a bar
 * with a heading under it. Once it has scrolled away, a compact sticky bar (the same Back, a smaller image, the title)
 * slides in over 180 ms (transform + opacity only, no parallax, nothing scroll-linked, reduced-motion aware).
 */

/** True once the element has scrolled out through the top of the viewport. */
export function useScrolledPast() {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry!.isIntersecting && entry!.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, scrolled };
}

/**
 * `--collapse` (0 → 1) on the element, driven by how far the page has scrolled over `distance` px: a poster that starts
 * large and settles while the page moves, instead of being swapped for a tiny image all at once. It writes one CSS variable
 * from a rAF-throttled passive listener (no React state, no layout read besides scrollY) and does nothing at all under
 * `prefers-reduced-motion`. Opacity / transform consumers only: nothing moves the layout.
 */
export function useScrollCollapse<T extends HTMLElement>(distance = 140) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const apply = () => {
      frame = 0;
      el.style.setProperty("--collapse", Math.min(1, Math.max(0, window.scrollY / distance)).toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [distance]);
  return ref;
}

export interface HeaderImage {
  /** The picture at a given size (px): an avatar, a cover. */
  render: (size: number) => ReactNode;
  /** When set, the expanded image opens enlarged on tap. */
  viewer?: { src: string | null | undefined; alt: string };
}

export function DetailHeader({
  fallback,
  label,
  title,
  titleTestId,
  context,
  contextHref,
  contextTestId,
  subtitle,
  image,
  actions,
  identityMark,
}: {
  fallback: string;
  label?: string;
  title: string;
  titleTestId?: string;
  /** What this page is a part of, said above the title (« Tout le staff », « Œuvre d'origine »). */
  context?: string | null;
  /** When the context is a page of its own (the anime this staff belongs to), it opens it. */
  contextHref?: string;
  contextTestId?: string;
  /** A quieter line under the title (the native name). */
  subtitle?: string | null;
  image?: HeaderImage;
  actions?: ReactNode;
  identityMark?: ReactNode;
}) {
  const { ref, scrolled } = useScrolledPast();
  const picture = image?.render(IMAGE_SIZE);
  return (
    <>
      <header className="px-safe mx-auto flex max-w-4xl items-center gap-3 pb-4" style={{ paddingTop: "calc(var(--safe-top) + 0.5rem)" }} data-testid="detail-header">
        <BackButton fallback={fallback} label={label} />
        {image && picture && (
          <span className="shrink-0" style={{ width: IMAGE_SIZE }} data-testid="detail-header-image">
            {image.viewer ? (
              <Zoomable src={image.viewer.src} alt={image.viewer.alt}>
                {picture}
              </Zoomable>
            ) : (
              picture
            )}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {context &&
            (contextHref ? (
              <Link href={contextHref} className="-my-2 inline-flex min-h-11 max-w-full items-center gap-0.5 text-[14px] leading-tight text-soft active:text-accent" data-testid={contextTestId}>
                <span className="truncate">{context}</span>
                <ChevronRight size={15} className="shrink-0 context-accent" aria-hidden="true" />
              </Link>
            ) : (
              <p className="text-[13px] leading-tight text-soft">{context}</p>
            ))}
          <h1 className={identityMark ? "sr-only" : "display-identity"} data-testid={titleTestId}>
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 text-[14px] text-soft">{subtitle}</p>}
          {identityMark && <div className="mt-2">{identityMark}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </header>
      <div ref={ref} className="pointer-events-none h-px" aria-hidden="true" />
      <StickyTitleBar visible={scrolled} fallback={fallback} label={label} title={title} image={image} actions={actions} />
    </>
  );
}

const IMAGE_SIZE = 72;
const COMPACT_IMAGE_SIZE = 30;

/**
 * The compact bar: stuck under the notch, hidden above the page (translateY −100 %, opacity 0) until `visible`. A zero-height
 * sticky wrapper carries it, so it never moves the layout and stays inside the content column.
 */
export function StickyTitleBar({ visible, fallback, label, title, image, actions }: { visible: boolean; fallback: string; label?: string; title: string; image?: HeaderImage; actions?: ReactNode }) {
  return (
    <div className="sticky top-0 z-30 h-0" data-testid="sticky-title-bar" data-visible={visible}>
      <div
        className="absolute inset-x-0 top-0 border-b border-line bg-ink transition-[transform,opacity] duration-[180ms] ease-out motion-reduce:transition-none"
        style={{ paddingTop: "var(--safe-top)", transform: visible ? "translateY(0)" : "translateY(-100%)", opacity: visible ? 1 : 0 }}
        aria-hidden={!visible}
        inert={!visible}
      >
        <div className="px-safe mx-auto flex h-12 max-w-4xl items-center gap-2">
          <BackButton fallback={fallback} label={label} />
          {image && (
            <span className="shrink-0" style={{ width: COMPACT_IMAGE_SIZE }}>
              {image.render(COMPACT_IMAGE_SIZE)}
            </span>
          )}
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title}</p>
          {actions && <div className="ml-auto flex shrink-0 items-center gap-1">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
