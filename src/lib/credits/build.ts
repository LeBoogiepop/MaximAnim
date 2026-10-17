import { ui } from "@/lib/i18n/translate";
import { frenchRoleName, roleNames } from "@/lib/anilist/roles";
import { parseRole } from "@/lib/anilist/role-parser";
import { routes } from "@/lib/utils/routes";
import type { CreditCategory, CreditEntity, CreditGroup, StaffInput, StudioInput, WatchCredits } from "./types";

/**
 * Turns AniList's staff graph into the credits the player can show — without inventing anything. A credit counts for an
 * episode only when AniList literally names that episode in it (`parseRole`); a general credit counts for the series only
 * for the few roles that really are about the whole work. A director is not the director of every episode, a storyboard
 * credit with no episode is attributed to nothing. Pure.
 */

interface RoleRule {
  category: CreditCategory;
  /** May describe the whole series when AniList gives it with no episode (director, series composition, music…). */
  series: boolean;
}

/** Lower-cased AniList role names that map to a canonical category. Anything else (key animation, producers, dubs…) is never shown. */
const RULES: Record<string, RoleRule> = {
  director: { category: "direction", series: true },
  "chief director": { category: "direction", series: true },
  "series director": { category: "direction", series: true },
  "episode director": { category: "direction", series: false },
  "unit director": { category: "direction", series: false },
  "series composition": { category: "script", series: true },
  script: { category: "script", series: false },
  screenplay: { category: "script", series: false },
  storyboard: { category: "storyboard", series: false },
  "character design": { category: "characterDesign", series: true },
  "chief animation director": { category: "animationDirection", series: true },
  "animation director": { category: "animationDirection", series: false },
  "action animation director": { category: "animationDirection", series: false },
  "art director": { category: "artDirection", series: true },
  music: { category: "music", series: true },
  "original creator": { category: "original", series: true },
  "original story": { category: "original", series: true },
  "original work": { category: "original", series: true },
};

/** Reading order and French label of each category. */
export const CREDIT_CATEGORIES: { key: CreditCategory; label: string }[] = [
  { key: "original", get label() { return ui("Œuvre originale"); } },
  { key: "direction", get label() { return ui("Réalisation"); } },
  { key: "script", get label() { return ui("Scénario"); } },
  { key: "storyboard", label: "Storyboard" },
  { key: "characterDesign", label: "Character design" },
  { key: "animationDirection", get label() { return ui("Direction de l'animation"); } },
  { key: "artDirection", get label() { return ui("Direction artistique"); } },
  { key: "music", get label() { return ui("Musique"); } },
  { key: "studio", label: "Studio" },
];

export const CREDIT_LIMITS = {
  /** Entities shown per category on a series. */
  seriesPerGroup: 3,
  /** Entities shown per category on an episode. */
  episodePerGroup: 4,
} as const;

interface Hit {
  category: CreditCategory;
  role: string;
}

/** The categories and roles of one AniList credit; compound roles share its exact episode scope. */
function classify(raw: string, level: "episode" | "series", episode: number, singleItem: boolean): Hit[] {
  const parsed = parseRole(raw);
  if (parsed.dub) return [];
  const named = (parsed.episodes?.includes(episode) ?? false) || (parsed.openFrom != null && episode >= parsed.openFrom);
  return roleNames(parsed.role).flatMap(name => {
    const rule = RULES[name.toLowerCase()];
    if (!rule) return [];
    const applies = level === "episode" ? parsed.scoped && named : !parsed.scoped && (rule.series || singleItem);
    return applies ? [{ category: rule.category, role: frenchRoleName(name) }] : [];
  });
}

function entityOf(p: StaffInput, animeId: number): CreditEntity {
  return { kind: "person", id: p.id, name: p.name, nativeName: p.nativeName, href: routes.person(p.id, animeId), roles: [], image: p.image ?? null };
}

function collect(staff: readonly StaffInput[], animeId: number, level: "episode" | "series", episode: number, singleItem: boolean, cap: number): CreditGroup[] {
  const byCategory = new Map<CreditCategory, Map<number, CreditEntity>>();
  for (const person of staff) {
    for (const hit of person.roles.flatMap(raw => classify(raw, level, episode, singleItem))) {
      const people = byCategory.get(hit.category) ?? new Map<number, CreditEntity>();
      byCategory.set(hit.category, people);
      const known = people.get(person.id) ?? entityOf(person, animeId);
      if (!known.roles.includes(hit.role)) known.roles.push(hit.role);
      people.set(person.id, known);
    }
  }
  return CREDIT_CATEGORIES.flatMap(({ key, label }) => {
    const people = [...(byCategory.get(key)?.values() ?? [])];
    return people.length ? [{ category: key, label, level, entities: people.slice(0, cap), more: Math.max(0, people.length - cap) }] : [];
  });
}

/** The main animation studios (else the main ones), as a series-level « Studio » group; none when AniList names none. */
export function studioGroup(studios: readonly StudioInput[]): CreditGroup | null {
  const animation = studios.filter((s) => s.isAnimationStudio && s.isMain);
  const chosen = (animation.length ? animation : studios.filter((s) => s.isMain)).slice(0, 2);
  if (!chosen.length) return null;
  return {
    category: "studio",
    label: "Studio",
    level: "series",
    entities: chosen.map((s) => ({ kind: "studio" as const, id: s.id, name: s.name, nativeName: null, href: routes.studio(s.id), roles: [], image: null })),
    more: 0,
  };
}

/** Merges people repeated across pages (one line per role) and across sources, keeping each role line once. */
export function mergeStaff(lists: readonly (readonly StaffInput[])[]): StaffInput[] {
  const byId = new Map<number, StaffInput & { roles: string[] }>();
  for (const list of lists) {
    for (const p of list) {
      const known = byId.get(p.id) ?? { ...p, roles: [] };
      for (const r of p.roles) if (!known.roles.includes(r)) known.roles.push(r);
      if (!known.image && p.image) known.image = p.image;
      byId.set(p.id, known);
    }
  }
  return [...byId.values()];
}

export function buildWatchCredits(input: { animeId: number; episode: number; staff: readonly StaffInput[]; studios: readonly StudioInput[]; singleItem: boolean; complete: boolean }): WatchCredits {
  const { animeId, episode, staff, studios, singleItem, complete } = input;
  const studio = studioGroup(studios);
  const seriesGroups = collect(staff, animeId, "series", episode, singleItem, CREDIT_LIMITS.seriesPerGroup);
  const episodeGroups = singleItem ? [] : collect(staff, animeId, "episode", episode, singleItem, CREDIT_LIMITS.episodePerGroup);
  if (studio) seriesGroups.push(studio);
  const hasEpisodeCredits = staff.some((p) =>
    p.roles.some((r) => {
      const parsed = parseRole(r);
      return !parsed.dub && roleNames(parsed.role).some(name => RULES[name.toLowerCase()] != null) && ((parsed.episodes?.length ?? 0) > 0 || parsed.openFrom != null);
    }),
  );
  return { animeId, episode, episodeGroups, seriesGroups, singleItem, complete, hasEpisodeCredits };
}
