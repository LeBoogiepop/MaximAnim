
import { ui } from "@/lib/i18n/translate";
/**
 * AniList writes WHERE a person worked into the free text of the credit: « Storyboard (ep 5) », « Episode Director (eps 3,
 * 8) », « Key Animation (OP1, OP2, eps 1-3, 19) », « ADR Script (English; eps. 1, 2, 3) ». This reads exactly that — and
 * nothing else: an episode that the text does not literally contain is never produced, a missing detail is never « all
 * episodes », and a string it cannot make sense of keeps its words (`remainder`). Pure.
 *
 * Shapes met in the wild (739 distinct credits of eight shows): `ep N`, `eps A, B, C`, ranges `A-B`, open ranges `N-`,
 * `OPn` / `EDn` and ranges of them, `PV`, a language (a dub) with or without episodes after a `;`, a bare number, nested
 * or quoted text, stray spaces, and credits cut at 255 characters with the bracket never closed.
 */

export interface ParsedRole {
  /** The role itself, without its bracket: « Key Animation ». */
  role: string;
  /** Episodes the credit names, sorted, unique; null when it names none (NOT « all of them »: see `scoped`). */
  episodes: number[] | null;
  /** « eps 799- »: from this episode on, the end being unknown. Never expanded. */
  openFrom: number | null;
  /** OP1, ED2, OP21-OP25, PV, Opening, Ending: what the credit is about besides episodes. */
  extras: string[];
  /** A language or an `ADR` role: a credit of a dub, never of the original version. */
  dub: boolean;
  /** What the bracket says that is none of the above (kept in the original words), or null. */
  remainder: string | null;
  /** The text stops before its bracket closes (AniList cuts a credit at 255 characters): the list may be incomplete. */
  truncated: boolean;
  /** There is a bracket: the credit is about something narrower than the whole work (even when we cannot say what). */
  scoped: boolean;
}

/** A range longer than this is not an episode range. */
const MAX_RANGE = 3000;

const DUB_LANGUAGES =
  /\b(english|french|german|italian|spanish|latin american spanish|portuguese|brazilian portuguese|polish|turkish|russian|arabic|hindi|tamil|telugu|thai|vietnamese|indonesian|malay|hungarian|czech|dutch|swedish|norwegian|danish|finnish|greek|hebrew|catalan|cantonese|mandarin|korean|tagalog|filipino|bulgarian|croatian|serbian|romanian|ukrainian|dub)\b/i;

const EP_PREFIX = /^(?:episodes?|eps?)\.?\s*(.*)$/i;
const EP_ONE = /^\d+$/;
const EP_RANGE = /^(\d+)\s*[-–]\s*(\d+)$/;
const EP_OPEN = /^(\d+)\s*[-–]$/;
const OP_ED = /^(?:op|ed)\d*(?:\s*[-–]\s*(?:op|ed)?\d+)?$/i;

type Item = { episodes: number[]; openFrom: number | null; extra: string | null; dub: boolean; rest: string | null };

