"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { Poster } from "@/components/ui/Poster";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ListRow, MetaLine, StatusText } from "@/components/ui/ListRow";
import { useTitles } from "@/features/settings/PreferencesContext";
import { seasonLabel } from "@/lib/franchise/label";
import { relationLabel } from "@/lib/anilist/editorial";
import type { ProgressRecord } from "@/lib/db/types";
import { watchedCount } from "@/lib/progress/logic";
import { lengthLabel } from "@/lib/utils/facts";
import { formatLabel } from "@/lib/utils/format";
import { routes } from "@/lib/utils/routes";
import { FRANCHISE } from "@/config/app";
import type { AnimeEntry, FranchiseMember } from "@/types/anime";

/**
 * The word that says what a SECONDARY work is (Film, OVA, ONA, Spécial): there it helps. The main series never repeats
 * « Série » on every row — the heading above it already says so.
 */
export function secondaryType(entry: AnimeEntry): string | null {
  switch (entry.format) {
    case "TV":
      // A short TV entry the chain runs through (a special between two seasons): not a season, not a film.
      return entry.episodeCount != null && entry.episodeCount < FRANCHISE.minSeasonEpisodes ? ui("Spécial") : formatLabel(entry.format);
    case null:
      return null;
    default:
      return formatLabel(entry.format);
  }
}

/**
 * One entry of a franchise, answering at a glance: which season (or what kind of work), what it is called, when, how long,
 * where it stands, whether it is the one you came from — and how far you got. Not a card: a row on a hairline.
 */
export function FranchiseEntryRow({ member, current, progress }: { member: FranchiseMember; current: boolean; progress: ProgressRecord[] | undefined }) {
  useInterfaceLanguage();
  const { main } = useTitles();
  const entry = member.entry;
  const total = entry.episodeCount ?? null;
  const seen = watchedCount(progress ?? []);
  const year = entry.startDate?.year ?? entry.seasonYear;
  const length = lengthLabel(entry);
  const eyebrow = member.kind === "main" ? seasonLabel(member) : secondaryType(entry);
  // Numbered main seasons already carry their place. A reverse offshoot edge must not relabel the lead as an alternative.
  const relation = member.kind === "main" ? null : relationLabel(member.relation, entry.id, member.relationFrom);
  return (
    <ListRow
      href={routes.anime(entry.id)}
      testId="franchise-entry"
      current={current}
      leading={<Poster cover={entry.coverImage} alt="" sizes="48px" className="w-12 shrink-0" rounded="rounded-lg" />}
      eyebrow={eyebrow}
      title={main(entry.titles)}
      meta={
        <>
          <MetaLine>
            {relation && <span className="context-accent">{relation}</span>}
            {year != null && <span className="tabular-nums">{year}</span>}
            {length && <span>{length}</span>}
            <StatusText status={entry.status} />
          </MetaLine>
          {seen > 0 && total ? (
            <span className="mt-1.5 flex items-center gap-2">
              <ProgressBar value={seen / total} label={ui("{0} épisodes vus sur {1}", seen, total)} thin className="flex-1" />
              <span className="shrink-0 text-[12px] text-soft tabular-nums">{ui("{0} vus sur {1}", seen, total)}</span>
            </span>
          ) : null}
        </>
      }
    />
  );
}
