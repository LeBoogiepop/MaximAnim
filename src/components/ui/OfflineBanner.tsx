"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { WifiOff } from "lucide-react";
import { useOnline } from "@/hooks/useOnline";

export function OfflineBanner() {
  useInterfaceLanguage();
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4"
      style={{ paddingTop: "calc(var(--safe-top) + 0.5rem)" }}
    >
      <p className="animate-fade-in flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-[13px] text-paper">
        <WifiOff size={14} aria-hidden="true" />
        {ui("Hors ligne ta bibliothèque reste disponible")}</p>
    </div>
  );
}
