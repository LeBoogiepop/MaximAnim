import type { Metadata } from "next";
import { ListsScreen } from "@/features/lists/ListsScreen";

export const metadata: Metadata = { title: "Lists" };

export default function ListsPage() {
  return <ListsScreen />;
}