function expand(a: number, b: number): number[] | null {
  if (b < a || b - a > MAX_RANGE) return null;
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

export function parseRole(raw: string): ParsedRole {
  const text = raw.replace(/\s+/g, " ").trim();
  const open = text.indexOf("(");
  const none: ParsedRole = { role: text, episodes: null, openFrom: null, extras: [], dub: /^adr\b/i.test(text), remainder: null, truncated: false, scoped: false };
  if (open < 0) return none;

  const role = text.slice(0, open).trim();
  const closed = text.endsWith(")");
  const inner = (closed ? text.slice(open + 1, -1) : text.slice(open + 1)).trim();
  const base: ParsedRole = { ...none, role, dub: /^adr\b/i.test(role), truncated: !closed, scoped: true };
  // Nested brackets or quotes: not a list of anything we know. The words are kept as they are.
  if (/["“”()]/.test(inner)) return { ...base, remainder: inner || null };

  const items: Item[] = [];
  for (const segment of inner.split(";")) {
    let inEpisodes = false;
    for (const piece of segment.split(",")) {
      let t = piece.trim();
      if (!t) continue;
      const prefix = EP_PREFIX.exec(t);
      if (prefix && /^(?:episodes?|eps?)\b/i.test(t)) {
        inEpisodes = true;
        t = (prefix[1] ?? "").trim();
        if (!t) continue;
      }
      const item: Item = { episodes: [], openFrom: null, extra: null, dub: false, rest: null };
      if (inEpisodes && EP_ONE.test(t)) item.episodes = [Number(t)];
      else if (inEpisodes && EP_RANGE.test(t)) {
        const m = EP_RANGE.exec(t)!;
        const list = expand(Number(m[1]), Number(m[2]));
        if (list) item.episodes = list;
        else item.rest = t;
      } else if (inEpisodes && EP_OPEN.test(t)) item.openFrom = Number(EP_OPEN.exec(t)![1]);
      else {
        inEpisodes = false;
        if (OP_ED.test(t) || /^pv$/i.test(t) || /^(?:opening|ending)$/i.test(t)) item.extra = t.toUpperCase().replace(/\s+/g, "");
        else if (DUB_LANGUAGES.test(t)) {
          item.dub = true;
          item.rest = t;
        } else item.rest = t;
      }
      items.push(item);
    }
  }
  // A credit cut mid-list: its last item may be cut mid-number (« …, 33 » was « …, 331 »). It is never shown.
  if (!closed && items.length) items.pop();

  const episodes = [...new Set(items.flatMap((i) => i.episodes))].sort((a, b) => a - b);
  const opens = items.map((i) => i.openFrom).filter((n): n is number => n != null);
  const rest = items.map((i) => i.rest).filter((r): r is string => r != null);
  return {
    ...base,
    episodes: episodes.length ? episodes : null,
    openFrom: opens.length ? Math.min(...opens) : null,
    extras: [...new Set(items.map((i) => i.extra).filter((e): e is string => e != null))],
    dub: base.dub || items.some((i) => i.dub),
    remainder: rest.length ? rest.join(", ") : null,
  };
}

/** Longest list of numbers said before « … et N autres ». */
const MAX_SHOWN = 12;

/**
 * « ép. 1-3, 19, 24 »: runs of three or more are ranges. Past `MAX_SHOWN` numbers or ranges the rest is counted. An open
 * range reads « à partir de l'ép. 897 ». Said honestly when AniList cut the credit.
 */
export function formatEpisodes(x: { episodes: readonly number[] | null; openFrom: number | null; truncated?: boolean }): string | null {
  const numbers = x.episodes ?? [];
  const runs: string[] = [];
  for (let i = 0; i < numbers.length; ) {
    let j = i;
    while (j + 1 < numbers.length && numbers[j + 1] === numbers[j]! + 1) j++;
    if (j - i >= 2) runs.push(`${numbers[i]}-${numbers[j]}`);
    else for (let k = i; k <= j; k++) runs.push(String(numbers[k]));
    i = j + 1;
  }
  const shown = runs.length > MAX_SHOWN ? [...runs.slice(0, MAX_SHOWN), ui("… et {0} autres", runs.length - MAX_SHOWN)] : runs;
  const parts: string[] = [];
  if (shown.length) parts.push(ui("ép. {0}", shown.join(", ")));
  if (x.openFrom != null) parts.push(ui("à partir de l'ép. {0}", x.openFrom));
  if (!parts.length) return null;
  return parts.join(" ; ") + (x.truncated ? ui(" (liste incomplète chez AniList)") : "");
}

/** The episode numbers a set of credits names, sorted and unique (what an « Épisode » filter is offered from). Never invented. */
export function episodesOf(roles: readonly string[]): number[] {
  const all = new Set<number>();
  for (const role of roles) for (const n of parseRole(role).episodes ?? []) all.add(n);
  return [...all].sort((a, b) => a - b);
}

/** Does this credit name this episode? An open range (« eps 799- ») covers every episode from its start on. */
export function creditCoversEpisode(role: string, episode: number): boolean {
  const parsed = parseRole(role);
  return (parsed.episodes?.includes(episode) ?? false) || (parsed.openFrom != null && episode >= parsed.openFrom);
}
