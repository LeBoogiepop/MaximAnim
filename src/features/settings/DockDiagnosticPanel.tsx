"use client";

import { useState, useSyncExternalStore } from "react";
import { DOCK_DIAGNOSTICS } from "@/config/app";
import { Switch } from "@/components/ui/Switch";
import { ui } from "@/lib/i18n/translate";
import type { DockWindow } from "@/lib/diagnostics/dock";

const changed = "mx-dock-diagnostic-opt-in";
const subscribe = (listener: () => void) => {
  window.addEventListener(changed, listener);
  return () => window.removeEventListener(changed, listener);
};
const armed = () => { try { return localStorage.getItem(DOCK_DIAGNOSTICS.enabledKey) === "1"; } catch { return false; } };

/** Reading/exporting is user-triggered and freezes recording before rendering any measurements. */
export function DockDiagnosticPanel() {
  const enabled = useSyncExternalStore(subscribe, armed, () => false);
  const [report, setReport] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const recorder = () => (window as DockWindow).__mxDockDiagnostic;
  const freeze = () => {
    try {
      const text = recorder()?.freeze() ?? localStorage.getItem(DOCK_DIAGNOSTICS.reportKey);
      setReport(text ? JSON.stringify(JSON.parse(text), null, 2) : null);
      setStatus(text ? "" : ui("Aucune mesure enregistrée. Active le diagnostic puis relance la PWA."));
    } catch { setStatus(ui("Stockage local indisponible.")); }
  };
  return <section className="flex flex-col gap-3 border-t border-line pt-3" aria-label={ui("Diagnostic du dock PWA")} data-testid="dock-diagnostic-panel">
    <div className="flex items-center justify-between gap-3">
      <span className="text-[15px]">{ui("Diagnostic du dock PWA")}</span>
      <Switch checked={enabled} label={ui("Diagnostic du dock PWA")} onChange={on => {
        try {
          if (!on) recorder()?.freeze();
          localStorage.setItem(DOCK_DIAGNOSTICS.enabledKey, on ? "1" : "0");
          window.dispatchEvent(new Event(changed));
          setStatus("");
        } catch { setStatus(ui("Stockage local indisponible.")); }
      }} />
    </div>
    <p className="text-xs leading-relaxed text-soft">{ui("Temporaire et local. Active-le, ferme complètement la PWA puis relance-la sur l'accueil. Attends de voir le dock avant de toucher. Après son déplacement, reviens ici pour figer et copier les mesures.")}</p>
    <p className="text-xs text-muted">{ui("Deux lancements maximum sont conservés. Aucune donnée de compte, contenu saisi ou adresse de page n'est enregistré ni envoyé.")}</p>
    <div className="flex flex-wrap gap-x-5">
      <button type="button" className="min-h-11 text-sm text-accent" onClick={freeze}>{ui("Figer et consulter les mesures")}</button>
      <button type="button" className="min-h-11 text-sm text-soft" onClick={() => {
        try {
          recorder()?.freeze();
          delete (window as DockWindow).__mxDockDiagnostic;
          localStorage.removeItem(DOCK_DIAGNOSTICS.reportKey);
          setReport(null); setStatus("");
        } catch { setStatus(ui("Stockage local indisponible.")); }
      }}>{ui("Effacer les mesures")}</button>
    </div>
    {report && <>
      <label className="flex flex-col gap-2 text-sm">{ui("Mesures du dock")}<textarea value={report} readOnly spellCheck={false} rows={12} className="w-full rounded-xl border border-line bg-ink p-3 font-mono text-base" data-testid="dock-diagnostic-report" /></label>
      <button type="button" className="min-h-11 self-start text-sm text-accent" onClick={async () => {
        try { await navigator.clipboard.writeText(report); setStatus(ui("Mesures copiées.")); }
        catch { setStatus(ui("Sélectionne le texte des mesures pour le copier.")); }
      }}>{ui("Copier les mesures")}</button>
    </>}
    {status && <p role="status" className="text-xs text-soft">{status}</p>}
  </section>;
}
