import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A fiche technique: stable rows, the label on the left and the value on the right, hairlines between — not a grid of
 * boxes. The same rows in the same order for every item of the same kind; a row is absent only when the data is unknown.
 */
export function FactList({ children, className = "", testId, label }: { children: ReactNode; className?: string; testId?: string; label?: string }) {
  return (
    <dl className={`divide-y divide-line/60 border-y border-line/60 ${className}`} data-testid={testId} aria-label={label}>
      {children}
    </dl>
  );
}

export type FactTone = "live" | "soon" | "warn" | "quiet";

const TONES: Record<FactTone, string> = { live: "text-green", soon: "text-cream", warn: "text-coral", quiet: "text-soft" };

/** A line of a value, in a tone (a status): « En diffusion » in green, « À venir » in cream. */
export function FactStatus({ tone, children }: { tone: FactTone; children: ReactNode }) {
  return <span className={`block text-[13px] font-medium ${TONES[tone]}`}>{children}</span>;
}

/**
 * One row. With `href` the WHOLE row is the link (a 44 px target, a chevron after the value). `note` is a quieter second
 * line under the value; several lines can be given as `children` (the first is the value, the rest are notes).
 */
export function FactRow({ label, children, note, href, testId, linkTestId, fact, onIntent, emphasis = false }: { label: string; children: ReactNode; note?: ReactNode; href?: string; testId?: string; linkTestId?: string; fact?: string; /** A finger went down (or a mouse came over) the link: ask for what it opens, now. */ onIntent?: () => void; /** A row that matters more than its neighbours (the animation studio): a larger, bolder value. */ emphasis?: boolean }) {
  return (
    // Compact: the rows of a fiche read as one technical sheet. A row that opens something keeps a 44 px target.
    <div className={`relative flex items-baseline justify-between gap-4 ${emphasis ? "min-h-11 py-2" : "min-h-9 py-1.5"} ${href ? "min-h-11 transition-colors duration-150 active:bg-raised motion-reduce:transition-none" : ""}`} data-fact={fact} data-testid={testId}>
      <dt className="shrink-0 text-[14px] font-medium text-soft">{label}</dt>
      <dd className={`min-w-0 text-right ${emphasis ? "text-[16px] font-semibold" : "text-[15px] font-medium"} text-paper`}>
        {href ? (
          <Link href={href} target={href.startsWith("https:") ? "_blank" : undefined} rel={href.startsWith("https:") ? "noopener noreferrer" : undefined} className="fact-link inline-flex max-w-full items-center justify-end gap-1 after:absolute after:inset-0" data-testid={linkTestId} onPointerDown={onIntent} onPointerEnter={(e) => e.pointerType === "mouse" && onIntent?.()}>
            <span className="min-w-0 truncate">{children}</span>
            <ChevronRight size={16} className="shrink-0 text-accent" aria-hidden="true" />
          </Link>
        ) : (
          children
        )}
        {note && <span className="block text-[13px] font-normal text-paper/65">{note}</span>}
      </dd>
    </div>
  );
}
