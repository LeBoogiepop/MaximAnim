import { notFound } from "next/navigation";
import { EpisodesScreen } from "@/features/episodes/EpisodesScreen";

export default async function EpisodesPage({ params }: PageProps<"/anime/[id]/episodes">) {
  const { id } = await params;
  const animeId = Number(id);
  if (!Number.isInteger(animeId) || animeId <= 0) notFound();
  return <EpisodesScreen animeId={animeId} />;
}
