"use client";



import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { Bell, BellPlus, BellRing, Check, ChevronRight, ListChecks } from "lucide-react";
import { type ReactNode, useState } from "react";
import { IconButton } from "@/components/ui/Button";
import { ConfirmSheet, Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { HOME } from "@/config/app";
import { refreshAiring } from "@/lib/airing/refresh";
import { isMonitored } from "@/lib/airing/schedule";
import { followAiring, unfollowAiring } from "@/lib/db/airing-follows";
import { clearLibraryState, setLibraryState } from "@/lib/db/library-state";
import { resetViewing } from "@/lib/db/progress";
import type { LibraryState, LibraryStateRecord, ProgressRecord } from "@/lib/db/types";
import { abandonedNow, completedByNumbers } from "@/lib/library/views";
import type { AnimeSummary } from "@/types/anime";
import { useAnimeProgress, useIsFollowingAiring, useLibraryState } from "./hooks";

/**
 * « Suivi »: everything the viewer says ABOUT a title, in one quiet sheet under the real actions (Lire / Épisodes), so that
 * tracking never competes with watching.
 *
 *   normal      → Abandonner · Marquer comme terminé · Réinitialiser le visionnage
 *   abandoned   → Reprendre · Réinitialiser le visionnage        (the saved position is kept: Reprendre resumes exactly there)
 *   completed   → Remettre en cours · Réinitialiser le visionnage (declared by the viewer)
 *
 * « Suivre les sorties » lives here too for a title that can still gain episodes (it is a follow, not a way to watch).
 * Abandoning and finishing never touch progress, history or lists; « Réinitialiser » forgets ALL viewing (episode records,
 * sessions, the state) but never list membership. Hidden until the title has been started, carries a state, or can be followed.
 */
/** « Suivre les sorties »: one follow, one place. Shared by the bell (top right of the fiche) and the sheet's own line. */
function useAiringFollow(anime: AnimeSummary) {
  const following = useIsFollowingAiring(anime.id);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    try {
      if (following) await unfollowAiring(anime.id);
      else {
        await followAiring(anime.id, anime);
        // The schedule now misses this id: it is fetched again.
        void refreshAiring();
      }
    } catch { toast(ui("Impossible de modifier le suivi"), "error"); }
    finally { setBusy(false); }
  };
  return { followable: isMonitored(anime), following, busy, toggle };
}

/**
 * The bell, next to the bookmark in the fiche's top right: shown only for a title that can still gain episodes, so a finished work
 * has no dead control. It is the same follow as the one in the « Suivi » sheet, never a second feature.
 */
export function AiringBell({ anime }: { anime: AnimeSummary }) {
  useInterfaceLanguage();
  const { followable, following, busy, toggle } = useAiringFollow(anime);
  if (!followable) return null;
  return (
    <IconButton label={following ? ui("Ne plus suivre les sorties dans le calendrier") : ui("Suivre les sorties dans le calendrier")} variant="overlay" aria-pressed={following === true} disabled={busy || following === undefined} onClick={() => void toggle()} data-testid="airing-bell">
      {following ? <BellRing size={20} className="context-accent" aria-hidden="true" /> : <Bell size={20} aria-hidden="true" />}
    </IconButton>
  );
}

