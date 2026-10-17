"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import type { FollowLine } from "@/lib/airing/schedule";

/**
 * The one line under a followed series: « Épisode 01 · 20 octobre ». A forecast date is never presented as certain: it carries
 * a quiet « ≈ » whose accessible name says « Prévision »; an announced date has no marker.
 */
export function FollowReleaseLine({ line, className }: { line: FollowLine; className?: string }) {
  useInterfaceLanguage();
  if (line.kind === "text") return <span className={className} data-follow-line="text">{line.text}</span>;
  return (
    <span className={className} data-follow-line={line.forecast ? "forecast" : "announced"}>
      {ui("Épisode {0}", line.episode)}{" · "}
      {line.forecast && <><span role="img" aria-label={ui("Prévision")} title={ui("Prévision")}>≈</span>{" "}</>}
      {line.date}
    </span>
  );
}
