"use client";

import { ui } from "@/lib/i18n/translate";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { HOME } from "@/config/app";
import { availableEpisodeCount } from "@/lib/anilist/normalize";
import { upsertAnimeSummary } from "@/lib/db/library";
import { markPreviousEpisodes, undoEpisodeMarks } from "@/lib/db/progress";
import type { ProgressRecord } from "@/lib/db/types";
import type { EpisodeItem } from "@/lib/providers/episodes";
import type { AnimeSummary } from "@/types/anime";

/** Only the watched checkbox asks; playing and reverting never do. */
export function useEpisodeWatchedAction(anime: AnimeSummary | null | undefined, episodes: readonly EpisodeItem[], progress: readonly ProgressRecord[] | undefined, markOne: (n: number, completed: boolean) => Promise<void>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const available = anime ? availableEpisodeCount(anime) : null;
  const seen = new Set(progress?.filter(p => p.completed).map(p => p.episodeNumber));
  const numbers = (n: number) => episodes.filter(e => e.number === n || (e.number < n && (available == null || e.number <= available))).map(e => e.number);
  const toggle = async (n: number, completed: boolean) => {
    if (busy || !anime || !progress) return;
    if (completed && numbers(n).some(v => v < n && !seen.has(v))) { setSelected(n); return; }
    await markOne(n, completed);
  };
  const choose = async (all: boolean) => {
    if (selected == null || !anime || busy) return;
    const n = selected;
    setBusy(true);
    try {
      if (all) {
        await upsertAnimeSummary(anime);
        const undo = await markPreviousEpisodes(anime.id, numbers(n));
        toast(ui("Épisodes marqués comme vus"), "success", { label: ui("Annuler"), onSelect: () => void undoEpisodeMarks(undo), durationMs: HOME.undoMs });
      } else await markOne(n, true);
      setSelected(null);
    } catch { toast(ui("Impossible de modifier le visionnage"), "error"); }
    finally { setBusy(false); }
  };
  const confirmation = <Sheet open={selected != null} onClose={() => { if (!busy) setSelected(null); }} title={ui("Marquer comme vu")}>
    <div className="flex flex-col gap-3" data-testid="episode-watched-confirmation">
      <p className="text-sm text-soft">{ui("Des épisodes précédents de cette saison restent non vus.")}</p>
      <Button block disabled={busy} onClick={() => void choose(false)}>{ui("Uniquement l'épisode") + " "}{selected}</Button>
      <Button block variant="secondary" disabled={busy} onClick={() => void choose(true)}>{ui("Cet épisode et les précédents")}</Button>
    </div>
  </Sheet>;
  return { toggle, confirmation, dismiss: () => setSelected(null) };
}
