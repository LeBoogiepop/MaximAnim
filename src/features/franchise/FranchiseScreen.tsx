"use client";


import { ui, localizeOwnedText } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { DetailTopBar } from "@/components/layout/DetailTopBar";
import { ToneGlow, toneVars } from "@/components/layout/ToneScope";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Poster } from "@/components/ui/Poster";
import { SectionTitle } from "@/components/ui/Section";
import { FRANCHISE } from "@/config/app";
import { useProgressIndex } from "@/features/library/hooks";
import { useTitles } from "@/features/settings/PreferencesContext";
import { franchiseHeader, type FranchiseHeader } from "@/lib/franchise/label";
import { FranchiseNotFound, groupOthers } from "@/lib/franchise/resolve";
import { useContentMark } from "@/lib/perf/use-content-mark";
import { routes } from "@/lib/utils/routes";
import { useArtworkTone } from "@/components/layout/ArtworkPalette";
import { foundationOf } from "@/lib/anilist/editorial";
import { SOURCE_LABELS } from "@/lib/utils/format";
import { FactList, FactRow } from "@/components/ui/FactList";
import type { Franchise } from "@/types/anime";
import { FranchiseEntryRow } from "./FranchiseEntryRow";
import { useFranchiseOf } from "./useFranchise";

/**
 * « Franchise »: a series as one thing to browse — the seasons in story order, then the films, specials and side stories
 * apart. Every row is still its own AniList entry (its own page, its own progress); the id in the URL is only the entry the
 * walk started from, and it is marked. The page stays graphite: the cover's colour is a corner glow and the active line.
 */
export function FranchiseScreen({ id }: { id: number }) {
  useInterfaceLanguage();
  const query = useFranchiseOf(id);
  if (query.isPending) return <FranchiseSkeleton fallback={routes.anime(id)} />;
  if (query.isError) {
    const missing = query.error instanceof FranchiseNotFound;
    return (
      <div>
        <DetailTopBar fallback={routes.anime(id)} label={ui("Retour à la fiche")} />
        <div className="px-safe mt-6">
          <EmptyState
            title={missing ? ui("Cette série est introuvable") : ui("Impossible de charger la franchise")}
            tone={missing ? "calm" : "warning"}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {!missing && (
                  <button type="button" onClick={() => void query.refetch()} className="min-h-11 rounded-xl border border-line bg-surface px-4 text-[15px] font-semibold">
                    {ui("Réessayer")}</button>
                )}
                <ButtonLink href={routes.anime(id)} variant="secondary">
                  {ui("Retour à la fiche")}</ButtonLink>
              </div>
            }
          >
            {missing ? ui("AniList n'a pas cette entrée.") : ui("AniList est injoignable : les saisons n'ont pas pu être listées.")}
          </EmptyState>
        </div>
      </div>
    );
  }
  return <FranchiseView franchise={query.data} currentId={id} />;
}

const STATE_TONE: Record<FranchiseHeader["stateKey"], string> = { airing: "text-green", sequel: "text-cream", upcoming: "text-cream", finished: "text-soft" };

