"use client";


import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QUERY } from "@/config/app";
import { useTranslatorAvailable } from "@/lib/translation/availability";
import { createRemoteTranslator } from "@/lib/translation/remote";
import { translateDescription } from "@/lib/anilist/french-description";
import { parseDescription } from "@/lib/anilist/description";

/** AniList description rendered as plain React text (never innerHTML), always read in full. */
export function Description({ raw }: { raw: string | null }) {
  useInterfaceLanguage();
  const available = useTranslatorAvailable();
  const [original, setOriginal] = useState(false);
  const translated = useQuery({ queryKey: ["synopsis-fr", raw], queryFn: ({ signal }) => translateDescription(raw!, createRemoteTranslator(), signal), enabled: available && !!raw, staleTime: QUERY.animeStaleMs, retry: false });
  const shown = !original && translated.data ? translated.data : raw;
  const paragraphs = useMemo(() => parseDescription(shown), [shown]);
  if (!paragraphs.length) return null;
  return (
    <div>
      <div className="space-y-3 text-[15px] leading-relaxed text-soft">
        {paragraphs.map((p, i) => (
          <p key={i}>
            {p.map((s, j) => (
              <span key={j} className={`${s.italic ? "italic" : ""} ${s.bold ? "font-bold text-paper" : ""}`}>
                {s.text}
              </span>
            ))}
          </p>
        ))}
      </div>
      {translated.data && <button type="button" className="min-h-11 text-xs text-soft" onClick={() => setOriginal(!original)}>{original ? ui("Afficher la traduction française") : ui("Traduction automatique · Voir l'original")}</button>}
    </div>
  );
}
