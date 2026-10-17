
import { ui } from "@/lib/i18n/translate";
import { formatEpisodes, parseRole } from "./role-parser";

/**
 * AniList credits come in English (« Key Animation (ep 6) »). The roles a viewer meets most are said in French; any role
 * not in the table is shown exactly as AniList writes it — never guessed, never a made-up translation. The detail in
 * brackets (episodes, OP / ED) is read by `parseRole`.
 */

const ROLES: Record<string, string> = {
  get director() { return ui("Réalisation"); },
  get "chief director"() { return ui("Réalisation en chef"); },
  get "series director"() { return ui("Réalisation de la série"); },
  get "assistant director"() { return ui("Assistant réalisateur"); },
  get "episode director"() { return ui("Réalisation d'épisode"); },
  get "assistant episode director"() { return ui("Assistant réalisation d'épisode"); },
  get "unit director"() { return ui("Réalisation d'unité"); },
  get "action director"() { return ui("Réalisation des scènes d'action"); },
  storyboard: "Storyboard",
  get "storyboard composition"() { return ui("Composition du storyboard"); },
  get "series composition"() { return ui("Composition de la série"); },
  get script() { return ui("Scénario"); },
  get screenplay() { return ui("Scénario"); },
  get "original creator"() { return ui("Création originale"); },
  get "original story"() { return ui("Histoire originale"); },
  get "original work"() { return ui("Œuvre originale"); },
  "character design": "Character design",
  get "original character design"() { return ui("Design des personnages originaux"); },
  get "chief animation director"() { return ui("Direction de l'animation en chef"); },
  get "animation director"() { return ui("Direction de l'animation"); },
  get "assistant animation director"() { return ui("Assistant direction de l'animation"); },
  get "action animation director"() { return ui("Direction de l'animation (action)"); },
  get "animation supervisor"() { return ui("Supervision de l'animation"); },
  get "main animator"() { return ui("Animateur principal"); },
  get "animation producer"() { return ui("Production de l'animation"); },
  get "key animation"() { return ui("Animation clé"); },
  get "2nd key animation"() { return ui("Animation clé (2nd)"); },
  get "in-between animation"() { return ui("Intervalles"); },
  get "mechanical design"() { return ui("Design mécanique"); },
  get "mechanical animation director"() { return ui("Direction de l'animation mécanique"); },
  get "creature design"() { return ui("Design des créatures"); },
  get "prop design"() { return ui("Design des accessoires"); },
  get "setting design"() { return ui("Design des décors"); },
  "layout design": "Layout",
  get "layout supervisor"() { return ui("Supervision du layout"); },
  get "art director"() { return ui("Direction artistique"); },
  "art design": "Art design",
  get "background art"() { return ui("Décors"); },
  get "color design"() { return ui("Direction des couleurs"); },
  get "color key artist"() { return ui("Couleurs clés"); },
  get "director of photography"() { return ui("Direction de la photographie"); },
  get "cg director"() { return ui("Direction CG"); },
  get "3d director"() { return ui("Direction 3D"); },
  get editing() { return ui("Montage"); },
  get "online editing"() { return ui("Montage en ligne"); },
  get recording() { return ui("Enregistrement"); },
  get "sound director"() { return ui("Direction du son"); },
  get "sound effects"() { return ui("Effets sonores"); },
  get "sound production"() { return ui("Production sonore"); },
  get music() { return ui("Musique"); },
  get "music producer"() { return ui("Production musicale"); },
  get "theme song performance"() { return ui("Interprète du générique"); },
  get "theme song composition"() { return ui("Composition du générique"); },
  get "theme song arrangement"() { return ui("Arrangement du générique"); },
  get "theme song lyrics"() { return ui("Paroles du générique"); },
  get "insert song performance"() { return ui("Interprète d'une chanson d'insertion"); },
  get "insert song composition"() { return ui("Composition d'une chanson d'insertion"); },
  get "title logo design"() { return ui("Logo du titre"); },
  "design works": "Design",
  "concept art": "Concept art",
  producer: "Production",
  get "chief producer"() { return ui("Production en chef"); },
  get "executive producer"() { return ui("Producteur exécutif"); },
  get "associate producer"() { return ui("Producteur associé"); },
};

