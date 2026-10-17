"use client";

import { ChevronRight } from "lucide-react";
import { type ReactNode, useId, useState } from "react";

/**
 * A quiet « more » that opens in place: a full-width 44 px row between two hairlines, a chevron that turns. For what is
 * secondary (À propos, the other credits of a studio): never a bordered button, never a card.
 */
export function DisclosureRow({
  label,
  children,
  onOpen,
  defaultOpen = false,
  testId,
  panelTestId,
}: {
  label: string;
  children: ReactNode;
  /** Called the first time the row opens (to load what is behind it). */
  onOpen?: () => void;
  defaultOpen?: boolean;
  testId?: string;
  panelTestId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panel = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => {
          if (!open) onOpen?.();
          setOpen((o) => !o);
        }}
        className="tactile flex min-h-12 w-full items-center justify-between gap-3 border-y border-line text-left text-[15px] font-medium text-paper active:bg-raised"
        data-testid={testId}
      >
        <span>{label}</span>
        <ChevronRight size={18} className={`shrink-0 text-muted transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-90" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div id={panel} className="pt-1" data-testid={panelTestId}>
          {children}
        </div>
      )}
    </div>
  );
}
