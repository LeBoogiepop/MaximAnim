"use client";

import Link from "next/link";
import { useTitles } from "@/features/settings/PreferencesContext";
import { routes } from "@/lib/utils/routes";
import type { CatalogueEntry } from "@/types/anime";
import { StatusText } from "@/components/ui/ListRow";

/**
 * One line of a chronology (« Liste »): the year (full, semi-bold, so the eye can scan it), the title, then what the page
 * says about the work (a person's roles, a studio's kind of work) and its status when it is airing or announced. A finished
 * work says nothing about its status; a missing line is simply absent, never a placeholder.
 */
export function CompactWorkRow({ entry, contributions, watched }: { entry: CatalogueEntry; contributions?: string | null; watched?: boolean }) {
  const { main } = useTitles();
  const year = entry.startDate?.year ?? entry.seasonYear;
  const live = entry.status === "RELEASING" || entry.status === "NOT_YET_RELEASED";
  return (
    <Link href={routes.anime(entry.id)} className={`compact-work-row ${watched ? "work-watched" : ""}`} data-testid="work-row">
      {/* Inline style: the shared compact-filmography stylesheet sets a quieter year; here it must lead the row. */}
      <span className="compact-work-year tabular-nums" style={{ color: "var(--color-paper)", fontWeight: 600, fontSize: 14 }} data-testid="work-year">{year ?? "—"}</span>
      <span className="compact-work-title">{main(entry.titles)}</span>
      {(contributions || live) && (
        <span className="compact-work-roles" data-testid="work-roles">
          {contributions}
          {live && <span><StatusText status={entry.status} anime /></span>}
        </span>
      )}
    </Link>
  );
}
