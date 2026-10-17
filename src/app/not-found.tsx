"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  useInterfaceLanguage();
  return (
    <div className="safe-top px-safe pt-16">
      <EmptyState title={ui("Page introuvable")} action={<ButtonLink href="/">{ui("Retour à l'accueil")}</ButtonLink>}>
        {ui("Ce lien ne mène nulle part dans Maximanim.") + " "}</EmptyState>
    </div>
  );
}
