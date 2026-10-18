import type { Metadata } from "next";
import { OfflineScreen } from "@/features/home/OfflineScreen";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return <OfflineScreen />;
}
