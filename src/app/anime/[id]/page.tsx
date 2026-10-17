import { notFound } from "next/navigation";
import { AnimeDetailScreen } from "@/features/anime/AnimeDetailScreen";

export default async function AnimePage({ params, searchParams }: PageProps<"/anime/[id]">) {
  const { id } = await params;
  const { lab } = await searchParams;
  const animeId = Number(id);
  if (!Number.isInteger(animeId) || animeId <= 0) notFound();
  return <AnimeDetailScreen id={animeId} openLab={lab === "1"} />;
}
