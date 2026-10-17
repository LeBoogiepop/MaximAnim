"use client";



import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DetailTopBar } from "@/components/layout/DetailTopBar";
import { IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Poster } from "@/components/ui/Poster";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { HOME } from "@/config/app";
import { useTitles } from "@/features/settings/PreferencesContext";
import { availableEpisodeCount } from "@/lib/anilist/normalize";
import { clearLibraryState, removeFromTracking, setLibraryState, undoRemoveFromTracking } from "@/lib/db/library-state";
import { abandonedNow, completedByNumbers, type LibraryEntry, SMART_VIEW_LABELS, type SmartView } from "@/lib/library/views";
import { watchedCount } from "@/lib/progress/logic";
import { routes } from "@/lib/utils/routes";
import { useSmartViews } from "./hooks";

const INTRO: Record<SmartView, string> = {
  get continue() { return ui("Ce que tu as commencé et pas terminé, ni abandonné."); },
  get completed() { return ui("Terminés : ceux que tu as marqués, et ceux dont tous les épisodes sont vus."); },
  get abandoned() { return ui("Ce que tu ne veux plus suivre. Ta progression est gardée ; « Retirer du suivi » enlève un titre d'ici sans rien effacer."); },
};

const EMPTY: Record<SmartView, { title: string; text: string }> = {
  continue: { get title() { return ui("Rien à continuer"); }, get text() { return ui("Les anime que tu commences apparaissent ici."); } },
  completed: { get title() { return ui("Aucun anime terminé"); }, get text() { return ui("Un anime est terminé quand tu le marques, ou quand tous ses épisodes sont vus et qu'il est fini sur AniList."); } },
  abandoned: { get title() { return ui("Aucun anime abandonné"); }, get text() { return ui("Depuis la fiche d'un anime commencé, « Abandonner » le range ici sans rien effacer."); } },
};

/**
 * One of the automatic views of the library. They are filters over what you did, not lists you fill: an entry is here
 * because of its progress and its state, and leaves when that changes.
 */
export function SmartViewScreen({ view }: { view: SmartView }) {
  useInterfaceLanguage();
  const views = useSmartViews();
  const entries = views?.[view];
  return (
    <div>
      <DetailTopBar fallback={routes.lists()} label={ui("Retour aux listes")} title={SMART_VIEW_LABELS[view]} />
      <header className="px-safe pt-2 pb-4">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">{SMART_VIEW_LABELS[view]}</h1>
        <p className="mt-1 text-[14px] text-soft">{INTRO[view]}</p>
      </header>
      <div className="px-safe">
        {entries === undefined ? (
          <div className="flex flex-col gap-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-20 rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState title={EMPTY[view].title}>{EMPTY[view].text}</EmptyState>
        ) : (
          <ul className="flex flex-col" data-testid={`smart-view-${view}`}>
            {entries.map((entry) => (
              <li key={entry.anime.id} className="border-b border-line last:border-b-0">
                <Row entry={entry} view={view} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Row({ entry, view }: { entry: LibraryEntry; view: SmartView }) {
  useInterfaceLanguage();
  const { main } = useTitles();
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const summary = entry.anime.summary;
  const title = main(summary.titles);
  const total = availableEpisodeCount(summary) ?? summary.episodeCount;
  const seen = watchedCount(entry.progress);
  const explicit = entry.state;
  const abandoned = abandonedNow(explicit, entry.progress);
  const undo = (previous: LibraryEntry["state"]) => ({ label: ui("Annuler"), onSelect: () => void (previous ? setLibraryState(entry.anime.id, previous.state, previous.at) : clearLibraryState(entry.anime.id)), durationMs: HOME.undoMs });

  // What the row offers depends on the view: abandon from À continuer; take it back (or leave the tracking) from Abandonnés;
  // take a declared Terminé back. The actions live in a small sheet (« … »), never as grey underlined text beside the title.
  // `run` may hand back its own « Annuler » (when undoing is more than restoring the previous state).
  const actions: { label: string; hint: string; run: () => Promise<(() => void) | void>; message: string; testId: string }[] = [];
  if (view === "continue") actions.push({ label: ui("Abandonner"), hint: ui("La progression est conservée"), run: () => setLibraryState(entry.anime.id, "abandoned"), message: ui("Abandonné progression conservée"), testId: "smart-abandon" });
  else if (view === "abandoned" && abandoned) {
    actions.push({ label: ui("Reprendre"), hint: ui("Revient dans À continuer"), run: () => clearLibraryState(entry.anime.id), message: ui("Repris"), testId: "smart-resume" });
    actions.push({ label: ui("Retirer du suivi"), hint: ui("Quitte cette liste ; progression et historique conservés"), run: async () => {
        const done = await removeFromTracking(entry.anime.id);
        return () => void undoRemoveFromTracking(done);
      },
      message: ui("Retiré du suivi progression conservée"),
      testId: "smart-untrack",
    });
  } else if (view === "completed" && explicit?.state === "completed") actions.push({ label: ui("Reprendre"), hint: ui("Retire le marquage « terminé »"), run: () => clearLibraryState(entry.anime.id), message: ui("Retiré de Terminés"), testId: "smart-resume" });

  const note = view === "completed" ? (explicit?.state === "completed" ? ui("Marqué comme terminé") : completedByNumbers(entry) ? ui("Tous les épisodes vus") : null) : null;
  return (
    <div className="flex items-center gap-1 py-2.5" data-testid="smart-row">
      <Link href={routes.anime(entry.anime.id)} className="tactile flex min-h-[4.75rem] min-w-0 flex-1 items-center gap-3.5 active:opacity-80">
        <Poster cover={summary.coverImage} alt="" sizes="52px" className="w-[3.2rem] shrink-0" rounded="rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[15px] leading-snug font-semibold">{title}</p>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-[13px] text-soft">{[total && seen > 0 ? ui("{0}/{1} ép.", seen, total) : seen > 0 ? ui("{0} ép. vus", seen) : null, note].filter(Boolean).map((part) => <span key={part}>{part}</span>)}</p>
          {total && seen > 0 && view !== "completed" ? <ProgressBar value={Math.min(1, seen / total)} label={ui("{0} épisodes vus sur {1}", seen, total)} thin className="mt-1.5" /> : null}
        </div>
      </Link>
      {actions.length > 0 && (
        <>
          <IconButton label={ui("Actions pour {0}", title)} onClick={() => setMenu(true)} data-testid="smart-more">
            <MoreHorizontal size={20} aria-hidden="true" />
          </IconButton>
          <Sheet open={menu} onClose={() => setMenu(false)} title={title}>
            <ul className="-mx-5 divide-y divide-line border-y border-line">
              {actions.map((action) => (
                <li key={action.testId}>
                  <button
                    type="button"
                    onClick={() => {
                      setMenu(false);
                      void action.run().then((own) => toast(action.message, "success", own ? { label: ui("Annuler"), onSelect: own, durationMs: HOME.undoMs } : undo(explicit)));
                    }}
                    className="flex min-h-14 w-full flex-col items-start justify-center px-5 text-left active:bg-surface"
                    data-testid={action.testId}
                  >
                    <span className="text-[16px] text-paper">{action.label}</span>
                    <span className="text-[13px] text-soft">{action.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Sheet>
        </>
      )}
    </div>
  );
}
