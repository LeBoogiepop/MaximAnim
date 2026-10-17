"use client";

import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { ui } from "@/lib/i18n/translate";

/** A season/part of the franchise that is identified with enough certainty (exact AniList id), in watching order. */
export interface SeasonOption {
  id: number;
  /** « Saison 2 », « Partie 2 », « Film »… already localised and never invented when ambiguous. */
  label: string;
  year?: number | null;
}

/**
 * A single row of chips at the top of the episodes sheet: the season being watched is marked, the one being looked at is
 * selected. Rendered only when the franchise has several identified seasons — a one-season series keeps the plain sheet.
 */
export function SeasonPicker({ seasons, watching, selected, onSelect }: {
  seasons: readonly SeasonOption[];
  /** The season the player is on. */
  watching: number;
  selected: number;
  onSelect: (id: number) => void;
}) {
  useInterfaceLanguage();
  if (seasons.length < 2) return null;
  return (
    <div role="tablist" aria-label={ui("Saisons")} className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" data-testid="season-picker">
      {seasons.map(season => {
        const active = season.id === selected;
        return (
          <button
            key={season.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(season.id)}
            data-season={season.id}
            className={`flex min-h-11 shrink-0 flex-col justify-center rounded-xl border px-4 text-left active:opacity-80 ${active ? "border-paper bg-surface text-paper" : "border-line text-soft"}`}
          >
            <span className="text-[15px] font-semibold leading-tight whitespace-nowrap">{season.label}</span>
            {(season.year != null || season.id === watching) && (
              <span className="text-[12px] leading-tight whitespace-nowrap text-soft">
                {season.id === watching ? ui("En cours de lecture") : season.year}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
