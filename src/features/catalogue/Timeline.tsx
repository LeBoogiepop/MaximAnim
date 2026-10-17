"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import type { ReactNode } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, List, LayoutGrid } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/Section";
import { et } from "@/lib/i18n/messages-entities";
import { type Timeline as TimelineData, TIMELINE_FILTERS, type TimelineFilter, type TimelineOrder } from "@/lib/catalogue/timeline";

export type FilmographyView = "list" | "grid";

/**
 * A single chronological list of works, including announced titles. Real headings, hairlines, no
 * decorative cards in list modes. What a row says is the page's business (`row`); this only places them.
 */
export function Timeline<T>({ timeline, keyOf, row, testId, view = "list" }: { timeline: TimelineData<T>; keyOf: (item: T) => number; row: (item: T, context: { showYear: boolean }) => ReactNode; testId: string; view?: FilmographyView }) {
  useInterfaceLanguage();
  const list = (items: T[], showYear: boolean) => (
    <ul className={view === "grid" ? "grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7" : "flex flex-col"}>
      {items.map((item) => (
        <li key={keyOf(item)}>{row(item, { showYear })}</li>
      ))}
    </ul>
  );
  return (
    <div data-testid={testId} className={view === "list" ? "compact-filmography" : undefined}>
      {timeline.years.map((y) => (
        <Group compact={view === "list"} key={y.year ?? "none"} title={y.year != null ? String(y.year) : ui("Sans date")} testId={`${testId}-year-${y.year ?? "none"}`} tabular>
          {list(y.items, y.year == null)}
        </Group>
      ))}
    </div>
  );
}

function Group({ title, children, testId, tabular = false, compact = false }: { title: string; children: ReactNode; testId: string; tabular?: boolean; compact?: boolean }) {
  useInterfaceLanguage();
  return (
    <section aria-label={title} data-testid={testId} className={compact ? "compact-work-group" : "mt-5 border-t border-line pt-2 first:mt-2 first:border-t-0"}>
      <h3 className={compact ? "sr-only" : `mb-2 text-[15px] font-semibold text-paper ${tabular ? "tabular-nums" : ""}`}>{title}</h3>
      {children}
    </section>
  );
}

/** Heading, sort and filters share one compact alignment; no empty right-aligned control row. */
export function TimelineControls({ title, children, show, filter, onFilter, sort, view }: { title?: string | null; children?: ReactNode; show?: { filter: boolean }; filter?: TimelineFilter; onFilter?: (next: TimelineFilter) => void; sort: { show: boolean; order: TimelineOrder; onOrder: (next: TimelineOrder) => void }; view?: { value: FilmographyView; onChange: (v: FilmographyView) => void } }) {
  useInterfaceLanguage();
  if (!title && !sort.show && !show?.filter && !children && !view) return null;
  return (
    <div className="flex flex-col gap-2" data-testid="timeline-controls">
      {(title || sort.show || view) && <div className="flex min-h-11 flex-wrap items-center gap-x-1 gap-y-1">
        {title && <div className="min-w-0 flex-1"><SectionTitle className="min-w-0"><span className="min-w-0 wrap-break-word">{title}</span></SectionTitle></div>}
        {sort.show && <IconButton label={sort.order === "newest" ? ui("Plus récent d'abord afficher les plus anciens") : ui("Plus ancien d'abord afficher les plus récents")} aria-pressed={sort.order === "oldest"} onClick={() => sort.onOrder(sort.order === "newest" ? "oldest" : "newest")} data-testid="timeline-order">
          {sort.order === "newest" ? <ArrowDownWideNarrow size={20} aria-hidden="true" /> : <ArrowUpNarrowWide size={20} aria-hidden="true" />}
        </IconButton>}
        {view && <div role="group" aria-label={ui("Affichage de la filmographie")} className="flex">{([['list', et("Liste")], ['grid', et("Grille")]] as const).map(([key, label]) => <button key={key} type="button" aria-label={label} title={label} aria-pressed={view.value === key} onClick={() => view.onChange(key)} data-testid={`filmography-view-${key}`} className={`h-11 w-11 flex items-center justify-center rounded-lg text-xs ${view.value === key ? "bg-raised text-accent" : "text-soft"}`}>{key === "list" ? <List size={18} aria-hidden="true" /> : <LayoutGrid size={18} aria-hidden="true" />}</button>)}</div>}
      </div>}
      {show?.filter && filter && onFilter && <Segmented label={ui("Filtrer par statut")} value={filter} options={TIMELINE_FILTERS} onChange={onFilter} testId="timeline-filter" />}
      {children}
    </div>
  );
}