function FranchiseView({ franchise, currentId }: { franchise: Franchise; currentId: number }) {
  useInterfaceLanguage();
  const { main } = useTitles();
  const all = [...franchise.main, ...franchise.others];
  const progress = useProgressIndex(all.map((m) => m.entry.id));
  const { tone, onArtworkLoad } = useArtworkTone(franchise.lead);
  const foundation = foundationOf(all.map(m => m.entry.id));
  const header = franchiseHeader(franchise);
  const cover = franchise.lead.coverImage;
  useContentMark(`franchise:${currentId}`, true);

  return (
    <div className="page-in contextual-content" style={toneVars(tone)}>
      <DetailTopBar fallback={routes.anime(currentId)} label={ui("Retour à la fiche")} title={main(franchise.lead.titles)} />
      <header className="relative overflow-hidden">
        <ToneGlow />
        <div className="px-safe relative pt-4 pb-6">
          <div className="mx-auto flex max-w-4xl items-end gap-4">
            <div className="w-[6.5rem] shrink-0">
              <Poster cover={cover} alt="" sizes="104px" priority onArtworkLoad={onArtworkLoad} />
            </div>
            <div className="min-w-0 pb-1" data-testid="franchise-header">
              <h1 className="display-title">{main(franchise.lead.titles)}</h1>
              <p className="mt-2 text-[16px] font-medium">{header.count}</p>
              {header.period && <p className="text-[15px] text-soft tabular-nums">{header.period}</p>}
              <p className={`mt-0.5 text-[14px] font-medium ${STATE_TONE[header.stateKey]}`}>{header.state}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-8 pt-1">
        {foundation && <div className="px-safe"><FactList><FactRow label={ui("Source fondatrice")} href={foundation.href}><span>{SOURCE_LABELS[foundation.source]}</span></FactRow></FactList></div>}
        <section aria-labelledby="main-title" data-testid="franchise-main">
          <SectionTitle id="main-title" className="px-safe mb-1">
            {franchise.continuous ? ui("Série principale") : ui("Saisons")}
          </SectionTitle>
          <ul className="px-safe flex flex-col divide-y divide-line">
            {franchise.main.map((m) => (
              <li key={m.entry.id}>
                <FranchiseEntryRow member={m} current={m.entry.id === currentId} progress={progress?.[m.entry.id]} />
              </li>
            ))}
          </ul>
        </section>

        {groupOthers(franchise).map((group) => (
          <Group key={group.kind} group={group} currentId={currentId} progress={progress} />
        ))}

        {franchise.truncated && <p className="px-safe text-[13px] text-muted">{ui("Franchise très longue : la liste peut être incomplète.")}</p>}
      </div>
    </div>
  );
}

/** A group of secondary works: the first few, the rest one tap away (never fifty rows at once), the one you are on always shown. */
function Group({ group, currentId, progress }: { group: ReturnType<typeof groupOthers>[number]; currentId: number; progress: ReturnType<typeof useProgressIndex> }) {
  useInterfaceLanguage();
  const [all, setAll] = useState(false);
  const keep = group.items.filter((m, i) => i < FRANCHISE.groupPreview || m.entry.id === currentId);
  const shown = all ? group.items : keep;
  const hidden = group.items.length - shown.length;
  return (
    <section aria-label={localizeOwnedText(group.title)} data-testid={`franchise-group-${group.kind}`}>
      <SectionTitle className="px-safe mb-1">{localizeOwnedText(group.title)}</SectionTitle>
      <ul className="px-safe flex flex-col divide-y divide-line">
        {shown.map((m) => (
          <li key={m.entry.id}>
            <FranchiseEntryRow member={m} current={m.entry.id === currentId} progress={progress?.[m.entry.id]} />
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button type="button" onClick={() => setAll(true)} className="px-safe flex min-h-12 items-center gap-1 text-[15px] font-medium text-paper active:text-accent" data-testid={`franchise-more-${group.kind}`}>
          {ui("Afficher les {0} autres", hidden)}
          <ChevronDown size={16} className="text-accent" aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

function FranchiseSkeleton({ fallback }: { fallback: string }) {
  useInterfaceLanguage();
  return (
    <div aria-busy="true" aria-label={ui("Chargement de la franchise")}>
      <DetailTopBar fallback={fallback} label={ui("Retour à la fiche")} />
      <div className="px-safe mt-2 flex items-end gap-4">
        <div className="skeleton aspect-[5/7] w-[6.5rem] rounded-[var(--radius-poster)]" />
        <div className="flex-1 space-y-2 pb-1">
          <div className="skeleton h-6 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/3 rounded" />
        </div>
      </div>
      <div className="px-safe mt-6 space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3.5">
            <div className="skeleton aspect-[5/7] w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-1/4 rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
