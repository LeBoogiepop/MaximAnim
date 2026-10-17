"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { useLists } from "@/features/library/hooks";
import { saveAnimeDetail } from "@/lib/db/library";
import { addAnimeToList, removeAnimeFromList } from "@/lib/db/lists";
import { titlesLabel } from "@/lib/utils/format";
import type { Anime } from "@/types/anime";
import { ListEditorSheet } from "./ListEditorSheet";

export function AddToListSheet({ open, onClose, anime }: { open: boolean; onClose: () => void; anime: Anime }) {
  useInterfaceLanguage();
  const lists = useLists();
  const toast = useToast();
  const [creating, setCreating] = useState(false);

  async function toggle(listId: string, inList: boolean, label: string) {
    try {
      if (inList) {
        await removeAnimeFromList(listId, anime.id);
        toast(ui("Retiré de {0}", label));
      } else {
        await addAnimeToList(listId, anime);
        // Keep the full detail so the page also works offline from the library.
        await saveAnimeDetail(anime);
        toast(ui("Ajouté à {0}", label));
      }
    } catch {
      toast(ui("La liste n'a pas pu être modifiée."), "error");
    }
  }

  return (
    <>
      <Sheet
        open={open && !creating}
        onClose={onClose}
        title={ui("Ajouter à une liste")}
        footer={
          <Button variant="secondary" block icon={<Plus size={18} aria-hidden="true" />} onClick={() => setCreating(true)}>
            {ui("Nouvelle liste")}</Button>
        }
      >
        {lists && lists.length === 0 && <p className="py-4 text-sm text-soft">{ui("Aucune liste. Crée la première ci-dessous.")}</p>}
        <ul className="flex flex-col gap-2">
          {lists?.map((list) => {
            const inList = list.entries.some((e) => e.animeId === anime.id);
            const label = `${list.emoji} ${list.name}`;
            return (
              <li key={list.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={inList}
                  onClick={() => void toggle(list.id, inList, label)}
                  className={`tactile flex min-h-14 w-full items-center gap-3 rounded-2xl border border-line px-4 text-left ${inList ? "bg-surface" : "bg-ink"}`}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {list.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{list.name}</span>
                    <span className="text-[13px] text-soft">{titlesLabel(list.entries.length)}</span>
                  </span>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                      inList ? "border-line bg-green text-ink" : "border-line"
                    }`}
                    aria-hidden="true"
                  >
                    {inList && <Check size={17} strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>
      <ListEditorSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(list) => void toggle(list.id, false, `${list.emoji} ${list.name}`)}
      />
    </>
  );
}
