import type { AnimeEntry, AnimeSummary, FranchiseNode } from "@/types/anime";
import { FRANCHISE } from "@/config/app";
import { compareEntries, isMainFormat, knownLength, seasonLike } from "./resolve";

/**
 * Search results, regrouped by franchise — conservatively. Two results are grouped only when AniList chains them with
 * PREQUEL / SEQUEL relations (directly, or through an entry that is not in the results), so « Attack on Titan » shows one
 * franchise card instead of eight seasons. Side stories, spin-offs, alternative versions and entries that merely look
 * alike are NEVER grouped; a single result is never a group. The entries stay independent AniList media: this is only
 * how a list is presented.
 */

export interface SearchGroup {
  /** Stable key: the lowest AniList id of the group. */
  key: number;
  lead: AnimeSummary;
  /** The results that belong to it, in result order. */
  members: AnimeSummary[];
  /** Main-series entries the group is known to hold. */
  seasons: number;
  /** More main entries may exist beyond what the search showed (« 4+ saisons »). */
  open: boolean;
  /** One of them is a long runner: the group is a series of series, not a count of seasons. */
  continuous: boolean;
  firstYear: number | null;
  lastYear: number | null;
}

export type SearchRow = { kind: "entry"; anime: AnimeSummary } | { kind: "group"; group: SearchGroup };

const CHAIN = new Set(["PREQUEL", "SEQUEL"]);

class Components {
  private parent = new Map<number, number>();
  find(x: number): number {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let r = x;
    while (this.parent.get(r) !== r) r = this.parent.get(r)!;
    // Path compression, so long chains stay cheap.
    for (let c = x; c !== r; ) {
      const next = this.parent.get(c)!;
      this.parent.set(c, r);
      c = next;
    }
    return r;
  }
  union(a: number, b: number): void {
    const [ra, rb] = [this.find(a), this.find(b)];
    // The smallest id is the root, so a group's key never depends on the order edges arrive in.
    if (ra !== rb) this.parent.set(Math.max(ra, rb), Math.min(ra, rb));
  }
}

const yearOf = (e: AnimeEntry | AnimeSummary): number | null => ("startDate" in e ? e.startDate?.year : null) ?? e.seasonYear ?? null;

export function groupSearchResults(items: readonly AnimeSummary[], nodes: readonly FranchiseNode[]): SearchRow[] {
  const resultIds = new Set(items.map((i) => i.id));
  const components = new Components();
  const known = new Map<number, AnimeEntry | AnimeSummary>(items.map((i) => [i.id, i]));
  for (const node of nodes) {
    if (!resultIds.has(node.entry.id)) continue;
    known.set(node.entry.id, node.entry);
    components.find(node.entry.id);
    for (const edge of node.edges) {
      if (!CHAIN.has(edge.type)) continue;
      if (!known.has(edge.to.id)) known.set(edge.to.id, edge.to);
      components.union(node.entry.id, edge.to.id);
    }
  }

  const byRoot = new Map<number, AnimeSummary[]>();
  for (const item of items) {
    const root = components.find(item.id);
    byRoot.set(root, [...(byRoot.get(root) ?? []), item]);
  }
  const everyone = new Map<number, number[]>();
  for (const id of known.keys()) everyone.set(components.find(id), [...(everyone.get(components.find(id)) ?? []), id]);

  const rows: SearchRow[] = [];
  const placed = new Set<number>();
  for (const item of items) {
    const root = components.find(item.id);
    const members = byRoot.get(root)!;
    if (members.length < 2) {
      rows.push({ kind: "entry", anime: item });
      continue;
    }
    // The group takes the place of its best-ranked result.
    if (placed.has(root)) continue;
    placed.add(root);
    const ids = everyone.get(root) ?? [];
    // Only long enough entries are seasons; a long runner is not counted in seasons at all.
    const mainIds = ids.filter((id) => isMainFormat(known.get(id)!.format) && seasonLike(known.get(id)!));
    const continuous = mainIds.some((id) => knownLength(known.get(id)!) >= FRANCHISE.longRunnerEpisodes);
    const mainResults = members.filter((m) => isMainFormat(m.format));
    const lead = [...(mainResults.length ? mainResults : members)].sort((a, b) => compareEntries(asEntry(a, known), asEntry(b, known)))[0]!;
    const years = mainIds.map((id) => yearOf(known.get(id)!)).filter((y): y is number => y != null);
    rows.push({
      kind: "group",
      group: {
        key: root,
        lead,
        members,
        seasons: mainIds.length,
        continuous,
        // A main entry the search did not return: its own relations are unknown, so there may be more.
        open: mainIds.some((id) => !resultIds.has(id)),
        firstYear: years.length ? Math.min(...years) : null,
        lastYear: years.length ? Math.max(...years) : null,
      },
    });
  }
  return rows;
}

function asEntry(a: AnimeSummary, known: ReadonlyMap<number, AnimeEntry | AnimeSummary>): AnimeEntry {
  const k = known.get(a.id);
  return { ...a, startDate: k && "startDate" in k ? k.startDate : null };
}
