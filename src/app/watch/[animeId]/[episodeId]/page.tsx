import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WatchScreen } from "@/features/player/WatchScreen";
import { parseEpisodeSlug } from "@/lib/providers/episodes";

export const metadata: Metadata = { title: "Watch" };

export default async function WatchPage({ params, searchParams }: PageProps<"/watch/[animeId]/[episodeId]">) {
  const { animeId, episodeId } = await params;
  // "Tester la lecture" (Source Lab): one named source, never a URL or anything fetched.
  const { source } = await searchParams;
  const id = Number(animeId);
  const episodeNumber = parseEpisodeSlug(episodeId);
  if (!Number.isInteger(id) || id <= 0 || episodeNumber == null) notFound();
  return <WatchScreen animeId={id} episodeNumber={episodeNumber} labSource={typeof source === "string" && source.length <= 300 ? source : null} />;
}
