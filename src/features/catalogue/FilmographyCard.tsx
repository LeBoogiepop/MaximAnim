"use client";
import { StatusText } from "@/components/ui/ListRow";
import Link from "next/link";
import { Poster } from "@/components/ui/Poster";
import { useTitles } from "@/features/settings/PreferencesContext";
import { hasWatchedWork } from "./ViewingBadge";
import { shownRoles } from "@/lib/catalogue/credits";
import { routes } from "@/lib/utils/routes";
import type { CatalogueEntry } from "@/types/anime";
import type { ProgressRecord, LibraryStateRecord } from "@/lib/db/types";
export function FilmographyCard({ entry, roles, progress = [], state }: { entry: CatalogueEntry; roles?: readonly string[]; progress?: ProgressRecord[]; state?: LibraryStateRecord }) {
  const { main } = useTitles();
  const watched = hasWatchedWork(progress, state);
  const shown = roles ? shownRoles(roles) : null;
  return <Link href={routes.anime(entry.id)} className={`flex min-w-0 flex-col gap-1 pb-3 ${watched ? "work-watched" : ""}`} data-testid="work-row">
    <Poster cover={entry.coverImage} alt="" sizes="(min-width: 1024px) 150px, (min-width: 640px) 18vw, 29vw" />
    <span className="text-sm font-semibold leading-snug wrap-anywhere">{main(entry.titles)}</span>
    {shown && <span className="text-xs text-soft" data-testid="work-roles">{shown.lines.join(", ")}{shown.more > 0 ? `, +${shown.more}` : ""}</span>}
    <span className="text-xs text-soft"><StatusText status={entry.status} anime /></span>
  </Link>;
}
