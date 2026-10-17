"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { PageLoading } from "@/components/ui/PageLoading";

export default function Loading() {
  useInterfaceLanguage();
  return <PageLoading label={ui("Chargement de la fiche")} />;
}
