"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { useQuery } from "@tanstack/react-query";
import { FactRow } from "@/components/ui/FactList";
import { workOptions } from "@/features/catalogue/queries";
import { SOURCE_LABELS } from "@/lib/utils/format";
import { routes } from "@/lib/utils/routes";
import type { Anime } from "@/types/anime";

export function publicationStatus(status: string | null | undefined): string {
  return ({ RELEASING: ui("En cours"), FINISHED: ui("Terminé"), HIATUS: ui("En pause"), CANCELLED: ui("Arrêté"), NOT_YET_RELEASED: ui("À venir") } as Record<string, string>)[status ?? ""] ?? ui("Inconnu");
}
/** Only the entry's unambiguous SOURCE link; never its season or franchise status. */
export function SourcePublication({ anime }: { anime: Anime }) {
  useInterfaceLanguage();
  const ref = anime.source !== "ORIGINAL" ? anime.sourceWork : null;
  const query = useQuery({ ...workOptions(ref?.id ?? 0), enabled: !!ref });
  if (!ref) return null;
  const matched = query.data?.id === ref.id && ["MANGA", "NOVEL", "ONE_SHOT"].includes(query.data.format ?? "") && (ref.format == null || query.data.format === ref.format);
  const medium = (anime.source ? SOURCE_LABELS[anime.source] : null) ?? (ref.format === "NOVEL" ? ui("Roman") : "Manga");
  return <>
    <FactRow label={ui("{0} d'origine", medium)} fact="source-publication" linkTestId="origin-link" href={routes.work(ref.id, anime.source === "LIGHT_NOVEL" || anime.source === "WEB_NOVEL" ? anime.source : null)}>
      {matched ? publicationStatus(query.data?.status) : query.isPending ? ui("Chargement…") : ui("Inconnu")}
    </FactRow>
  </>;
}
