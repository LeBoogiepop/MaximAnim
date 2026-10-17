import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { rowStatus } from "@/lib/utils/facts";
import { ui } from "@/lib/i18n/translate";

/**
 * The shared skeleton of a list of works: a poster (or a portrait), a title, one or two quiet lines, something on the
 * right. Each screen composes its own row from it (`FranchiseEntryRow`, `StudioWorkRow`, `PersonCreditRow`,
 * `SourceAdaptationRow`): what a row says depends on what the page is about, the skeleton does not.
 */
export function ListRow({
  href,
  leading,
  eyebrow,
  title,
  meta,
  trailing,
  current = false,
  testId,
  currentAttr,
  className = "",
  compact = false,
}: {
  href: string;
  leading?: ReactNode;
  /** A short line above the title, sentence case (« Saison 2 », « Film »). */
  eyebrow?: ReactNode;
  title: string;
  /** Lines under the title: `MetaLine`s. */
  meta?: ReactNode;
  trailing?: ReactNode;
  /** The row of the page we are on: a thin line of the page's tone on its left edge. */
  current?: boolean;
  testId?: string;
  /** Extra data attribute for tests / styling (`data-current`). */
  currentAttr?: boolean;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`tactile relative flex items-center gap-3.5 active:bg-raised ${compact ? "filmography-compact min-h-11 py-1.5" : "min-h-[4.5rem] py-2.5"} ${current ? "before:absolute before:inset-y-2 before:-left-3 before:w-0.5 before:rounded-full before:bg-[var(--tone,var(--color-accent))]" : ""} ${className}`}
      data-testid={testId}
      data-current={currentAttr ?? (current || undefined)}
    >
      {leading}
      <span className={`list-row-content block min-w-0 flex-1 ${compact ? "lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-baseline lg:gap-4" : ""}`}>
        {eyebrow && <span className="block text-[13px] leading-4 text-soft">{eyebrow}</span>}
        <span className="list-row-title line-clamp-2 block text-[16px] leading-snug font-semibold">{title}</span>
        {meta && <span className="list-row-meta block min-w-0">{meta}</span>}
      </span>
      {trailing && <span className="shrink-0 self-center">{trailing}</span>}
      <ChevronRight size={16} className="shrink-0 text-[var(--tone,var(--color-accent))]" aria-hidden="true" />
    </Link>
  );
}

/** Quiet facts with consistent separation; absent facts add no separator. */
export function MetaLine({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`meta-line mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[13px] text-soft ${className}`}>{children}</span>;
}

const TONES = { live: "text-green", soon: "text-cream", warn: "text-coral", quiet: "text-soft" } as const;

/** « En cours », « À venir », « Annulé »: coloured text, no pill, no dot. A finished work says nothing. */
export function StatusText({ status, anime = false }: { status: Parameters<typeof rowStatus>[0]; anime?: boolean }) {
  const s = rowStatus(status);
  return s ? <span className={`font-medium ${TONES[s.tone]}`}>{anime && status === "RELEASING" ? ui("En diffusion") : s.label}</span> : null;
}
