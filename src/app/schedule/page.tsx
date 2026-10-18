import type { Metadata } from "next";
import { ScheduleScreen } from "@/features/schedule/ScheduleScreen";

export const metadata: Metadata = { title: "Schedule" };

export default function SchedulePage() {
  return <ScheduleScreen />;
}
