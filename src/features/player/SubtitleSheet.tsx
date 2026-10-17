"use client";


import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { Check, ChevronRight } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import type { SheetChoice, SubtitleSheetModel } from "./PlayerControls";

/**
 * The CC menu on a phone: a bottom sheet in sections instead of the desktop popover. Language first (French, English,
 * Désactivés); the advanced tools — the timing (only while an external file is shown) and the other files — come last and
 * quieter, each behind a light line, so the sheet never reads like a debug panel and stays short. The look (size, height,
 * style) opens from « Apparence › » (`SubtitleStyleSheet`): the look belongs to the CC flow. Every row is a 44 px+ target. The
 * choices are the same ones the popover offers.
 */
export function SubtitleSheet({ open, onClose, model }: { open: boolean; onClose: () => void; model: SubtitleSheetModel }) {
  useInterfaceLanguage();
  const { languages, sync, others, appearance } = model;
  return (
    <Sheet open={open} onClose={onClose} title={ui("Sous-titres")} maxHeight="72dvh">
      <div className="flex flex-col gap-3 pb-1" data-testid="subtitles-sheet">
        <Section title={ui("Langue")}>
          <Choices items={languages} onDone={onClose} />
        </Section>

        {/* Language and look are ONE flow: the look opens from here, never from a pill under the player. */}
        {appearance && (
          <button
            type="button"
            onClick={() => {
              onClose();
              appearance.onOpen();
            }}
            className="-mt-1 flex min-h-12 w-full items-center justify-between gap-3 border-t border-hairline text-left text-[16px] font-medium text-paper transition-opacity active:opacity-70"
            data-testid="subtitles-appearance"
          >
            <span>{ui("Apparence")}</span>
            <span className="flex items-center gap-1 text-[15px] text-soft">
              {appearance.summary}
              <ChevronRight size={18} aria-hidden="true" />
            </span>
          </button>
        )}

        {sync && (
          <Section title={ui("Synchronisation")} quiet>
            <div className="flex items-center gap-2" data-testid="subtitles-sync">
              <button type="button" onClick={sync.earlier} aria-label={ui("Plus tôt, {0}", sync.earlierLabel)} className="tactile min-h-11 min-w-[4.75rem] rounded-xl border border-line px-3 text-[14px] font-medium text-soft tabular-nums active:bg-surface">
                {sync.earlierLabel}
              </button>
              <output className="flex-1 text-center text-[15px] font-medium tabular-nums" aria-label={ui("Décalage actuel")} data-testid="subtitles-offset">
                {sync.offsetLabel}
              </output>
              <button type="button" onClick={sync.later} aria-label={ui("Plus tard, {0}", sync.laterLabel)} className="tactile min-h-11 min-w-[4.75rem] rounded-xl border border-line px-3 text-[14px] font-medium text-soft tabular-nums active:bg-surface">
                {sync.laterLabel}
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <button type="button" onClick={sync.reset} disabled={!sync.canReset} className="min-h-11 text-[15px] font-medium text-accent active:opacity-70 disabled:text-soft">
                {ui("Réinitialiser")}</button>
              {sync.note && <span className="text-[12px] text-soft">{sync.note}</span>}
            </div>
          </Section>
        )}

        {others && (
          <Disclosure title={ui("Autres sous-titres")} value={String(others.count)} testId="subtitles-others">
            <Choices items={others.items} onDone={onClose} clamp />
          </Disclosure>
        )}

      </div>
    </Sheet>
  );
}

function Section({ title, children, quiet = false }: { title: string; children: ReactNode; quiet?: boolean }) {
  useInterfaceLanguage();
  return (
    <section aria-label={title}>
      <h3 className={`mb-1 font-semibold ${quiet ? "text-[15px] text-soft" : "text-[17px] text-paper"}`} aria-hidden="true">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Choices({ items, onDone, clamp = false }: { items: SheetChoice[]; onDone: () => void; clamp?: boolean }) {
  useInterfaceLanguage();
  return (
    <ul role="radiogroup" className="flex flex-col">
      {items.map((item) => (
        <li key={item.key} className="border-b border-hairline last:border-b-0">
          <button
            type="button"
            role="radio"
            aria-checked={item.checked}
            disabled={item.disabled}
            onClick={() => {
              item.onSelect();
              onDone();
            }}
            className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left text-[16px] leading-snug text-paper active:opacity-70 disabled:text-soft"
          >
            <span className={`min-w-0 break-words ${clamp ? "line-clamp-2 text-[15px]" : ""}`}>{item.label}</span>
            {item.checked && <Check size={18} className="shrink-0 text-accent" aria-hidden="true" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Disclosure({ title, value, children, testId }: { title: string; value: string; children: ReactNode; testId: string }) {
  useInterfaceLanguage();
  const [open, setOpen] = useState(false);
  return (
    <section aria-label={title} data-testid={testId}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex min-h-12 w-full items-center justify-between gap-3 border-t border-hairline text-left text-[16px] text-paper active:opacity-70">
        <span>{title}</span>
        <span className="flex items-center gap-1 text-[15px] text-soft">
          {value}
          <ChevronRight size={18} className={`transition-transform ${open ? "rotate-90" : ""}`} aria-hidden="true" />
        </span>
      </button>
      {open && children}
    </section>
  );
}
