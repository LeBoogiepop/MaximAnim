"use client";

import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { localizeOwnedText } from "@/lib/i18n/translate";
/**
 * A real mode or filter, as a segmented control (and only then): one of a few exclusive choices, all visible, each a
 * 44 px target. Not a row of decorative chips.
 */
export function Segmented<T extends string>({ label, value, options, onChange, testId, className = "" }: { label: string; value: T; options: readonly { key: T; label: string }[]; onChange: (next: T) => void; testId?: string; className?: string }) {
  useInterfaceLanguage();
  return (
    <div role="radiogroup" aria-label={localizeOwnedText(label)} className={`flex w-full rounded-[var(--radius-control)] border border-line p-0.5 ${className}`} data-testid={testId}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.key)}
            className={`tactile min-h-11 min-w-0 flex-1 rounded-[var(--radius-control)] px-2 text-[14px] font-medium transition-colors duration-150 motion-reduce:transition-none ${on ? "bg-surface text-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]" : "text-soft active:text-paper"}`}
            data-testid={testId ? `${testId}-${o.key}` : undefined}
          >
            {localizeOwnedText(o.label)}
          </button>
        );
      })}
    </div>
  );
}
