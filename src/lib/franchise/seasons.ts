import type { Franchise, FranchiseMember } from "@/types/anime";

/**
 * The main series as the season selector shows it: ONE tab per logical season (« S3 »), and under a season that AniList
 * split into several cours a second, smaller choice (« Partie 1 », « Partie 2 »). Display only: every part stays its own
 * AniList entry (own id, own progress, own facts) and nothing is merged. Pure.
 */
export interface SeasonPart {
  entryId: number;
  /** 1-based position inside the season (the first cour has no number of its own in AniList). */
  part: number;
  member: FranchiseMember;
}

export interface SeasonGroup {
  season: number;
  /** « S3 ». */
  label: string;
  parts: SeasonPart[];
}

/** Null for a long runner (no seasons at all). */
export function seasonGroups(franchise: Franchise): SeasonGroup[] | null {
  if (franchise.continuous) return null;
  const groups = new Map<number, SeasonGroup>();
  for (const member of franchise.main) {
    if (member.season == null) continue;
    const group = groups.get(member.season) ?? { season: member.season, label: `S${member.season}`, parts: [] };
    // The first cour is part 1; a continuation says its own number, and never collides with an earlier part.
    const taken = new Set(group.parts.map((p) => p.part));
    let part = member.part ?? group.parts.length + 1;
    while (taken.has(part)) part += 1;
    group.parts.push({ entryId: member.entry.id, part, member });
    groups.set(member.season, group);
  }
  return [...groups.values()].map((g) => ({ ...g, parts: g.parts.sort((a, b) => a.part - b.part) })).sort((a, b) => a.season - b.season);
}

/** The season (and part) an entry belongs to, when it is one of the main series. */
export function locate(groups: readonly SeasonGroup[], entryId: number): { group: SeasonGroup; part: SeasonPart } | null {
  for (const group of groups) {
    const part = group.parts.find((p) => p.entryId === entryId);
    if (part) return { group, part };
  }
  return null;
}

/** True when at least one season has several parts: the second row is then reserved for every season (no vertical jump). */
export function hasParts(groups: readonly SeasonGroup[]): boolean {
  return groups.some((g) => g.parts.length > 1);
}
