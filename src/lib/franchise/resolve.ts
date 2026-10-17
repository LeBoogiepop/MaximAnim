import { FRANCHISE } from "@/config/app";
import { toSummary } from "@/lib/anilist/normalize";
import { isAlternateBridge } from "@/lib/anilist/editorial";
import type { Anime, AnimeEntry, Franchise, FranchiseLink, FranchiseKind, FranchiseMember, FranchiseNode, PartialDate, RelationType } from "@/types/anime";

/**
 * A franchise is a local, ephemeral grouping of independent AniList entries — never a merge, never a new id. From one
 * entry the walk follows PREQUEL, SEQUEL and PARENT only (the relations that say « same story »); side stories,
 * spin-offs, alternative versions and the rest are listed from the entries reached, never walked through (an alternative
 * version or a reboot is another franchise). The verified Steins;Gate ↔ 23β edge is the sole alternate bridge. Cycles are harmless (every entry is visited once), and both the number of
 * levels (one batched request each) and the number of entries are bounded.
 */

const WALKED: ReadonlySet<RelationType> = new Set(["PREQUEL", "SEQUEL", "PARENT"]);
const SEASON_MONTH = { WINTER: 1, SPRING: 4, SUMMER: 7, FALL: 10 } as const;

export type FetchNodes = (ids: number[]) => Promise<FranchiseNode[]>;

export interface WalkLimits {
  maxLevels: number;
  maxNodes: number;
  batchSize: number;
}

const DEFAULT_LIMITS: WalkLimits = { maxLevels: FRANCHISE.maxLevels, maxNodes: FRANCHISE.maxNodes, batchSize: FRANCHISE.batchSize };

export class FranchiseNotFound extends Error {
  constructor(readonly id: number) {
    super(`Anime ${id} not returned by AniList`);
    this.name = "FranchiseNotFound";
  }
}

export function isMainFormat(format: AnimeEntry["format"]): boolean {
  return format != null && (FRANCHISE.mainFormats as readonly string[]).includes(format);
}

/** How long the entry is, as far as AniList says: the planned total, or what has aired when that is more (One Piece has no total). */
export function knownLength(entry: Pick<AnimeEntry, "episodeCount" | "nextAiring">): number {
  return Math.max(entry.episodeCount ?? 0, entry.nextAiring && entry.nextAiring.episode > 1 ? entry.nextAiring.episode - 1 : 0);
}

/** Long enough to be a « season» (or not known yet: a new entry is never refused for it). */
export function seasonLike(entry: Pick<AnimeEntry, "episodeCount">): boolean {
  return entry.episodeCount == null || entry.episodeCount >= FRANCHISE.minSeasonEpisodes;
}

const ROMAN_PART: Record<string, number> = { ii: 2, iii: 3, iv: 4 };
const ORDINAL_PART: Record<string, number> = { second: 2, third: 3 };

/**
 * « Part 2 », « 2nd Cour », « Cour 2 », « 第2クール » in the entry's OWN title: it continues the season before it instead of
 * starting a new one. Only what the title says (a number of 2 or more); AniList has no field for it. Null otherwise.
 */
export function partOf(entry: AnimeEntry): number | null {
  const titles = [entry.titles.english, entry.titles.romaji, entry.titles.native].filter((t): t is string => Boolean(t));
  for (const title of titles) {
    const patterns: [RegExp, (m: RegExpExecArray) => number][] = [
      [/\b(?:part|cour)\s*(\d{1,2})\b/i, (m) => Number(m[1])],
      [/\b(\d{1,2})(?:st|nd|rd|th)\s+(?:part|cour)\b/i, (m) => Number(m[1])],
      [/\b(?:part|cour)\s+(ii|iii|iv)\b/i, (m) => ROMAN_PART[m[1]!.toLowerCase()]!],
      [/\b(second|third)\s+(?:part|cour)\b/i, (m) => ORDINAL_PART[m[1]!.toLowerCase()]!],
      [/第\s*(\d{1,2})\s*クール/, (m) => Number(m[1])],
    ];
    for (const [re, value] of patterns) {
      const m = re.exec(title);
      const n = m ? value(m) : 0;
      if (n >= 2) return n;
    }
  }
  return null;
}

/** Chronological sort key: year, month, day (a season stands for its first month); entries with no year come last. */
function when(entry: AnimeEntry): [number, number, number] {
  const d: PartialDate | null = entry.startDate;
  if (d?.year) return [d.year, d.month ?? 0, d.day ?? 0];
  if (entry.seasonYear) return [entry.seasonYear, entry.season ? SEASON_MONTH[entry.season] : 0, 0];
  return [Number.POSITIVE_INFINITY, 0, 0];
}

export function compareEntries(a: AnimeEntry, b: AnimeEntry): number {
  const [x, y] = [when(a), when(b)];
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i]! < y[i]! ? -1 : 1;
  }
  return a.id - b.id;
}

