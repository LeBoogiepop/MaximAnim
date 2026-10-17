"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Poster } from "@/components/ui/Poster";
import { usePreferences, useTitles } from "@/features/settings/PreferencesContext";
import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import type { SeasonRelation } from "@/lib/airing/season";
import { type EntryStatusTag, entryStatusTag } from "@/lib/search/entry-status";
import type { AnimeStatus, AnimeSummary } from "@/types/anime";

const TONES: Record<EntryStatusTag, string> = {
  airing: "text-green",
  upcoming: "text-cream",
  hiatus: "text-soft",
  cancelled: "text-coral",
};

function tagLabel(tag: EntryStatusTag): string {
  switch (tag) {
    case "airing": return ui("En diffusion");
    case "upcoming": return ui("À venir");
    case "hiatus": return ui("En pause");
    case "cancelled": return ui("Annulé");
  }
}

/**
 * Broadcast state of one entry. Status wears colour as text; provenance (the
 * source work) is a neutral outlined chip, so the two meanings never share a
 * visual language. Renders nothing for the default « Terminé ».
 */
export function StatusTag({ status, relation }: { status: AnimeStatus | null | undefined; relation?: SeasonRelation }) {
  useInterfaceLanguage();
  const tag = entryStatusTag(status, relation);
  if (!tag) return null;
  return <span className={`whitespace-nowrap font-semibold ${TONES[tag]}`} data-status={tag}>{tagLabel(tag)}</span>;
}

/** Year then status: two separate elements, spaced by a flex gap, never a "·". */
export function YearStatus({ year, status }: { year: number | null | undefined; status: AnimeStatus | null | undefined }) {
  const tagged = entryStatusTag(status) != null;
  if (year == null && !tagged) return null;
  return (
    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      {year != null && <span className="whitespace-nowrap tabular-nums" data-testid="result-year">{year}</span>}
      <StatusTag status={status} />
    </span>
  );
}

/** Row for search results and history: poster, title, and a free-form meta line. */
export function DiscoveryRow({ anime, href, meta, trailing, priority }: { anime: AnimeSummary; href: string; meta?: ReactNode; trailing?: ReactNode; priority?: boolean }) {
  useInterfaceLanguage();
  const { main } = useTitles();
  const { showAdult } = usePreferences();
  if (anime.isAdult === true && !showAdult) return null;
  return (
    <Link href={href} className="group flex min-h-[5.5rem] items-center gap-3.5 rounded-2xl py-2 active:bg-raised">
      <Poster cover={anime.coverImage} alt="" sizes="64px" priority={priority} className="w-[3.6rem] shrink-0" rounded="rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[15px] leading-snug font-semibold">{main(anime.titles)}</p>
        {meta != null && <div className="mt-1 text-[13px] text-soft">{meta}</div>}
      </div>
      {trailing}
    </Link>
  );
}
