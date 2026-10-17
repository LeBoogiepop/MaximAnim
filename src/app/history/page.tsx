import type { Metadata } from "next";
import { HistoryScreen } from "@/features/history/HistoryScreen";

export const metadata: Metadata = { title: "Historique" };

export default function HistoryPage() {
  return <HistoryScreen />;
}
