"use client";



import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { Archive, ArrowDown, ArrowUp, ArrowUpDown, Check, CheckCheck, MoreHorizontal, Pencil, Play, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Poster } from "@/components/ui/Poster";
import { SectionTitle } from "@/components/ui/Section";
import { ConfirmSheet, Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { useAnimeRecords, useLists, useSmartViews } from "@/features/library/hooks";
import { deleteList, moveList } from "@/lib/db/lists";
import type { AnimeRecord, ListRecord } from "@/lib/db/types";
import { SMART_VIEW_LABELS, SMART_VIEWS, type SmartView } from "@/lib/library/views";
import { titlesLabel } from "@/lib/utils/format";
import { routes } from "@/lib/utils/routes";
import { ListEditorSheet } from "./ListEditorSheet";

/**
 * Two different things, kept apart: « Suivi automatique » (À continuer, Terminés, Abandonnés — filters over what you
 * watched, never filled by hand) and « Mes listes » (yours: a name, an emoji, the titles you put in). A personal list
 * called « En cours » is yours and manual: nothing ever moves a title out of it.
 */
export function ListsScreen() {
  useInterfaceLanguage();
  const lists = useLists();
  const [reordering, setReordering] = useState(false);
  const [editing, setEditing] = useState<ListRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ListRecord | null>(null);
  const [acting, setActing] = useState<ListRecord | null>(null);
  const toast = useToast();
  const coverIds = (lists ?? []).flatMap((l) => l.entries.slice(0, 3).map((e) => e.animeId));
  const covers = useAnimeRecords(lists ? coverIds : undefined);

  return (
    <div className="safe-top">
      <header className="px-safe flex items-center justify-between gap-3 pt-4 pb-4">
        <h1 className="display-title">{ui("Listes")}</h1>
        <IconButton label={ui("Nouvelle liste")} variant="primary" onClick={() => setCreating(true)}>
          <Plus size={22} aria-hidden="true" />
        </IconButton>
      </header>

      <SmartViews />

      <section aria-labelledby="my-lists" className="px-safe" data-testid="my-lists">
        <div className="mb-1 flex min-h-11 items-center justify-between gap-3">
          <SectionTitle id="my-lists">{ui("Mes listes")}</SectionTitle>
          {reordering && (
            <button type="button" onClick={() => setReordering(false)} className="flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-accent active:opacity-70" data-testid="reorder-done">
              <Check size={18} aria-hidden="true" />
              {ui("Terminer")}</button>
          )}
        </div>
        {lists === undefined ? (
          <div className="flex flex-col gap-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-20 rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <EmptyState title={ui("Crée ta première liste")} action={<Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => setCreating(true)}>{ui("Nouvelle liste")}</Button>}>
            {ui("Une liste = un emoji, un nom, et les anime que tu veux y ranger.")}</EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {lists.map((list, i) => (
              <li key={list.id}>
                <ListCard list={list} covers={covers} reordering={reordering} first={i === 0} last={i === lists.length - 1} onMove={(d) => void moveList(list.id, d)} onMore={() => setActing(list)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet open={acting != null} onClose={() => setActing(null)} title={acting ? `${acting.emoji} ${acting.name}` : ui("Liste")}>
        <ul className="-mx-5 divide-y divide-line border-y border-line" data-testid="list-actions">
          <li>
            <button
              type="button"
              onClick={() => {
                setEditing(acting);
                setActing(null);
              }}
              className="flex min-h-14 w-full items-center gap-3 px-5 text-left text-[16px] active:bg-surface"
              data-testid="list-action-rename"
            >
              <Pencil size={18} className="text-soft" aria-hidden="true" />
              {ui("Renommer")}</button>
          </li>
          {lists && lists.length > 1 && (
            <li>
              <button
                type="button"
                onClick={() => {
                  setReordering(true);
                  setActing(null);
                }}
                className="flex min-h-14 w-full items-center gap-3 px-5 text-left text-[16px] active:bg-surface"
                data-testid="list-action-reorder"
              >
                <ArrowUpDown size={18} className="text-soft" aria-hidden="true" />
                {ui("Réorganiser")}</button>
            </li>
          )}
          <li>
            <button
              type="button"
              onClick={() => {
                setDeleting(acting);
                setActing(null);
              }}
              className="flex min-h-14 w-full items-center gap-3 px-5 text-left text-[16px] text-coral active:bg-surface"
              data-testid="list-action-delete"
            >
              <Trash2 size={18} aria-hidden="true" />
              {ui("Supprimer")}</button>
          </li>
        </ul>
      </Sheet>
      <ListEditorSheet open={creating} onClose={() => setCreating(false)} />
      <ListEditorSheet open={editing != null} list={editing ?? undefined} onClose={() => setEditing(null)} />
      <ConfirmSheet
        open={deleting != null}
        onClose={() => setDeleting(null)}
        title={ui("Supprimer la liste ?")}
        danger
        confirmLabel={ui("Supprimer")}
        message={
          <>
            <b className="text-paper">
              {deleting?.emoji} {deleting?.name}
            </b>{" "}
            {ui("sera supprimée. Les anime et ta progression restent intacts.")}</>
        }
        onConfirm={() => {
          if (!deleting) return;
          const label = `${deleting.emoji} ${deleting.name}`;
          void deleteList(deleting.id).then(() => toast(ui("{0} supprimée", label)));
          setDeleting(null);
        }}
      />
    </div>
  );
}

function ListCard({
  list,
  covers,
  reordering,
  first,
  last,
  onMove,
  onMore,
}: {
  list: ListRecord;
  covers: Map<number, AnimeRecord> | undefined;
  reordering: boolean;
  first: boolean;
  last: boolean;
  onMove: (d: -1 | 1) => void;
  onMore: () => void;
}) {
  useInterfaceLanguage();
  const stack = list.entries.slice(0, 3).map((e) => covers?.get(e.animeId)).filter((r): r is AnimeRecord => r != null);
  return (
    <div className="flex items-center gap-2 py-3" data-testid="list-card">
      <Link href={routes.list(list.id)} className="flex min-h-[4.5rem] min-w-0 flex-1 items-center gap-3.5 rounded-xl active:opacity-80">
        <div className="relative h-[4.5rem] w-[4.5rem] shrink-0">
          {stack.length ? (
            stack
              .slice()
              .reverse()
              .map((r, i, arr) => (
                <div key={r.id} className="absolute top-0 w-12" style={{ left: `${(arr.length - 1 - i) * 10}px` }}>
                  <Poster cover={r.summary.coverImage} alt="" sizes="48px" rounded="rounded-lg" />
                </div>
              ))
          ) : (
            <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-xl bg-raised text-3xl" aria-hidden="true">
              {list.emoji}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold">
            <span className="mr-1.5" aria-hidden="true">
              {list.emoji}
            </span>
            {list.name}
          </p>
          <p className="mt-0.5 text-[13px] text-soft" data-testid="list-count">
            {titlesLabel(list.entries.length)}
          </p>
        </div>
      </Link>
      {reordering ? (
        <div className="flex flex-col gap-1.5">
          <IconButton label={ui("Monter {0}", list.name)} onClick={() => onMove(-1)} disabled={first}>
            <ArrowUp size={18} aria-hidden="true" />
          </IconButton>
          <IconButton label={ui("Descendre {0}", list.name)} onClick={() => onMove(1)} disabled={last}>
            <ArrowDown size={18} aria-hidden="true" />
          </IconButton>
        </div>
      ) : (
        <IconButton label={ui("Plus d'actions pour {0}", list.name)} variant="ghost" onClick={onMore} data-testid="list-more">
          <MoreHorizontal size={20} aria-hidden="true" />
        </IconButton>
      )}
    </div>
  );
}

/** What each automatic view is, in one glance: an icon, how many titles it holds right now, its name. */
const SMART_TILES: Record<SmartView, { Icon: typeof Play; tone: string; tint: string }> = {
  continue: { Icon: Play, tone: "var(--color-accent)", tint: "color-mix(in srgb, var(--color-accent) 16%, transparent)" },
  completed: { Icon: CheckCheck, tone: "var(--color-green)", tint: "color-mix(in srgb, var(--color-green) 16%, transparent)" },
  abandoned: { Icon: Archive, tone: "var(--color-cream)", tint: "color-mix(in srgb, var(--color-cream) 14%, transparent)" },
};

/**
 * The automatic views: filters over what you did, not lists you fill. ONE group of three tiles (icon, count, name) under its
 * own heading, so it cannot be read as another settings list, and visibly apart from « Mes listes » (posters you collect).
 */
function SmartViews() {
  useInterfaceLanguage();
  const views = useSmartViews();
  return (
    <section aria-labelledby="auto-views" className="px-safe mb-9" data-testid="smart-views">
      <SectionTitle id="auto-views" className="mb-0.5">
        {ui("Suivi automatique")}</SectionTitle>
      <p className="mb-3 text-[13px] text-soft">{ui("Mis à jour selon ce que tu regardes")}</p>
      <ul className="grid grid-cols-3 gap-2.5">
        {SMART_VIEWS.map((view) => {
          const { Icon, tone, tint } = SMART_TILES[view];
          const count = views?.[view].length;
          return (
            <li key={view}>
              <Link
                href={routes.smartView(view)}
                className="card tactile flex min-h-[6.75rem] flex-col justify-between gap-3 p-3 active:border-accent/50"
                data-testid={`smart-link-${view}`}
                aria-label={`${SMART_VIEW_LABELS[view]}${count != null ? `, ${titlesLabel(count)}` : ""}`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: tint, color: tone }}>
                  <Icon size={17} fill={view === "continue" ? "currentColor" : "none"} strokeWidth={view === "continue" ? 0 : 2} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[26px] leading-none font-bold tabular-nums" data-testid={`smart-count-${view}`}>
                    {count ?? "–"}
                  </span>
                  <span className="mt-1 block text-[13px] leading-tight font-medium text-soft">{SMART_VIEW_LABELS[view]}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
