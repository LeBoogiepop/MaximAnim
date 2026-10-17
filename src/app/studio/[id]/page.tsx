import { notFound } from "next/navigation";
import { StudioScreen } from "@/features/studio/StudioScreen";

export default async function Page({ params }: PageProps<"/studio/[id]">) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) notFound();
  return <StudioScreen id={n} />;
}
