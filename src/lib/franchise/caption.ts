import { relationLabel } from "@/lib/anilist/editorial";
import { et } from "@/lib/i18n/messages-entities";
import { formatLabel } from "@/lib/utils/format";
import type { Franchise, FranchiseKind, FranchiseMember, RelationType } from "@/types/anime";
import { seasonLabel } from "./label";

/**
 * What the small card of a related work says, as separate lines (never one clipped sentence): WHAT it is, HOW it relates
 * when AniList says it about the entry being read, the full year, and a status only when it is airing or announced.
 * No episode count. Pure.
 */
export interface RelatedCaption {
  /** « Saison 3 », « Film », « OVA », « Spécial »: what the work is. */
  kind: string;
  /** « Suite », « Histoire parallèle »…: AniList's relation as seen FROM the entry being read; null when it is seen from elsewhere. */
  relation: string | null;
  year: number | null;
  status: string | null;
  /** « Suite de la saison 2 »: the numbered season this work is proven (by AniList's own prequel/sequel edge) to continue, when that is not the entry being read. */
  continues?: string;
}

/** The same relation seen from the other side. Only the ones whose reverse AniList states unambiguously. */
const REVERSE: Partial<Record<RelationType, RelationType>> = { PREQUEL: "SEQUEL", SEQUEL: "PREQUEL", ALTERNATIVE: "ALTERNATIVE", OTHER: "OTHER" };

/**
 * What `memberId` is TO `currentId`, from the relations AniList states: directly (current → member), else the same relation
 * read from the member's side and reversed. Null when the graph does not say; never inferred from dates or titles.
 */
export function relationSeenFrom(franchise: Franchise | undefined, currentId: number, memberId: number): RelationType | null {
  for (const e of franchise?.edges ?? []) if (e.from === currentId && e.to === memberId) return e.type;
  for (const e of franchise?.edges ?? []) if (e.from === memberId && e.to === currentId) return REVERSE[e.type] ?? null;
  return null;
}

/** The numbered main season `memberId` is proven to follow (not the entry being read); null when the graph does not say. */
function continuesSeason(franchise: Franchise | undefined, currentId: number, memberId: number): number | null {
  for (const e of franchise?.edges ?? []) {
    const before = e.from === memberId && e.type === "PREQUEL" ? e.to : e.to === memberId && e.type === "SEQUEL" ? e.from : null;
    if (before == null || before === currentId) continue;
    const season = franchise?.main.find(m => m.entry.id === before);
    if (season?.season != null) return season.season;
  }
  return null;
}

const KIND_LABEL: Partial<Record<FranchiseKind, () => string>> = {
  sideStory: () => et("Histoire parallèle"),
  spinOff: () => "Spin-off",
  alternative: () => et("Version alternative"),
  other: () => et("Œuvre liée"),
};

export function relatedCaption(member: FranchiseMember, currentId: number, franchise?: Franchise): RelatedCaption {
  const entry = member.entry;
  const numbered = member.kind === "main" ? seasonLabel(member) : null;
  const format = formatLabel(entry.format);
  let kind: string;
  if (numbered) kind = numbered;
  else if (member.kind === "movie") kind = et("Film");
  else if (member.kind === "special") kind = entry.format === "TV" ? et("Spécial") : (format ?? et("Spécial"));
  else kind = member.kind === "main" ? (format ?? et("Série")) : (KIND_LABEL[member.kind]?.() ?? format ?? et("Œuvre liée"));
  // The relation is only said when it was read on the entry being looked at: from another entry it would not describe THIS page.
  // With the graph, the relation is said from ANY page (it used to exist only on the page whose entry the edge was read from).
  const seen = franchise ? relationSeenFrom(franchise, currentId, entry.id) : member.relationFrom === currentId ? (member.relation ?? null) : null;
  let relation = seen ? relationLabel(seen, entry.id, currentId) : null;
  if (relation === kind || (member.kind === "main" && numbered)) relation = null;
  const status = entry.status === "RELEASING" ? et("En diffusion") : entry.status === "NOT_YET_RELEASED" ? et("À venir") : null;
  const continues = member.kind === "main" ? null : continuesSeason(franchise, currentId, entry.id);
  return { kind, relation, year: entry.startDate?.year ?? entry.seasonYear ?? null, status, ...(continues != null ? { continues: et("Suite de la saison {0}", continues) } : {}) };
}
