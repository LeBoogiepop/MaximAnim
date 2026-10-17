import type { AnimeEntry, Franchise, FranchiseMember } from "@/types/anime";

/**
 * What the franchise page says about the franchise as a whole, in plain words: how many seasons, over which years, and
 * whether it is still going. Never a bare ellipsis, never a count that includes what has not aired. Pure.
 */
export interface FranchiseHeader {
  /** « 3 saisons », « Une saison », « Série continue », « 3 séries » (a long runner is not made of seasons). */
  count: string;
  /** « 2023 à aujourd'hui », « 2019 à 2022 », « 2024 », « Prévue en 2027 ». Null when no year is known. */
  period: string | null;
  /** « En cours », « Suite annoncée », « Terminée », « À venir ». */
  state: string;
}

const startYear = (e: AnimeEntry): number | null => e.startDate?.year ?? e.seasonYear ?? null;

/** The year an entry ended in (its end date), else the year it started in; null when neither is known. */
const endYear = (e: AnimeEntry): number | null => e.endDate?.year ?? startYear(e);

const airing = (m: FranchiseMember) => m.entry.status === "RELEASING" || m.entry.status === "HIATUS";
const announced = (m: FranchiseMember) => m.entry.status === "NOT_YET_RELEASED";

function years(list: (number | null)[]): number[] {
  return list.filter((y): y is number => y != null);
}

export function franchiseHeader(franchise: Franchise): FranchiseHeader {
  const aired = franchise.main.filter((m) => !announced(m));
  const upcoming = franchise.main.filter(announced);
  const releasing = aired.some(airing);

  let count: string;
  if (franchise.continuous) {
    count = aired.length <= 1 ? "Série continue" : `${aired.length} séries`;
  } else {
    // A continuation cour shares the number of its season: it is not one more.
    const seasons = new Set(aired.map((m) => m.season)).size;
    count = seasons === 0 ? "À venir" : seasons === 1 ? "Une saison" : `${seasons} saisons`;
  }
  if (franchise.truncated && aired.length > 1) count += " ou plus";

  let period: string | null = null;
  const first = years(aired.map((m) => startYear(m.entry)));
  if (first.length) {
    const from = Math.min(...first);
    if (releasing) period = `${from} à aujourd'hui`;
    else {
      const to = Math.max(...years(aired.map((m) => endYear(m.entry))), from);
      period = to > from ? `${from} à ${to}` : `${from}`;
    }
  } else {
    const next = years(upcoming.map((m) => startYear(m.entry)));
    if (next.length) period = `Prévue en ${Math.min(...next)}`;
  }

  const state = releasing ? "En cours" : aired.length === 0 ? "À venir" : upcoming.length ? "Suite annoncée" : "Terminée";
  return { count, period, state };
}

/** « Saison 3 », « Saison 3, partie 2 », or null for what is not a numbered season (a long runner, a secondary work). */
export function seasonLabel(member: Pick<FranchiseMember, "season" | "part">): string | null {
  if (member.season == null) return null;
  return member.part != null ? `Saison ${member.season}, partie ${member.part}` : `Saison ${member.season}`;
}
