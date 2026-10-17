"use client";

import { Poster } from "@/components/ui/Poster";
import { ListRow, MetaLine, StatusText } from "@/components/ui/ListRow";
import { useTitles } from "@/features/settings/PreferencesContext";
import { formatWithEpisodes } from "@/lib/utils/format";
import { routes } from "@/lib/utils/routes";
import type { CatalogueEntry } from "@/types/anime";

/**
 * An animated adaptation of the work this page is about: what it is (a season, a film…), when, where it stands. Never what
 * it was adapted from — that is the page's own subject, said once at the top.
 */
export function SourceAdaptationRow({ entry }: { entry: CatalogueEntry }) {
  const { main } = useTitles();
  const year = entry.startDate?.year ?? entry.seasonYear;
  return (
    <ListRow
      href={routes.anime(entry.id)}
      testId="work-row"
      leading={<Poster cover={entry.coverImage} alt="" sizes="44px" className="w-11 shrink-0" rounded="rounded-lg" />}
      title={main(entry.titles)}
      meta={
        <MetaLine>
          {formatWithEpisodes(entry) && <span>{formatWithEpisodes(entry)}</span>}
          {year != null && <span className="tabular-nums">{year}</span>}
          <StatusText status={entry.status} />
        </MetaLine>
      }
    />
  );
}
