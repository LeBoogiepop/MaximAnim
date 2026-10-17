import { notFound } from "next/navigation";
import { WorkScreen } from "@/features/work/WorkScreen";

const NOVEL_ORIGINS = ["LIGHT_NOVEL", "WEB_NOVEL"] as const;

export default async function Page({ params, searchParams }: PageProps<"/work/[id]">) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) notFound();
  // How the anime words its origin (« Light novel »): only a known word is taken, anything else is ignored.
  const { origin } = await searchParams;
  const novel = NOVEL_ORIGINS.find((o) => o === origin) ?? null;
  return <WorkScreen id={n} origin={novel} />;
}
