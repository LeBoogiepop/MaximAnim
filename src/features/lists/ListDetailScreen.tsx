"use client";


import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Pencil, Search, X } from "lucide-react";
import { useState } from "react";
import { DetailTopBar } from "@/components/layout/DetailTopBar";
import { ButtonLink, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PosterCard } from "@/features/anime/AnimeCards";
import { useAnimeRecords, useList, useProgressIndex } from "@/features/library/hooks";
import { useTitles } from "@/features/settings/PreferencesContext";
import { availableEpisodeCount } from "@/lib/anilist/normalize";
import { moveAnimeInList, removeAnimeFromList } from "@/lib/db/lists";
import { watchedCount } from "@/lib/progress/logic";
import { titlesLabel } from "@/lib/utils/format";
import { routes } from "@/lib/utils/routes";
import { ListEditorSheet } from "./ListEditorSheet";

export function ListDetailScreen({ id }: { id: string }) {
  useInterfaceLanguage();
  const list = useList(id);
  const ids = list?.entries.map((e) => e.animeId);
  const anime = useAnimeRecords(list ? ids : undefined);
  const progress = useProgressIndex(list ? ids : undefined);
  const [editMode, setEditMode] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const toast = useToast();
  const { main } = useTitles();

  if (list === undefined) return <div aria-busy="true"><DetailTopBar fallback={routes.lists()} /></div>;
  if (list === null) {
    return (
      <div>
        <DetailTopBar fallback={routes.lists()} />
        <div className="px-safe mt-6">
          <EmptyState title={ui("Cette liste n'existe plus")} action={<ButtonLink href={routes.lists()} variant="secondary">{ui("Mes listes")}</ButtonLink>} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <DetailTopBar
        fallback={routes.lists()}
        label={ui("Retour aux listes")}
        title={`${list.emoji} ${list.name}`}
        actions={
          <>
            <IconButton label={ui("Renommer la liste")} onClick={() => setRenaming(true)}>
              <Pencil size={18} aria-hidden="true" />
            </IconButton>
            {list.entries.length > 0 && (
              <IconButton label={editMode ? ui("Terminer") : ui("Réorganiser ou retirer")} variant={editMode ? "primary" : "ghost"} onClick={() => setEditMode((v) => !v)}>
                {editMode ? <Check size={20} aria-hidden="true" /> : <ArrowUpDown size={19} aria-hidden="true" />}
              </IconButton>
            )}
          </>
        }
      />
      <header className="px-safe pt-2 pb-5">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">
          <span className="mr-2" aria-hidden="true">
            {list.emoji}
          </span>
          {list.name}
        </h1>
        <p className="mt-1 text-[13px] text-soft">{titlesLabel(list.entries.length)}</p>
      </header>

      <div className="px-safe">
        {list.entries.length === 0 ? (
          <EmptyState
            glyph={list.emoji}
            title={ui("Liste vide")}
            action={<ButtonLink href={routes.search()} icon={<Search size={18} aria-hidden="true" />}>{ui("Chercher un anime")}</ButtonLink>}
          >
            {ui("Ouvre la fiche d'un anime et touche « Ajouter ».")}</EmptyState>
        ) : editMode ? (
          <ul className="flex flex-col gap-2">
            {list.entries.map((entry, i) => {
              const record = anime?.get(entry.animeId);
              const title = record ? main(record.summary.titles) : `Anime ${entry.animeId}`;
              return (
                <li key={entry.animeId} className="flex min-h-16 items-center gap-2 border-b border-line py-2">
                  <span className="w-5 text-[13px] text-muted tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-bold">{title}</span>
                  <IconButton label={ui("Monter {0}", title)} disabled={i === 0} onClick={() => void moveAnimeInList(list.id, entry.animeId, -1)}>
                    <ArrowUp size={18} aria-hidden="true" />
                  </IconButton>
                  <IconButton label={ui("Descendre {0}", title)} disabled={i === list.entries.length - 1} onClick={() => void moveAnimeInList(list.id, entry.animeId, 1)}>
                    <ArrowDown size={18} aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    label={ui("Retirer {0}", title)}
                    variant="ghost"
                    className="text-coral"
                    onClick={() => void removeAnimeFromList(list.id, entry.animeId).then(() => toast(ui("{0} retiré", title)))}
                  >
                    <X size={20} aria-hidden="true" />
                  </IconButton>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4">
            {list.entries.map((entry, i) => {
              const record = anime?.get(entry.animeId);
              if (!record) return <li key={entry.animeId} className="skeleton aspect-[5/7] rounded-[var(--radius-poster)]" />;
              const total = availableEpisodeCount(record.summary) ?? record.summary.episodeCount;
              const seen = watchedCount(progress?.[entry.animeId] ?? []);
              return (
                <li key={entry.animeId}>
                  <PosterCard
                    anime={record.summary}
                    href={routes.anime(entry.animeId)}
                    width="w-full"
                    caption={seen > 0 ? (total ? ui("{0}/{1} ép.", seen, total) : ui("{0} ép. vus", seen)) : null}
                    progress={total ? seen / total : null}
                    priority={i < 6}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <ListEditorSheet open={renaming} list={list} onClose={() => setRenaming(false)} />
    </div>
  );
}
