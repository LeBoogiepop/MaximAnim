import { isInProgress } from "@/lib/progress/logic";
import type { ProgressRecord, LibraryStateRecord } from "@/lib/db/types";

/** Filmography tint records viewing, independently of Continue dismissal or list membership. */
export function hasWatchedWork(progress: readonly ProgressRecord[], state?: LibraryStateRecord): boolean {
  return state?.state === "completed" || progress.some(p => p.completed || isInProgress(p));
}
