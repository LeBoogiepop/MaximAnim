"use client";

import { ui, localizeOwnedText } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SectionTitle } from "@/components/ui/Section";
import { Poster } from "@/components/ui/Poster";
import { relatedCaption } from "@/lib/franchise/caption";
import { et } from "@/lib/i18n/messages-entities";
import { intent } from "@/features/catalogue/queries";
import { useTitles } from "@/features/settings/PreferencesContext";
import { locate, seasonGroups } from "@/lib/franchise/seasons";
import { groupOthers } from "@/lib/franchise/resolve";
import { routes } from "@/lib/utils/routes";
import type { Franchise, FranchiseMember } from "@/types/anime";

/**
 * The season row, right under the title: ONE row of capsules that scrolls sideways inside the page (never a native menu, never a
 * sheet). `S1  S2  S3`, no heading, no repeated « Saison N ». A season AniList split into several cours carries its parts INSIDE its
 * capsule: folded, one grey container keeps only the part being read (« Partie 2 », with a chevron — never a bare « P2 », so it is
 * clear there are others); touching the season, or that container, unfolds every part in the same container; choosing one folds it
 * back. The way into the franchise is a quiet action at the end of the row. Each season / part is still its own AniList entry (own
 * id, own progress, own facts); choosing is choosing CONTENT inside the page (the shell stays, the URL is replaced, never pushed):
 * nothing is merged. While the walk is still looking for the other seasons nothing is numbered yet (a provisional « S2 » that
 * becomes « S3 » is worse than a moment of waiting). A long runner is not made of seasons: its entries are capsules named by what
 * they are called, in the same scrolling row.
 */
