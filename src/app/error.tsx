"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useInterfaceLanguage();
  return (
    <div className="safe-top px-safe pt-16">
      <EmptyState title={ui("Quelque chose a coincé")} tone="warning" action={<Button onClick={reset}>{ui("Réessayer")}</Button>}>
        {ui("Tes données locales ne sont pas touchées. Recharge l'écran pour continuer.") + " "}</EmptyState>
    </div>
  );
}
