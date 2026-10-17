import { notFound } from "next/navigation";
import { StaffScreen } from "@/features/staff/StaffScreen";

export default async function Page({ params }: PageProps<"/anime/[id]/staff">) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) notFound();
  return <StaffScreen animeId={n} />;
}
