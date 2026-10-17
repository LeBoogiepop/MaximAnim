"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
/** The player's stage, empty and graphite, as soon as the tap is taken: the episode is being prepared. */
export default function Loading() {
  useInterfaceLanguage();
  return (
    <div aria-busy="true" aria-label={ui("Préparation de l'épisode")} data-testid="page-loading">
      <div className="px-safe" style={{ paddingTop: "calc(var(--safe-top) + 0.5rem)" }}>
        <div className="skeleton h-9 w-9 rounded-full" />
      </div>
      <div className="mt-2 aspect-video w-full bg-black" />
    </div>
  );
}
