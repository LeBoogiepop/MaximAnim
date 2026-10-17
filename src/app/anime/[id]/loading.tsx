"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { AnimeDetailSkeleton } from "@/features/anime/AnimeDetailSkeleton";

export default function Loading() {
  useInterfaceLanguage();
  return <AnimeDetailSkeleton label={ui("Chargement de la fiche")} />;
}
