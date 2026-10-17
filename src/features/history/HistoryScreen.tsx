"use client";


import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { X } from "lucide-react";
import { useState } from "react";
import { ButtonLink, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmSheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { DiscoveryRow } from "@/features/search/EntryStatus";
import { type HistoryItem, useHistory } from "@/features/library/hooks";
import { clearHistory, removeHistoryEntry } from "@/lib/db/progress";
import { isSingleItem } from "@/lib/anilist/normalize";
import { historyEpisodeText } from "@/lib/search/entry-status";
import { clockLabel, dayLabel, formatTime } from "@/lib/utils/format";
import { routes } from "@/lib/utils/routes";

function groupByDay(items: HistoryItem[]): { day: string; items: HistoryItem[] }[] {
  const groups: { day: string; items: HistoryItem[] }[] = [];
  for (const item of items) {
    const day = dayLabel(item.entry.watchedAt);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
}

/**
 * Viewing sessions, newest first. Removing one (or clearing all) only
 * forgets the session: episode progress — "vu", resume position — is a
 * separate record and stays exactly as it was.
 */
export function HistoryScreen() {
  useInterfaceLanguage();
  const history = useHistory();
  const toast = useToast();
  const [confirmClear, setConfirmClear] = useState(false);
  return (
    <div className="safe-top">
      <header className="px-safe flex items-center justify-between gap-3 pt-4 pb-4">
        <h1 className="display-title">{ui("Historique")}</h1>
        {history && history.length > 0 && (
          <button type="button" onClick={() => setConfirmClear(true)} className="min-h-11 text-[15px] text-soft active:opacity-60">
            {ui("Effacer")}</button>
        )}
      </header>
      <div className="px-safe">
        {history === undefined ? (
          <div className="flex flex-col gap-3" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <EmptyState title={ui("Rien regardé pour l'instant")} action={<ButtonLink href={routes.search()} variant="secondary">{ui("Trouver un anime")}</ButtonLink>}>
            {ui("Chaque épisode lancé laissera une trace ici, du plus récent au plus ancien.")}</EmptyState>
        ) : (
          <div className="flex flex-col gap-6">
            {groupByDay(history).map((group) => (
              <section key={group.day} aria-label={group.day}>
                <h2 className="mb-1 text-[13px] text-soft first-letter:uppercase">{group.day}</h2>
                <ul className="flex flex-col">
                  {group.items.map(({ entry, anime }) =>
                    anime ? (
                      <li key={entry.id} className="flex items-center" data-testid="history-entry">
                        <div className="min-w-0 flex-1">
                          <DiscoveryRow
                            anime={anime.summary}
                            href={routes.watch(entry.animeId, entry.episodeNumber)}
                            meta={
                              // One line, clipped by height: what does not fit wraps out of sight, progress first.
                              <span className="flex h-5 flex-wrap gap-x-3 overflow-hidden leading-5" data-testid="history-meta">
                                <span className="font-semibold whitespace-nowrap text-paper tabular-nums" data-testid="history-episode">{historyEpisodeText(entry.episodeNumber, isSingleItem(anime.summary), ui("ép."), "Film")}</span>
                                <span className="whitespace-nowrap tabular-nums">{clockLabel(entry.watchedAt)}</span>
                                <span className="whitespace-nowrap text-muted tabular-nums">{formatTime(entry.position)}{entry.duration > 0 ? ` / ${formatTime(entry.duration)}` : ""}</span>
                              </span>
                            }
                          />
                        </div>
                        <IconButton
                          label={ui("Retirer de l'historique")}
                          variant="ghost"
                          className="-mr-2"
                          onClick={() => void removeHistoryEntry(entry.uid).then(() => toast(ui("Retiré de l'historique progression conservée")))}
                        >
                          <X size={18} className="text-muted" aria-hidden="true" />
                        </IconButton>
                      </li>
                    ) : null,
                  )}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
      <ConfirmSheet
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title={ui("Effacer l'historique ?")}
        confirmLabel={ui("Effacer")}
        danger
        message={ui("L'historique de visionnage sera vidé. Ta progression par épisode et tes listes sont conservées.")}
        onConfirm={() => {
          setConfirmClear(false);
          void clearHistory().then(() => toast(ui("Historique effacé")));
        }}
      />
    </div>
  );
}
