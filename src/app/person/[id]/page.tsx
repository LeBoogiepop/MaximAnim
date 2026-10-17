import { notFound } from "next/navigation";
import { PersonScreen } from "@/features/person/PersonScreen";

export default async function Page({ params, searchParams }: PageProps<"/person/[id]">) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) notFound();
  // The anime page this person was opened from (their work ON IT comes first): a positive integer or nothing.
  const { fromAnime } = await searchParams;
  const from = typeof fromAnime === "string" && /^\d{1,9}$/.test(fromAnime) ? Number(fromAnime) : null;
  return <PersonScreen id={n} fromAnime={from != null && from > 0 ? from : null} />;
}