/** Walks the franchise of `anchorId`: one `fetchNodes` call per level, at most `maxLevels` levels. */
export async function resolveFranchise(anchorId: number, fetchNodes: FetchNodes, limits: WalkLimits = DEFAULT_LIMITS, seed: readonly FranchiseNode[] = []): Promise<Franchise> {
  const nodes = new Map<number, FranchiseNode>(seed.map((n) => [n.entry.id, n]));
  const chain = new Set<number>([anchorId]);
  let frontier = [anchorId];
  let truncated = false;
  for (let level = 0; level < limits.maxLevels && frontier.length; level++) {
    const need = frontier.filter((id) => !nodes.has(id));
    for (let i = 0; i < need.length; i += limits.batchSize) {
      for (const node of await fetchNodes(need.slice(i, i + limits.batchSize))) nodes.set(node.entry.id, node);
    }
    if (level === 0 && !nodes.has(anchorId)) throw new FranchiseNotFound(anchorId);
    const next: number[] = [];
    for (const id of frontier) {
      // An entry AniList did not return is a dead end, not an error.
      for (const edge of nodes.get(id)?.edges ?? []) {
        if ((!WALKED.has(edge.type) && !isAlternateBridge(id, edge.to.id, edge.type)) || chain.has(edge.to.id)) continue;
        if (chain.size >= limits.maxNodes) {
          truncated = true;
          continue;
        }
        chain.add(edge.to.id);
        next.push(edge.to.id);
      }
    }
    frontier = next;
  }
  // Levels ran out while entries were still waiting to be explored.
  if (frontier.length) truncated = true;
  return buildFranchise(anchorId, nodes, chain, truncated);
}

/**
 * What the detail page already knows, with no request: the entry, its direct relations, and the chain limited to its
 * direct prequel / sequel / parent. `complete` says nothing more can be learned (no such relation: a standalone work),
 * otherwise `resolveFranchise` completes it.
 */
export function localFranchise(anime: Anime): { franchise: Franchise; complete: boolean } {
  const entry: AnimeEntry = { ...toSummary(anime), startDate: anime.startDate };
  const node: FranchiseNode = { entry, edges: anime.relations.map((r) => ({ type: r.type, to: { ...r.anime, startDate: null } })) };
  const chain = new Set<number>([anime.id]);
  for (const edge of node.edges) if (WALKED.has(edge.type) || isAlternateBridge(anime.id, edge.to.id, edge.type)) chain.add(edge.to.id);
  return { franchise: buildFranchise(anime.id, new Map([[anime.id, node]]), chain, chain.size > 1), complete: chain.size === 1 };
}

function relationKind(type: RelationType): FranchiseKind {
  switch (type) {
    case "SIDE_STORY":
      return "sideStory";
    case "SPIN_OFF":
      return "spinOff";
    case "ALTERNATIVE":
      return "alternative";
    default:
      return "other";
  }
}

/** Format first (a film is a film wherever it hangs), then how the relation names it. */
function kindOf(entry: AnimeEntry, via: RelationType | null): FranchiseKind {
  if (entry.format === "MOVIE") return "movie";
  if (entry.format === "SPECIAL" || entry.format === "OVA") return "special";
  return via ? relationKind(via) : "other";
}

