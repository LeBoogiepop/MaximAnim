import type { Metadata } from "next";
import { OfflineScreen } from "@/features/home/OfflineScreen";

export const metadata: Metadata = { title: "Hors ligne" };

export default function OfflinePage() {
  return <OfflineScreen />;
}
