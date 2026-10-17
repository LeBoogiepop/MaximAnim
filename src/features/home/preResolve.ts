import type { AnimeSummary } from "@/types/anime";
// A visit never preloads a YouTube iframe or chooses a demo before a play intent.
export function useNextToWatchPreResolve(_target: { anime: AnimeSummary; episodeNumber: number } | null) {}
