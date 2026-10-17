"use client";

import { CompactWorkRow } from "@/features/catalogue/CompactWorkRow";
import { formatLabel } from "@/lib/utils/format";
import type { CatalogueEntry } from "@/types/anime";
import { hasWatchedWork } from "@/features/catalogue/ViewingBadge";
import type { ProgressRecord, LibraryStateRecord } from "@/lib/db/types";

/**
 * A work on a STUDIO's page: the year, the title, the kind of work when it is not a plain series (a film, an OVA) and its
 * status only when it is airing or announced. AniList does not say what a studio did on a production, so no role is
 * written here — not even a placeholder one. Nothing about what the anime was adapted from.
 */
export function StudioWorkRow({ entry, progress = [], state }: { entry: CatalogueEntry; progress?: ProgressRecord[]; state?: LibraryStateRecord }) {
  const kind = entry.format && entry.format !== "TV" && entry.format !== "TV_SHORT" ? formatLabel(entry.format) : null;
  return <CompactWorkRow entry={entry} contributions={kind} watched={hasWatchedWork(progress, state)} />;
}
