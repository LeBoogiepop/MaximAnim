import type { ReactNode } from "react";

export function SectionHeader({
  title,
  meta,
  action,
  id,
}: {
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="px-safe mb-2 flex min-h-11 items-center justify-between gap-3">
      <div className="flex min-w-0 items-baseline gap-2">
        <h2 id={id} className="display-section flex min-w-0 items-center gap-2.5">
          <span className="truncate">{title}</span>
        </h2>
        {meta != null && <span className="shrink-0 text-[13px] text-muted tabular-nums">{meta}</span>}
      </div>
      {action}
    </div>
  );
}

/**
 * Sentence-case display type establishes a section without a decorative brand mark.
 */
export function SectionTitle({ children, id, className = "" }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <h2 id={id} className={`display-section flex items-center gap-2.5 ${className}`}>
      {children}
    </h2>
  );
}
