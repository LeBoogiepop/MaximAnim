import { notFound } from "next/navigation";
import { SmartViewScreen } from "@/features/library/SmartViewScreen";
import { SMART_VIEWS, type SmartView } from "@/lib/library/views";

export default async function SmartViewPage({ params }: PageProps<"/lists/auto/[view]">) {
  const { view } = await params;
  if (!(SMART_VIEWS as readonly string[]).includes(view)) notFound();
  return <SmartViewScreen view={view as SmartView} />;
}