/**
 * What a person says they do, from the broader « occupations » AniList keeps on a staff member (not the per-credit role):
 * the ones met in practice, said in French; the rest keep AniList's word.
 */
const OCCUPATIONS: Record<string, string> = {
  get director() { return ui("Réalisateur"); },
  get "episode director"() { return ui("Réalisation d'épisode"); },
  storyboard: "Storyboard",
  "storyboard artist": "Storyboard",
  get writer() { return ui("Scénariste"); },
  get scriptwriter() { return ui("Scénariste"); },
  get "series composer"() { return ui("Composition de la série"); },
  get composer() { return ui("Compositeur"); },
  get music() { return ui("Musique"); },
  get musician() { return ui("Musique"); },
  get vocalist() { return ui("Chant"); },
  get lyricist() { return ui("Paroles"); },
  arranger: "Arrangement",
  get band() { return ui("Groupe"); },
  get "music producer"() { return ui("Production musicale"); },
  get animator() { return ui("Animateur"); },
  get "key animator"() { return ui("Animation clé"); },
  "character designer": "Character design",
  get illustrator() { return ui("Illustrateur"); },
  mangaka: "Mangaka",
  artist: "Art",
  get "art director"() { return ui("Direction artistique"); },
  get "sound director"() { return ui("Direction du son"); },
  get producer() { return ui("Producteur"); },
  get "voice actor"() { return ui("Voix (VO)"); },
  get seiyuu() { return ui("Voix (VO)"); },
  vtuber: "VTuber",
  vocaloid: "Vocaloid",
};

export function frenchOccupation(occupation: string): string {
  return OCCUPATIONS[occupation.trim().toLowerCase()] ?? occupation.trim();
}

export function frenchRoleName(base: string): string {
  const name = base.trim();
  return ROLES[name.toLowerCase()] ?? Object.values(ROLES).find(label => label.toLowerCase() === name.toLowerCase()) ?? name;
}

/** Split only known roles: an unknown label containing a slash keeps its meaning. */
export function roleNames(base: string): string[] {
  const parts = base.split(/\s*\/\s*|\s+&\s+/).map(name => name.trim());
  const known = (name: string) => Object.hasOwn(ROLES, name.toLowerCase()) || Object.values(ROLES).some(label => label.toLowerCase() === name.toLowerCase());
  return parts.length > 1 && parts.every(known) ? parts : [base.trim()];
}

/** Shared by official episode credits and AniList staff/person surfaces. */
export function distinctRoleNames(names: readonly string[]): string[] {
  return [...new Set(names.flatMap(roleNames).map(frenchRoleName))];
}

/** The detail of a credit as said in the brackets: the OP / ED it is about, then the episodes, then what AniList wrote that we do not read. */
function detailOf(p: ReturnType<typeof parseRole>): string | null {
  const parts = [...p.extras, formatEpisodes(p), p.remainder].filter((x): x is string => Boolean(x));
  return parts.length ? parts.join(", ") : null;
}

/** « Key Animation (ep 6) » → « Animation clé (ép. 6) »; unknown roles keep AniList's words. */
export function frenchRole(role: string): string {
  const parsed = parseRole(role);
  const name = frenchRoleName(parsed.role);
  const detail = detailOf(parsed);
  return detail ? `${name} (${detail})` : name;
}

/**
 * Every role held on ONE work, merged and said once each: « Storyboard (ép. 4, 13) » instead of two lines, « Animation
 * clé » once. The episodes of the same role are joined (sorted, ranges compressed); the other details are kept.
 */
