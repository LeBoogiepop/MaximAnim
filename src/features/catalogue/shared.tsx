"use client";


import { ui, localizeOwnedText } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { DetailTopBar } from "@/components/layout/DetailTopBar";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { AniListError } from "@/lib/anilist/client";

/**
 * Pieces shared by the pages that sit around an anime — a person, a studio, the work it adapts, all its credits: the
 * three honest states (loading, not found, unreachable). Each page has its own rows: what a row says depends on the page.
 */

/** One more try for a flaky network; AniList saying « not found » is final. */
export const retryTransient = (count: number, error: unknown) => !(error instanceof AniListError && error.kind === "notFound") && count < 1;

/** What AniList does not have, a failed request, and a request in flight are three different pages. */
export function PageState({ error, subject, onRetry, back }: { error: unknown; subject: string; onRetry: () => void; back: string }) {
  useInterfaceLanguage();
  const missing = error instanceof AniListError && error.kind === "notFound";
  return (
    <div>
      <DetailTopBar fallback={back} />
      <div className="px-safe mt-6">
        <EmptyState
          title={missing ? ui("{0} introuvable", localizeOwnedText(subject)) : ui("Impossible de charger {0}", localizeOwnedText(subject).toLowerCase())}
          tone={missing ? "calm" : "warning"}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {!missing && (
                <button type="button" onClick={onRetry} className="min-h-11 rounded-xl border border-line bg-surface px-4 text-[15px] font-semibold">
                  {ui("Réessayer")}</button>
              )}
              <ButtonLink href={back} variant="secondary">
                {ui("Retour")}</ButtonLink>
            </div>
          }
        >
          {missing ? ui("AniList n'a pas cette fiche.") : ui("AniList est injoignable pour le moment.")}
        </EmptyState>
      </div>
    </div>
  );
}

export function PageSkeleton({ label, back = "/" }: { label: string; back?: string }) {
  useInterfaceLanguage();
  return (
    <div aria-busy="true" aria-label={label}>
      <DetailTopBar fallback={back} />
      <div className="px-safe mt-3 flex items-center gap-4">
        <div className="skeleton h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-6 w-3/4 rounded-lg" />
          <div className="skeleton h-4 w-1/3 rounded" />
        </div>
      </div>
      <div className="px-safe mt-8 space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3.5">
            <div className="skeleton aspect-[5/7] w-11 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-4/5 rounded" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