export function TrackingRow({ anime, compact = false, bell = true }: { anime: AnimeSummary; compact?: boolean; /** The compact row also carries the bell (the sheet always has its own line). The fiche puts the bell in its top bar instead. */ bell?: boolean }) {
  useInterfaceLanguage();
  const state = useLibraryState(anime.id);
  const progress = useAnimeProgress(anime.id, { seed: true });
  const { followable, following, busy: followingBusy, toggle: toggleFollow } = useAiringFollow(anime);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  if (state === undefined || progress === undefined) return null;
  const started = progress.length > 0;
  const abandoned = abandonedNow(state ?? undefined, progress);
  const declaredDone = state?.state === "completed";
  const finishedByNumbers = !declaredDone && completedByNumbers({ anime: { id: anime.id, summary: anime, detail: null, detailFetchedAt: null, updatedAt: 0 }, progress: progress as ProgressRecord[] });

  const change = async (next: LibraryState | null, message: string) => {
    setOpen(false);
    const previous: LibraryStateRecord | null = state ?? null;
    if (next) await setLibraryState(anime.id, next);
    else await clearLibraryState(anime.id);
    toast(message, "success", {
      label: ui("Annuler"),
      onSelect: () => void (previous ? setLibraryState(anime.id, previous.state, previous.at) : clearLibraryState(anime.id)),
      durationMs: HOME.undoMs,
    });
  };

  const reset = async () => {
    setConfirmReset(false);
    setOpen(false);
    await resetViewing(anime.id);
    toast(ui("Visionnage réinitialisé"));
  };

  const status = abandoned ? { label: ui("Abandonné"), tone: "text-soft" } : declaredDone || finishedByNumbers ? { label: ui("Terminé"), tone: "context-accent" } : null;
  return (
    <div className={compact ? "flex shrink-0 items-center gap-1" : "min-w-0 flex-1"} data-testid="tracking-row">
      {compact && bell && followable && <button type="button" data-testid="airing-bell" aria-label={following ? ui("Ne plus suivre les sorties dans le calendrier") : ui("Suivre les sorties dans le calendrier")} aria-pressed={following === true} disabled={followingBusy || following === undefined} onClick={() => void toggleFollow()} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-paper active:opacity-60 disabled:opacity-40">{following ? <BellRing size={20} className="context-accent" /> : <Bell size={20} />}</button>}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={compact ? "flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-paper active:opacity-60" : "flex min-h-11 w-full items-center gap-2 rounded-xl border border-line px-3.5 text-left text-[15px] font-medium text-soft transition-opacity active:opacity-60"}
        aria-label={compact ? ui("Suivi du visionnage{0}", status ? ` ${status.label}` : "") : undefined}
        aria-haspopup="dialog"
        data-testid="tracking-open"
      >
        <ListChecks size={20} className={status ? status.tone : undefined} aria-hidden="true" />
        <span className={compact ? "sr-only" : "min-w-0 flex-1 truncate"}>
          {ui("Suivi du visionnage") + " "}{status && (
            <span className={status.tone}>
              {" "}
              <span data-testid="tracking-state">{status.label}</span>
            </span>
          )}
        </span>
        {!compact && <ChevronRight size={16} className="shrink-0 text-accent" aria-hidden="true" />}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={ui("Suivi")}>
        <ul className="-mx-5 divide-y divide-line border-y border-line" data-testid="tracking-sheet">
          {abandoned ? (
            <Action testId="tracking-resume" title={ui("Reprendre")} hint={ui("Reprend là où tu t'étais arrêté")} onSelect={() => void change(null, ui("Repris position conservée"))} />
          ) : declaredDone ? (
            <Action testId="tracking-reopen" title={ui("Remettre en cours")} hint={ui("Retire le marquage « terminé »")} onSelect={() => void change(null, ui("Remis en cours"))} />
          ) : (
            started && (
              <>
                <Action testId="tracking-abandon" title={ui("Abandonner")} hint={ui("La position de lecture est conservée")} onSelect={() => void change("abandoned", ui("Abandonné position conservée"))} />
              </>
            )
          )}
          {!abandoned && !declaredDone && !finishedByNumbers && <Action testId="tracking-complete" title={ui("Marquer comme terminé")} hint={ui("Sans lire les épisodes restants")} onSelect={() => void change("completed", ui("Marqué comme terminé"))} />}
          {!compact && followable && (
            <Action
              testId="airing-follow"
              title={following ? ui("Sorties suivies") : ui("Suivre les sorties")}
              hint={following ? ui("Touche pour ne plus les suivre") : ui("Les nouveaux épisodes apparaissent dans le calendrier « Suivies »")}
              pressed={following === true}
              disabled={followingBusy || following === undefined}
              icon={following ? <Check size={18} className="text-accent" aria-hidden="true" /> : <BellPlus size={18} className="text-paper" aria-hidden="true" />}
              onSelect={() => void toggleFollow()}
            />
          )}
          {(started || state) && <Action testId="tracking-reset" title={ui("Réinitialiser le visionnage")} hint={ui("Efface la progression ; tes listes sont conservées")} danger onSelect={() => setConfirmReset(true)} />}
        </ul>
      </Sheet>
      <ConfirmSheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        danger
        title={ui("Réinitialiser le visionnage ?")}
        confirmLabel={ui("Réinitialiser")}
        message={ui("Tous les épisodes redeviennent non vus, la position de lecture et l'historique de ce titre sont effacés. Tes listes ne changent pas.")}
        onConfirm={() => void reset()}
      />
    </div>
  );
}

/** Declared completion changes library state only; it never fabricates watched episodes. */
export function CompletionAction({ anime }: { anime: AnimeSummary }) {
  useInterfaceLanguage();
  const state = useLibraryState(anime.id);
  const progress = useAnimeProgress(anime.id, { seed: true });
  const toast = useToast();
  if (state === undefined || !progress?.length || state?.state === "completed" || abandonedNow(state ?? undefined, progress) || completedByNumbers({ anime: { id: anime.id, summary: anime, detail: null, detailFetchedAt: null, updatedAt: 0 }, progress })) return null;
  return <button type="button" data-testid="tracking-complete" className="min-h-11 text-sm text-soft active:text-accent" onClick={async () => {
    await setLibraryState(anime.id, "completed");
    toast(ui("Marqué comme terminé"), "success", { label: ui("Annuler"), onSelect: () => void (state ? setLibraryState(anime.id, state.state, state.at) : clearLibraryState(anime.id)), durationMs: HOME.undoMs });
  }}>{ui("Marquer comme terminé")}</button>;
}

function Action({ title, hint, onSelect, testId, icon, pressed, disabled, danger = false }: { title: string; hint: string; onSelect: () => void; testId: string; icon?: ReactNode; pressed?: boolean; disabled?: boolean; danger?: boolean }) {
  useInterfaceLanguage();
  return (
    <li>
      <button type="button" onClick={onSelect} disabled={disabled} aria-pressed={pressed} className="flex min-h-14 w-full items-center gap-3 px-5 text-left transition-colors active:bg-surface disabled:opacity-50" data-testid={testId}>
        <span className="flex min-w-0 flex-1 flex-col items-start justify-center">
          <span className={`text-[16px] ${danger ? "text-coral" : "text-paper"}`}>{title}</span>
          <span className="text-[13px] text-soft">{hint}</span>
        </span>
        {icon}
      </button>
    </li>
  );
}
