import { ui } from "@/lib/i18n/translate";
import { parseRole } from "./role-parser";

/**
 * What a person did on a manga or a novel, as AniList writes it: « Story », « Art », « Story & Art », « Original Story »,
 * « Illustration », and range-qualified ones (« Story & Art (vols 1-41) », « Story (chs 1-92) »). Said in French, the range
 * in the viewer's words; a role not in the table keeps AniList's. Pure.
 *
 * A credit of an AUTHOR (here) is not the anime's `source` (« Manga », « Light novel »: the nature of the work an anime
 * adapts) — two different things that both happen to say « original ».
 */

export const WORK_AUTHOR_ROLES = /^(story|art|story & art|original (story|creator)|author|illustration)$/i;

const NAMES: Record<string, string> = {
  get "story & art"() { return ui("Scénario et dessin"); },
  get story() { return ui("Scénario"); },
  get art() { return ui("Dessin"); },
  illustration: "Illustration",
  get "original story"() { return ui("Histoire originale"); },
  get "original creator"() { return ui("Création originale"); },
  get author() { return ui("Auteur"); },
  "character design": "Character design",
};

/** « vols 1-41 » → « vol. 1-41 », « vols 41- » → « à partir du vol. 41 », « chs 1-92 » → « chap. 1-92 ». Null when it is not a range of volumes or chapters. */
function rangeOf(detail: string): string | null {
  const m = /^(vols?|volumes?|chs?|chapters?)\.?\s*(\d+)\s*(?:([-–])\s*(\d+)?)?$/i.exec(detail.trim());
  if (!m) return null;
  const volumes = m[1]!.toLowerCase().startsWith("v");
  const [from, dash, to] = [m[2]!, m[3], m[4]];
  const unit = volumes ? "vol." : "chap.";
  if (!dash) return `${unit} ${from}`;
  return to ? `${unit} ${from}-${to}` : ui("à partir du {0} {1}", unit, from);
}

/**
 * One credit, said in French. In a novel the one who writes is an « Auteur » (there is no « Scénario » without a drawing);
 * in a manga the writer is the « Scénario », and a single person who does both is « Scénario et dessin ».
 */
export function workRoleLabel(raw: string, opts: { novel?: boolean } = {}): string {
  const parsed = parseRole(raw);
  const key = parsed.role.toLowerCase();
  const name = key === "story" && opts.novel ? ui("Auteur") : (NAMES[key] ?? parsed.role);
  const range = parsed.remainder ? rangeOf(parsed.remainder) : null;
  const detail = range ?? parsed.remainder;
  return detail ? `${name} (${detail})` : name;
}

/** The credits of one person on a work, each said once, in the order AniList gave them. */
export function workRolesOf(roles: readonly string[], opts: { novel?: boolean } = {}): string[] {
  return [...new Set(roles.map((r) => workRoleLabel(r, opts)))];
}

/** Is this credit one of an author (not a translator, a supervisor, a storyboard of the adaptation…)? Ranges are ignored. */
export function isAuthorRole(raw: string): boolean {
  return WORK_AUTHOR_ROLES.test(parseRole(raw).role);
}
