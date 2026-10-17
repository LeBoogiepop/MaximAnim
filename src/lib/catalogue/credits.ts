import { ui } from "@/lib/i18n/translate";
import { creditCoversEpisode, episodesOf } from "@/lib/anilist/role-parser";
import { mergeRoles, ROLE_CATEGORIES, type RoleCategory, roleCategory } from "@/lib/anilist/roles";

/**
 * A person's (or a whole staff's) credits as pages of AniList give them: one line per role, a work credited many times
 * across pages. Merged per work, dubs left out (original audio only: a dub credit is never presented as a credit of the
 * work), filterable by the kind of work done and by the episode a credit names. Pure.
 */

export interface Credit<E> {
  entry: E;
  /** Every credit line of the person on this work, as AniList wrote them, once each. Never a dub's. */
  roles: string[];
}

/** One work per row: the same work credited on several lines or pages is one row holding every role once. */
export function mergeCredits<E extends { id: number }>(lines: readonly { entry: E; role: string | null }[]): Credit<E>[] {
  const byWork = new Map<number, Credit<E>>();
  const unspecified = new Set<number>();
  for (const { entry, role } of lines) {
    const row = byWork.get(entry.id) ?? { entry, roles: [] };
    byWork.set(entry.id, row);
    if (!role?.trim()) unspecified.add(entry.id);
    if (role && roleCategory(role) !== "dub" && !row.roles.includes(role)) row.roles.push(role);
  }
  // A work whose only credits are a dub's is not a credit of the original version at all.
  return [...byWork.values()].filter((c) => c.roles.length > 0 || unspecified.has(c.entry.id));
}

/** Credit lines of one person on one work, once each, a dub's left out. */
export function cleanRoles(roles: readonly string[]): string[] {
  return [...new Set(roles)].filter((r) => roleCategory(r) !== "dub");
}

export type CategoryFilter = RoleCategory | "all";

/** The kinds of work done that are actually present, in the usual reading order. Nothing is offered that matches nothing. */
export function categoriesPresent(credits: readonly { roles: readonly string[] }[]): RoleCategory[] {
  const present = new Set<RoleCategory>();
  for (const c of credits) {
    if (!c.roles.length) present.add("other");
    for (const r of c.roles) present.add(roleCategory(r));
  }
  present.delete("dub");
  return ROLE_CATEGORIES.map((c) => c.key).filter((k) => present.has(k));
}

/** Only the works with at least one credit of that kind, each narrowed to the credits of that kind. */
export function filterByCategory<E>(credits: readonly Credit<E>[], category: CategoryFilter): Credit<E>[] {
  if (category === "all") return [...credits];
  return credits.flatMap((c) => {
    if (category === "other" && !c.roles.length) return [c];
    const roles = c.roles.filter((r) => roleCategory(r) === category);
    return roles.length ? [{ ...c, roles }] : [];
  });
}

/** The episode numbers the credits name (for an « Épisode » filter). Empty: no filter is offered. */
export function creditEpisodes(credits: readonly { roles: readonly string[] }[]): number[] {
  return episodesOf(credits.flatMap((c) => c.roles));
}

/** Only the credits that name this episode (an open range covers every later one); people with none are left out. */
export function filterByEpisode<T extends { roles: readonly string[] }>(items: readonly T[], episode: number): T[] {
  return items.flatMap((item) => {
    const roles = item.roles.filter((r) => creditCoversEpisode(r, episode));
    return roles.length ? [{ ...item, roles }] : [];
  });
}

/** What a row says of a person's work on it: the roles merged and said in French, the first few, then « +N ». */
export function shownRoles(roles: readonly string[], max = 2): { lines: string[]; more: number } {
  if (!roles.length) return { lines: [ui("Participation · fonction non précisée")], more: 0 };
  const merged = mergeRoles(roles);
  return { lines: merged.slice(0, max), more: Math.max(0, merged.length - max) };
}

/**
 * « Tout le staff » by kind of work: for each kind (in reading order) the people who hold at least one credit of that kind,
 * each narrowed to those credits — a person with two kinds of credit appears in both, saying only what belongs to each.
 */
export function groupPeopleByCategory<P extends { roles: readonly string[] }>(people: readonly P[]): { category: RoleCategory; label: string; people: P[] }[] {
  return ROLE_CATEGORIES.filter((c) => c.key !== "dub")
    .map(({ key, label }) => ({ category: key, label, people: people.flatMap((p) => { const roles = p.roles.filter((r) => roleCategory(r) === key); return roles.length ? [{ ...p, roles }] : []; }) }))
    .filter((g) => g.people.length > 0);
}
