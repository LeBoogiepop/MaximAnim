import type { QueryClient } from "@tanstack/react-query";
import type { AnimeSummary } from "@/types/anime";
import type { PlaybackProvider } from "@/lib/providers/types";
// Public metadata pages share the private edition's UI, never its resolver.
export async function prefetchWatch(_queryClient: QueryClient, _anime: AnimeSummary, _provider: PlaybackProvider | null, _episodeNumber: number, _options?: { prepare?: boolean }): Promise<void> {}
