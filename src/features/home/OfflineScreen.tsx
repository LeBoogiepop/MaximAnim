"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { LogoMark } from "@/components/brand/LogoMark";
import { Button } from "@/components/ui/Button";

/** Served by the service worker when a page that was never visited is opened offline. */
export function OfflineScreen() {
  useInterfaceLanguage();
  return (
    <div className="safe-top px-safe flex min-h-[80dvh] flex-col items-center justify-center gap-4 text-center">
      <LogoMark size={64} />
      <h1 className="text-2xl font-bold">{ui("Pas de réseau")}</h1>
      <p className="max-w-xs text-sm text-soft">
        {ui("Cette page n'a pas encore été enregistrée pour une utilisation hors ligne. Ta bibliothèque, tes listes et ton historique restent disponibles.")}</p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => window.location.reload()}>
          {ui("Réessayer")}</Button>
        {/* A full document load on purpose: the service worker serves the cached shell. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="tactile inline-flex min-h-11 items-center rounded-2xl border border-line bg-accent px-4 font-bold text-ink [--shadow-color:var(--color-accent-deep)]">
          {ui("Accueil")}</a>
      </div>
    </div>
  );
}