export function buildFranchise(anchorId: number, nodes: ReadonlyMap<number, FranchiseNode>, chain: ReadonlySet<number>, truncated: boolean): Franchise {
  // Every entry seen, from its own node or from an edge pointing at it.
  const known = new Map<number, AnimeEntry>();
  for (const node of nodes.values()) for (const edge of node.edges) known.set(edge.to.id, edge.to);
  for (const node of nodes.values()) known.set(node.entry.id, node.entry);

  // How an entry is named from the side of the entry that points at it (« X has Y as a side story »).
  const named = new Map<number, RelationType>();
  for (const node of nodes.values()) {
    for (const edge of node.edges) if (!WALKED.has(edge.type) && !named.has(edge.to.id)) named.set(edge.to.id, edge.type);
  }

  const members = new Map<number, FranchiseMember>();
  // The entries that could be seasons: the main formats of the chain that are not offshoots of another entry.
  const candidates = new Set<number>();
  for (const id of chain) {
    const entry = known.get(id);
    if (!entry || entry.format === "MUSIC" || !isMainFormat(entry.format)) continue;
    // An entry that has a PARENT is an offshoot of it (a side story, a spin-off), not the next season.
    if (!(nodes.get(id)?.edges.some((e) => e.type === "PARENT") ?? false) && !(chain.has(9253) && id === 21127)) candidates.add(id);
  }
  // Only the long enough ones are numbered; a franchise made of nothing but short entries keeps them all rather than none.
  const longEnough = [...candidates].filter((id) => seasonLike(known.get(id)!));
  const seasons = new Set<number>(longEnough.length ? longEnough : candidates);
  for (const id of chain) {
    const entry = known.get(id);
    if (!entry || entry.format === "MUSIC") continue;
    const offshoot = nodes.get(id)?.edges.some((e) => e.type === "PARENT") ?? false;
    let kind: FranchiseKind;
    if (chain.has(9253) && id === 21127) kind = "alternative";
    else if (offshoot) kind = kindOf(entry, named.get(id) ?? "SIDE_STORY");
    else if (seasons.has(id)) kind = "main";
    // A short TV / ONA the chain runs through (a one-episode ONA, a teaser, a 4-episode special): listed, not a season.
    else if (candidates.has(id)) kind = "special";
    else kind = kindOf(entry, null);
    members.set(id, { entry, kind, season: null, part: null });
  }
  // Entries only named by the walked ones (films, side stories…): listed, never walked through.
  for (const node of nodes.values()) {
    if (!chain.has(node.entry.id)) continue;
    for (const edge of node.edges) {
      if (WALKED.has(edge.type) || members.has(edge.to.id) || chain.has(edge.to.id) || edge.to.format === "MUSIC") continue;
      members.set(edge.to.id, { entry: edge.to, kind: kindOf(edge.to, edge.type), season: null, part: null });
    }
  }

  const all = [...members.values()];
  // Prefer an edge from the anchor; otherwise keep the first reached graph edge.
  const sources = [...nodes.values()].sort((a, b) => Number(b.entry.id === anchorId) - Number(a.entry.id === anchorId));
  for (const member of all) {
    for (const node of sources) {
      const edge = node.edges.find(e => e.to.id === member.entry.id);
      if (edge) { member.relation = edge.type; member.relationFrom = node.entry.id; break; }
    }
  }
  const main = all.filter((m) => m.kind === "main").sort((a, b) => compareEntries(a.entry, b.entry));
  // A graph-confirmed successor explicitly titled as a new season takes
  // precedence over the length heuristic (e.g. a 170-episode first season).
  const explicitSeason = main.slice(1).some(m => Object.values(m.entry.titles).some(t => t && /\bseason\s*[2-9]\d*\b|\b[2-9]\d*(?:nd|rd|th)\s+season\b|第\s*[2-9]\d*\s*期/i.test(t)));
  const continuous = !explicitSeason && main.some((m) => knownLength(m.entry) >= FRANCHISE.longRunnerEpisodes);
  if (!continuous) {
    let season = 0;
    let previous: FranchiseMember | null = null;
    for (const m of main) {
      const part = partOf(m.entry);
      if (part != null && previous?.season != null && (previous.part ?? 1) < part) {
        m.season = previous.season;
        m.part = part;
      } else m.season = ++season;
      previous = m;
    }
  }
  const others = all.filter((m) => m.kind !== "main").sort((a, b) => compareEntries(a.entry, b.entry));
  const anchor = known.get(anchorId);
  const lead = main[0]?.entry ?? anchor;
  if (!lead) throw new FranchiseNotFound(anchorId);
  const listed = new Set(members.keys());
  const edges: FranchiseLink[] = [];
  const seenEdge = new Set<string>();
  for (const node of nodes.values()) {
    for (const edge of node.edges) {
      const key = `${node.entry.id}>${edge.to.id}`;
      if (seenEdge.has(key) || !listed.has(node.entry.id) || !listed.has(edge.to.id)) continue;
      seenEdge.add(key);
      edges.push({ from: node.entry.id, to: edge.to.id, type: edge.type });
    }
  }
  return { anchorId, lead, main, others, continuous, truncated, edges };
}

/** The group titles of the secondary entries, in display order. */
export const OTHER_GROUPS: { kind: FranchiseKind; title: string }[] = [
  { kind: "movie", title: "Films" },
  { kind: "special", title: "Spéciaux et OVA" },
  { kind: "sideStory", title: "Histoires parallèles" },
  { kind: "spinOff", title: "Spin-off" },
  { kind: "alternative", title: "Autres versions" },
  { kind: "other", title: "Autres" },
];

export function groupOthers(franchise: Franchise): { kind: FranchiseKind; title: string; items: FranchiseMember[] }[] {
  const groups = OTHER_GROUPS.map((g) => ({ ...g, items: franchise.others.filter((m) => m.kind === g.kind) })).filter((g) => g.items.length > 0);
  // Full alternative series are central branches; shorter extras retain their real relation types.
  return groups.sort((a, b) => Number(b.kind === "alternative" && b.items.some(m => m.entry.format === "TV" || m.entry.format === "ONA")) - Number(a.kind === "alternative" && a.items.some(m => m.entry.format === "TV" || m.entry.format === "ONA")));
}
