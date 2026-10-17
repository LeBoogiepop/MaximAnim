import type { ProgressRecord } from "@/lib/db/types";
import { isInProgress, nextEpisodeFor, watchedCount } from "@/lib/progress/logic";

/** Playback intent and its exact destination: which episode to start or resume, and what to call it. */
export type PrimaryAction = { label: "Commencer" | "Reprendre" | "Lire" | "Revoir"; episode: number };

export function primaryAction(input: { single: boolean; records: ProgressRecord[]; available: number | null; total: number | null }): PrimaryAction | null {
  const { single, records, available, total } = input;
  const seen = watchedCount(records);
  const next = nextEpisodeFor(records, available);
  const started = records.length > 0;
  if (next != null) {
    if (records.some((r) => r.episodeNumber === next && isInProgress(r))) return { label: "Reprendre", episode: next };
    return { label: started || single ? "Lire" : "Commencer", episode: next };
  }
  const finished = started && total != null && seen >= total;
  return finished ? { label: "Revoir", episode: 1 } : null;
}
