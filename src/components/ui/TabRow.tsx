"use client";

import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { localizeOwnedText } from "@/lib/i18n/translate";
/**
 * A row of text tabs that scrolls sideways, the chosen one underlined in the page's tone: a real filter (a role, an episode),
 * not a decoration. Exclusive choices, each a 44 px target, with the radio semantics a screen reader needs.
 */
export function TabRow<T extends string | number>({ label, value, options, onChange, testId }: { label: string; value: T; options: readonly { key: T; label: string }[]; onChange: (next: T) => void; testId?: string }) {
  useInterfaceLanguage();
  return (
    <div role="radiogroup" aria-label={localizeOwnedText(label)} className="tab-scroller -mx-4 h-11 gap-5 px-4 shadow-[inset_0_-1px_0_var(--color-line)]" data-testid={testId}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={String(o.key)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.key)}
            className={`tactile h-11 shrink-0 border-b-2 text-[15px] font-semibold whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none ${on ? "text-paper" : "border-transparent text-soft active:text-paper"}`}
            style={on ? { borderColor: "var(--tone, var(--color-accent))" } : undefined}
            data-testid={testId ? `${testId}-${String(o.key)}` : undefined}
          >
            {localizeOwnedText(o.label)}
          </button>
        );
      })}
    </div>
  );
}
