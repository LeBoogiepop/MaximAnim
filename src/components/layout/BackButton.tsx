"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/Button";
import { hasInAppHistory } from "@/lib/utils/navigation";

/**
 * Back that behaves like a native app: pops history when there is in-app
 * history, otherwise goes *up* to a sensible parent (opened from a link, the
 * home screen, a reload). Going up replaces the current entry: a push would
 * let the next Back pop straight back down to the page just left — a loop.
 */
export function BackButton({ fallback = "/", label = ui("Retour"), variant = "ghost" }: { fallback?: string; label?: string; variant?: "ghost" | "overlay" }) {
  useInterfaceLanguage();
  const router = useRouter();
  return (
    <IconButton
      label={label}
      variant={variant}
      className="-ml-2.5"
      onClick={() => {
        if (hasInAppHistory()) router.back();
        else router.replace(fallback);
      }}
    >
      <ChevronLeft size={24} className="context-accent" aria-hidden="true" />
    </IconButton>
  );
}