export function mergeRoles(roles: readonly string[]): string[] {
  const order: string[] = [];
  const groups = new Map<string, { name: string; episodes: Set<number>; openFrom: number | null; truncated: boolean; extras: string[]; remainders: string[]; plain: boolean }>();
  for (const role of roles) for (const name of roleNames(parseRole(role).role)) {
    const p = { ...parseRole(role), role: name };
    const key = frenchRoleName(p.role).toLowerCase();
    let group = groups.get(key);
    if (!group) {
      group = { name: frenchRoleName(p.role), episodes: new Set(), openFrom: null, truncated: false, extras: [], remainders: [], plain: false };
      groups.set(key, group);
      order.push(key);
    }
    if (!p.scoped) group.plain = true;
    for (const n of p.episodes ?? []) group.episodes.add(n);
    if (p.openFrom != null) group.openFrom = group.openFrom == null ? p.openFrom : Math.min(group.openFrom, p.openFrom);
    group.truncated ||= p.truncated;
    for (const e of p.extras) if (!group.extras.includes(e)) group.extras.push(e);
    if (p.remainder && !group.remainders.includes(p.remainder)) group.remainders.push(p.remainder);
  }
  return order.map((key) => {
    const g = groups.get(key)!;
    const parts = [...g.extras, formatEpisodes({ episodes: [...g.episodes].sort((a, b) => a - b), openFrom: g.openFrom, truncated: g.truncated }), ...g.remainders].filter((x): x is string => Boolean(x));
    // « Réalisation » alone beats « Réalisation (ép. 3) » when the person was credited for the whole work too.
    return g.plain || !parts.length ? g.name : `${g.name} (${parts.join(", ")})`;
  });
}

/**
 * Where a credit belongs, for filtering and grouping people and filmographies. By keywords on the role itself (first match
 * wins, order matters: « Chief Animation Director » is animation, not direction); anything not recognised is « other » —
 * never forced into a category.
 */
export type RoleCategory = "dub" | "original" | "script" | "direction" | "animation" | "art" | "sound" | "production" | "other";

export const ROLE_CATEGORIES: { key: RoleCategory; label: string }[] = [
  { key: "direction", get label() { return ui("Réalisation"); } },
  { key: "script", get label() { return ui("Scénario"); } },
  { key: "animation", label: "Animation" },
  // Art director / art design, backgrounds, colour design, photography, concept art, props, settings, creature design, logos.
  { key: "art", get label() { return ui("Direction artistique & design"); } },
  { key: "sound", get label() { return ui("Son & musique"); } },
  { key: "production", label: "Production" },
  // Original Creator / Original Story / Original Work: the people behind the work an anime comes from.
  { key: "original", get label() { return ui("Œuvre originale"); } },
  { key: "other", get label() { return ui("Autres"); } },
  { key: "dub", get label() { return ui("Doublage (hors version originale)"); } },
];

const CATEGORY_RULES: [RoleCategory, RegExp][] = [
  ["original", /^original (creator|story|work)\b/],
  ["script", /^(script|screenplay|series composition|literary arts)\b/],
  ["animation", /animation|animator|character design|mechanical design|in-between|\blayout\b|\bcg\b|\b3d\b|effects animation/],
  ["art", /^art (director|design)|^background|color design|colour|photography|concept art|prop design|creature design|setting design|title logo|design works|^art\b/],
  ["sound", /^sound|^music|theme song|insert song|composer|^recording|^audio|^lyrics|^sound effects/],
  ["direction", /director$|^storyboard|^unit director|^supervisor$|^direction\b|^chief director/],
  ["production", /producer|planning|production|advertising|editing|^assistance$|system manager|design manager/],
];

export function roleCategory(role: string): RoleCategory {
  const parsed = parseRole(role);
  if (parsed.dub) return "dub";
  const base = parsed.role.toLowerCase();
  for (const [category, pattern] of CATEGORY_RULES) if (pattern.test(base)) return category;
  return "other";
}

export function roleCategoryLabel(category: RoleCategory): string {
  return ROLE_CATEGORIES.find((c) => c.key === category)?.label ?? ui("Autres");
}
