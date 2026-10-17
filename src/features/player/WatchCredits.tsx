"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { ui } from "@/lib/i18n/translate";
import { distinctRoleNames } from "@/lib/anilist/roles";
import { verifiedPortrait } from "@/lib/credits/portrait";
import { routes } from "@/lib/utils/routes";

export interface CreditPerson {
  /** AniList staff id, only when the match is exact and unique (a link is then allowed). */
  id: number | null;
  /** Latin-script name when known. */
  name: string | null;
  nativeName?: string | null;
  /** AniList's own picture of THIS person (the exact id it came with). Shown only after `verifiedPortrait`. */
  image?: string | null;
}

export interface CreditGroup {
  key: string;
  role: string;
  people: CreditPerson[];
}

export interface CreditStudio {
  id: number;
  name: string;
}

interface CreditRow { key: string; roles: string[]; person: CreditPerson }

/** One row per person, whatever the number of roles they had on this episode (« Réalisation · Storyboard »). */
function rowsOf(groups: readonly CreditGroup[]): CreditRow[] {
  const rows = new Map<string, CreditRow>();
  for (const group of groups) for (const person of group.people) {
    const key = person.id != null ? "id:" + person.id : "name:" + (person.nativeName ?? person.name ?? "");
    const row = rows.get(key) ?? { key, roles: [], person };
    row.roles = distinctRoleNames([...row.roles, group.role]);
    if (!row.person.image && person.image) row.person = { ...row.person, image: person.image };
    rows.set(key, row);
  }
  return [...rows.values()];
}

/** Portraits for the whole grid or for nobody: the names stay on one vertical axis, and nothing stands in for a missing face. */
function gridPortraits(rows: readonly CreditRow[]): boolean {
  return rows.length > 0 && rows.every(({ person }) => person.id != null && verifiedPortrait(person.image) != null);
}

function Face({ image, size }: { image: string; size: number }) {
  // A picture that cannot be loaded leaves nothing behind (no broken-image glyph, no stand-in).
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <span className="credit-face relative block shrink-0 overflow-hidden rounded-full bg-raised" style={{ width: size, height: size }} aria-hidden="true"><Image src={image} alt="" fill sizes={`${size}px`} className="object-cover object-[center_20%]" loading="lazy" onError={() => setFailed(true)} /></span>;
}

/**
 * A person of this episode's team: the role in small capitals, then the name.
 * The whole linked row is tappable; a quiet underline replaces repeated arrows. The portrait (40 px) is there
 * only when every person of the grid has a verified one.
 */
function Person({ row, animeId, portraits }: { row: CreditRow; animeId: number; portraits: boolean }) {
  const { person } = row;
  const label = person.name ?? person.nativeName ?? "";
  const portrait = portraits ? verifiedPortrait(person.image) : null;
  const linked = person.id != null && person.name != null;
  const body = <>
    {portrait && <Face image={portrait} size={40} />}
    <span className="min-w-0">
      <span className="credit-role block">{row.roles.join(" · ")}</span>
      <span className="credit-name"><span lang={!person.name ? "ja" : undefined} className="wrap-anywhere">{label}</span></span>
    </span>
  </>;
  return linked
    ? <Link href={routes.person(person.id!, animeId)} className="credit-person active:opacity-70" title={person.nativeName ?? undefined} data-testid="credit-person">{body}</Link>
    : <span className="credit-person">{body}</span>;
}

/**
 * What sits under the title, in this order: the animation STUDIO (one caption line, the name a link in the work's colour), then
 * « Équipe de l'épisode » (only credits verified for THIS episode: a compact two-column grid), then ONE row, « Équipe complète »,
 * with a few verified faces, that opens the whole staff — only when there is a staff to open. A level with nothing verified is simply
 * not drawn: no placeholder, no invented role, no counter, no second list of the series' roles. A film has no episode team: its own
 * crew (the series level of a single item) takes that place.
 */
export function WatchCredits({ animeId, episode, series, studios, film = false, episodeNumber }: {
  animeId: number;
  episode: readonly CreditGroup[];
  series: readonly CreditGroup[];
  studios: readonly CreditStudio[];
  /** A film: its general crew is the film's own. */
  film?: boolean;
  episodeNumber?: number;
}) {
  useInterfaceLanguage();
  const rows = rowsOf(film ? series : episode);
  if (!rows.length && !series.length && !studios.length && episodeNumber == null) return null;
  const portraits = gridPortraits(rows);
  const faces = [...new Map(series.flatMap(group => group.people).flatMap(person => { const image = person.id != null ? verifiedPortrait(person.image) : null; return image ? [[person.id!, image] as const] : []; })).values()].slice(0, 4);
  return (
    <div className="watch-details px-safe flex min-w-0 flex-col pb-6 lg:px-0" data-testid="watch-info">
      {studios.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-2 text-xs font-medium text-muted" data-testid="watch-credits">
          <span>{studios.length > 1 ? ui("Studios") : ui("Studio")}</span>
          {studios.map((studio, i) => <span key={studio.id} className="inline-flex items-center"><Link href={routes.studio(studio.id)} className="inline-flex min-h-11 items-center gap-0.5 font-semibold wrap-anywhere text-soft active:opacity-70">{studio.name}<ChevronRight size={13} className="text-muted" aria-hidden="true" /></Link>{i < studios.length - 1 && <span className="text-muted" aria-hidden="true">,</span>}</span>)}
        </p>
      )}
      {!film && !rows.length && episodeNumber != null && <Link href={`${routes.staff(animeId)}?episode=${episodeNumber}`} className="mt-2 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold context-accent" data-testid="episode-team-link">{ui("Équipe de l'épisode")}<ChevronRight size={15} aria-hidden="true" /></Link>}
      {rows.length > 0 && (
        <section aria-labelledby="watch-team" data-testid={film ? "series-credits" : "episode-credits"}>
          <h2 id="watch-team" className="credit-eyebrow context-accent" data-testid="team-eyebrow">{film ? ui("Équipe du film") : episodeNumber != null ? <Link href={`${routes.staff(animeId)}?episode=${episodeNumber}`} className="inline-flex min-h-11 items-center gap-2" data-testid="episode-team-link">{ui("Équipe de l'épisode")}<ChevronRight size={15} aria-hidden="true" /></Link> : ui("Équipe de l'épisode")}</h2>
          <ul className="credit-grid">
            {rows.map(row => <li key={row.key} className="min-w-0" data-testid="credit-group"><Person row={row} animeId={animeId} portraits={portraits} /></li>)}
          </ul>
        </section>
      )}
      {series.length > 0 && (
        <Link href={routes.staff(animeId)} className="credit-all active:opacity-70" data-testid="team-all">
          <span className="min-w-0 flex-1 text-[16px] font-semibold">{ui("Équipe complète")}</span>
          {faces.length > 0 && <span className="flex" aria-hidden="true">{faces.map((src, i) => <span key={src} className={i ? "-ml-2.5" : ""} style={{ boxShadow: "0 0 0 2px #000", borderRadius: "9999px" }}><Face image={src} size={28} /></span>)}</span>}
          <ChevronRight size={16} className="shrink-0 text-[var(--tone,var(--color-accent))]" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
