"use client";
import { DetailTopBar } from "@/components/layout/DetailTopBar";
import { DockDiagnosticPanel } from "./DockDiagnosticPanel";
import { usePreferences } from "./PreferencesContext";
import { updatePreferences } from "@/lib/db/preferences";
import { ArtworkCredits } from "./ArtworkCredits";
export function SettingsScreen() {
  const preferences = usePreferences();
  return <div><DetailTopBar fallback="/" /><div className="px-safe flex flex-col gap-6 pb-8"><h1 className="display-title">MaximAnim · Portfolio</h1><p className="text-soft">Bibliothèque locale, catalogue AniList et médias de démonstration autorisés. Aucun compte nécessaire.</p><label>Langue / Language <select className="min-h-11 bg-raised px-3" value={preferences.interfaceLanguage} onChange={event => void updatePreferences({ interfaceLanguage: event.target.value === "en" ? "en" : "fr" })}><option value="en">English</option><option value="fr">Français</option></select></label><a className="text-accent min-h-11" href="https://www.youtube.com/@booogiepopp" target="_blank" rel="noreferrer">Boogiepop · YouTube</a><ArtworkCredits /><details><summary className="min-h-11 cursor-pointer">Avancé · Diagnostic PWA</summary><DockDiagnosticPanel /></details></div></div>;
}
