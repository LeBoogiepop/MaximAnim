"use client";

import { ui, localizeOwnedText } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { LISTS } from "@/config/app";
import { createList, ListValidationError, normalizeEmoji, updateList } from "@/lib/db/lists";
import type { ListRecord } from "@/lib/db/types";

const EMOJIS = [
  "⏳", "⭐", "🔥", "❤️", "🍿", "📺", "🎬", "✨",
  "🌙", "☀️", "🌸", "🍜", "🗡️", "🤖", "👻", "⚽",
  "🎸", "🧠", "😂", "😭", "💤", "🏆", "🧪", "🐉",
  "🚀", "🌊", "🎮", "📚", "🕵️", "💌", "🌀", "✅",
];

/** Create a list (no `list`) or edit its name/emoji. */
export function ListEditorSheet({
  open,
  onClose,
  list,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  list?: ListRecord;
  onCreated?: (list: ListRecord) => void;
}) {
  useInterfaceLanguage();
  return (
    <Sheet open={open} onClose={onClose} title={list ? ui("Modifier la liste") : ui("Nouvelle liste")}>
      {/* Keyed so the form resets whenever the sheet opens on another list. */}
      {open && <ListEditorForm key={list?.id ?? "new"} list={list} onClose={onClose} onCreated={onCreated} />}
    </Sheet>
  );
}

function ListEditorForm({
  list,
  onClose,
  onCreated,
}: {
  list?: ListRecord;
  onClose: () => void;
  onCreated?: (list: ListRecord) => void;
}) {
  useInterfaceLanguage();
  const [name, setName] = useState(list?.name ?? "");
  const [emoji, setEmoji] = useState(list?.emoji ?? "⭐");
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (list) {
        await updateList(list.id, { name, emoji });
        toast(ui("Liste modifiée"));
      } else {
        const created = await createList(name, emoji);
        toast(ui("{0} {1} créée", created.emoji, created.name));
        onCreated?.(created);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ListValidationError ? err.message : ui("Impossible d'enregistrer la liste."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 pb-2">
      <div className="flex items-center gap-3">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-line bg-surface text-3xl"
          aria-hidden="true"
        >
          {emoji}
        </span>
        <label className="flex-1">
          <span className="sr-only">{ui("Nom de la liste")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={LISTS.maxNameLength}
            placeholder={ui("Nom de la liste")}
            autoComplete="off"
            enterKeyHint="done"
            className="h-14 w-full rounded-2xl border border-line bg-ink px-4 text-base font-semibold placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-soft">Emoji</legend>
        <div className="grid grid-cols-8 gap-1.5">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              aria-label={`Emoji ${e}`}
              aria-pressed={emoji === e}
              onClick={() => setEmoji(e)}
              className={`flex aspect-square min-h-10 items-center justify-center rounded-xl text-xl transition-transform active:scale-90 ${
                emoji === e ? "bg-accent" : "bg-surface"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-soft">
          <span className="shrink-0">{ui("Autre emoji")}</span>
          <input
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              if (e.target.value.trim()) setEmoji(normalizeEmoji(e.target.value));
            }}
            placeholder="🙂"
            aria-label={ui("Saisir un autre emoji")}
            className="h-11 w-20 rounded-xl border border-line bg-ink px-3 text-center text-base focus:border-accent focus:outline-none"
          />
        </label>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-xl bg-coral/15 px-3 py-2 text-sm font-semibold text-coral">
          {localizeOwnedText(error)}
        </p>
      )}

      <Button type="submit" size="lg" block disabled={busy}>
        {list ? ui("Enregistrer") : ui("Créer la liste")}
      </Button>
    </form>
  );
}
