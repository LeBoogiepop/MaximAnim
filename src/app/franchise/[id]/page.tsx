import { notFound } from "next/navigation";
import { FranchiseScreen } from "@/features/franchise/FranchiseScreen";

export default async function FranchisePage({ params }: PageProps<"/franchise/[id]">) {
  const { id } = await params;
  const animeId = Number(id);
  if (!Number.isInteger(animeId) || animeId <= 0) notFound();
  return <FranchiseScreen id={animeId} />;
}
