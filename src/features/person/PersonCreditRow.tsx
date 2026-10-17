"use client";

import { CompactWorkRow } from "@/features/catalogue/CompactWorkRow";
import { shownRoles } from "@/lib/catalogue/credits";
import type { CatalogueEntry } from "@/types/anime";
import { hasWatchedWork } from "@/features/catalogue/ViewingBadge";
import type { ProgressRecord, LibraryStateRecord } from "@/lib/db/types";

/**
 * A work on a PERSON's page: the year, the title, then what they did on it (that is what the page is for), and the status
 * only for what is airing or announced. Never what the anime was adapted from: that describes the anime, not the person's work.
 */
export function PersonCreditRow({ entry, roles, progress = [], state }: { entry: CatalogueEntry; roles: readonly string[]; progress?: ProgressRecord[]; state?: LibraryStateRecord }) {
  return <CompactWorkRow entry={entry} contributions={shownRoles(roles, Number.MAX_SAFE_INTEGER).lines.join(", ")} watched={hasWatchedWork(progress, state)} />;
}