export function SeasonStrip({ franchise, currentId, resolved = true, failed = false, onSelect, showNotice = true }: { franchise: Franchise; currentId: number; resolved?: boolean; failed?: boolean; /** The fiche places this information below the facts, outside its fixed controls. */ showNotice?: boolean; onSelect?: (entryId: number) => void }) {
  useInterfaceLanguage();
  const { main } = useTitles();
  const queryClient = useQueryClient();
  // The entry whose parts are unfolded. Touching a season (or its folded part) unfolds the parts of the entry it leads to.
  const [unfolded, setUnfolded] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (unfolded == null) return;
    const away = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setUnfolded(null); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [unfolded]);
  // The capsule on show is brought into view along the row (the row scrolls sideways; the page never moves).
  useEffect(() => {
    const row = root.current?.querySelector<HTMLElement>(".season-scroll");
    const on = row?.querySelector<HTMLElement>('.season-capsule[data-active="true"]');
    if (!row || !on) return;
    const start = on.offsetLeft - row.offsetLeft, end = start + on.offsetWidth;
    if (start < row.scrollLeft + 16) row.scrollLeft = Math.max(0, start - 16);
    else if (end > row.scrollLeft + row.clientWidth - 28) row.scrollLeft = end - row.clientWidth + 28;
  }, [currentId, unfolded]);
  if (franchise.main.length < 2) return null;
  const link = (
    <Link href={routes.franchise(currentId)} className="season-franchise flex min-h-11 shrink-0 items-center gap-0.5 pl-3 text-[14px] text-soft transition-opacity active:opacity-60" data-testid="franchise-link">
      <span>Franchise</span>
      <ChevronRight size={16} className="text-accent" aria-hidden="true" />
    </Link>
  );
  const select = (entryId: number, active: boolean) => ({
    href: routes.anime(entryId),
    replace: true,
    scroll: false,
    onClick: (e: React.MouseEvent) => {
      // A modified click (new tab…) keeps the link's own behaviour.
      if (!onSelect || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      if (!active) onSelect(entryId);
    },
    onPointerDown: () => !active && intent.anime(queryClient, entryId),
  });
  if (failed && !resolved) {
    return (
      <section aria-label={ui("Saisons")} className="px-safe" data-testid="season-strip">
        <div className="season-rail">
          <p className="min-w-0 flex-1 text-[15px] text-soft">{ui("Les autres saisons n'ont pas pu être chargées.")}</p>
          {link}
        </div>
      </section>
    );
  }
  if (franchise.continuous) {
    // A long runner (Bleach: the 2004 series and each part of the war): every entry is a capsule named by its own title and year,
    // in the same row that scrolls sideways. Nothing is numbered; nothing opens a menu.
    return (
      <section ref={root} aria-label={ui("Série")} className="px-safe" data-testid="season-strip">
        <div className="season-rail">
          <ul className="tab-scroller season-scroll min-w-0 flex-1" data-testid="season-tabs">
            {franchise.main.map((m) => {
              const active = m.entry.id === currentId;
              const year = m.entry.startDate?.year ?? m.entry.seasonYear;
              const status = m.entry.status === "RELEASING" ? et("En diffusion") : m.entry.status === "NOT_YET_RELEASED" ? et("À venir") : null;
              return (
                <li key={m.entry.id} className="shrink-0">
                  <div className="season-capsule" data-active={active ? "true" : "false"}>
                    <Link {...select(m.entry.id, active)} aria-current={active ? "true" : undefined} data-testid="season-chip" data-active={active ? "true" : undefined} className="season-hit sc-label max-w-[15rem]">
                      <span className="truncate">{main(m.entry.titles)}</span>
                      {year != null && <span className="sc-sub tabular-nums">{year}</span>}
                      {status && <span className={`sc-sub ${m.entry.status === "RELEASING" ? "text-green" : "text-cream"}`}>{status}</span>}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
          {link}
        </div>
      </section>
    );
  }
  const groups = resolved ? seasonGroups(franchise) : null;
  const here = locate(groups ?? [], currentId);
  return (
    <section ref={root} aria-label={ui("Saisons")} className="px-safe" data-testid="season-strip" aria-busy={!resolved}>
      <div className="season-rail">
        {!groups ? (
          <div className="flex min-w-0 flex-1 gap-3" aria-hidden="true" data-testid="season-loading">
            {franchise.main.map((m) => (
              <span key={m.entry.id} className="skeleton h-10 w-14 rounded-[1.25rem]" />
            ))}
          </div>
        ) : (
          <ul className="tab-scroller season-scroll min-w-0 flex-1" data-testid="season-tabs">
            {groups.map((g) => {
              const active = here?.group.season === g.season;
              const hasParts = g.parts.length > 1;
              // Staying on the season keeps the part being read; coming from another season opens its first part.
              const target = active ? currentId : g.parts[0]!.entryId;
              const open = active && hasParts && unfolded === currentId;
              const props = select(target, active);
              return (
                <li key={g.season} className="shrink-0">
                  <div className="season-capsule" data-active={active ? "true" : "false"} data-open={open ? "true" : "false"} data-parts={hasParts ? "true" : "false"}>
                    <Link
                      {...props}
                      onClick={(e) => {
                        // The season already on show has nowhere to go: touching it unfolds / folds its parts.
                        if (active) { e.preventDefault(); if (hasParts) setUnfolded(open ? null : currentId); return; }
                        props.onClick(e);
                        if (hasParts) setUnfolded(target);
                      }}
                      aria-current={active ? "true" : undefined}
                      aria-expanded={active && hasParts ? open : undefined}
                      aria-label={active ? `${ui("Saison {0}", g.season)} ${ui("(cette fiche)")}` : ui("Saison {0}", g.season)}
                      title={main(g.parts[0]!.member.entry.titles)}
                      data-testid="season-chip"
                      data-active={active ? "true" : undefined}
                      className="season-hit sc-label tabular-nums"
                    >
                      {g.label}
                    </Link>
                    {active && hasParts && (
                      <div className="sc-parts" data-testid="season-parts-slot">
                        <nav className="contents" aria-label={ui("Partie de la saison {0}", g.season)} data-testid="season-part-tabs">
                          {g.parts.map((p) => {
                            const current = p.entryId === currentId;
                            const part = select(p.entryId, current);
                            return (
                              <Link
                                key={p.entryId}
                                {...part}
                                onClick={(e) => {
                                  // Folded, the part on show is the way to unfold; unfolded, a part is chosen and the capsule folds back.
                                  if (!open) { e.preventDefault(); setUnfolded(currentId); return; }
                                  part.onClick(e);
                                  setUnfolded(null);
                                }}
                                aria-current={current ? "page" : undefined}
                                tabIndex={open || current ? undefined : -1}
                                className="sc-part"
                                data-active={current ? "true" : "false"}
                              >
                                <span>{ui("Partie") + " "}{p.part}</span>
                              </Link>
                            );
                          })}
                          <ChevronDown size={14} className="sc-chev" aria-hidden="true" />
                        </nav>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {link}
      </div>
      {showNotice && resolved && franchise.truncated && <p className="mt-1 text-[12px] text-muted">{ui("Franchise très longue : la liste peut être incomplète.")}</p>}
    </section>
  );
}

/** Films, specials, side stories… as rails under the main information, never mixed with the seasons. */
export function FranchiseOthers({ franchise, currentId }: { franchise: Franchise; currentId: number }) {
  useInterfaceLanguage();
  const withoutCurrent = { ...franchise, others: franchise.others.filter((m) => m.entry.id !== currentId) };
  const main = franchise.main.filter(m => m.entry.id !== currentId);
  const groups = [...(main.length ? [{ kind: "main", title: ui("Saisons"), items: main }] : []), ...groupOthers(withoutCurrent)];
  if (!groups.length) return null;
  return (
    <section aria-labelledby="franchise-title" className="flex flex-col gap-5" data-testid="franchise-others">
      <div className="px-safe flex min-h-11 items-center justify-between gap-3">
        <SectionTitle id="franchise-title">{ui("Autour de la série")}</SectionTitle>
        {franchise.main.length < 2 && <Link href={routes.franchise(currentId)} className="fact-link flex min-h-11 items-center gap-1 text-[14px]">Franchise<ChevronRight size={16} aria-hidden="true" /></Link>}
      </div>
      {groups.map((group) => (
        <div key={group.kind}>
          <h3 className="px-safe mb-2 text-[15px] font-semibold text-soft">{localizeOwnedText(group.title)}</h3>
          <ul className="rail">
            {group.items.map((m) => (
              <li key={m.entry.id}>
                <RelatedCard member={m} currentId={currentId} franchise={franchise} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

/**
 * A related work as a small card: cover, title, then separate lines (what it is, how it relates, full year, status) that are
 * never clipped to an ellipsis and carry no episode count.
 */
function RelatedCard({ member, currentId, franchise }: { member: FranchiseMember; currentId: number; franchise: Franchise }) {
  const { main } = useTitles();
  const queryClient = useQueryClient();
  const caption = relatedCaption(member, currentId, franchise);
  const title = main(member.entry.titles);
  const airing = member.entry.status === "RELEASING";
  return (
    <Link href={routes.anime(member.entry.id)} className="group block w-[7.4rem]" onPointerDown={() => intent.anime(queryClient, member.entry.id)} aria-label={[title, caption.kind, caption.relation, caption.continues, caption.year, caption.status].filter(Boolean).join(", ")} data-testid="related-card">
      <div className="lift relative transition-opacity duration-150 group-active:opacity-70">
        <Poster cover={member.entry.coverImage} alt="" sizes="120px" />
      </div>
      <p className="mt-2 line-clamp-2 text-[13.5px] leading-tight font-medium">{title}</p>
      <p className="mt-1 text-[13px] leading-snug font-medium text-paper" data-testid="related-kind">{caption.kind}</p>
      {caption.relation && <p className="text-[12.5px] leading-snug text-soft" data-testid="related-relation">{caption.relation}</p>}
      {caption.continues && <p className="text-[12.5px] leading-snug text-muted" data-testid="related-continues">{caption.continues}</p>}
      {(caption.year != null || caption.status) && (
        <p className="flex flex-wrap gap-x-2 text-[12.5px] leading-snug tabular-nums">
          {caption.year != null && <span className="text-soft">{caption.year}</span>}
          {caption.status && <span className={airing ? "font-medium text-green" : "font-medium text-cream"}>{caption.status}</span>}
        </p>
      )}
    </Link>
  );
}
