"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { SectionTitle } from "@/components/ui/Section";
import { frenchGenre, frenchTags } from "@/lib/anilist/genres";
import { type ShownLink } from "@/lib/anilist/links";
import { isSingleItem } from "@/lib/anilist/normalize";
import { durationLabel } from "@/lib/utils/format";
import { routes } from "@/lib/utils/routes";
import type { Anime } from "@/types/anime";
import { Description } from "./Description";
import { headlineStudios } from "./AnimeFacts";

/**
 * « À propos » — everything that is not needed to choose an episode, always shown (nothing folds): the résumé, genres and themes
 * (said in French, as plain text — never a wall of pills), the length of an episode, the producers, alternative titles and
 * the few external links. The data is already in the page (nothing extra is fetched).
 */
export function AboutDisclosure({ anime, links }: { anime: Anime; links: ShownLink[] }) {
  useInterfaceLanguage();
  const altTitles = [...new Set([anime.titles.romaji, anime.titles.english, anime.titles.native, ...anime.synonyms].filter((t): t is string => Boolean(t)))].filter((t) => t !== anime.preferredTitle);
  const genres = anime.genres.map(frenchGenre);
  const themes = frenchTags(anime.tags);
  // The length of one episode is detail, not a headline fact (a film has it as its headline: see the facts).
  const duration = isSingleItem(anime) ? null : durationLabel(anime.episodeDuration, true);
  const headline = new Set(headlineStudios(anime.studios).map((s) => s.id));
  const producers = anime.studios.filter((s) => !headline.has(s.id)).slice(0, 6);
  const hasContent = Boolean(anime.description) || genres.length > 0 || themes.length > 0 || altTitles.length > 0 || links.length > 0 || Boolean(duration) || producers.length > 0;
  if (!hasContent) return null;
  return (
    <section aria-labelledby="about-title" className="px-safe" data-testid="about">
      <SectionTitle id="about-title">{ui("À propos")}</SectionTitle>
      <div className="mt-3 flex flex-col gap-5" data-testid="about-body">
          {anime.description && <Description raw={anime.description} />}
          {(genres.length > 0 || themes.length > 0 || duration || producers.length > 0) && (
            <dl className="flex flex-col gap-3 text-[15px]">
              {genres.length > 0 && <Line label="Genres">{genres.join(", ")}</Line>}
              {themes.length > 0 && <Line label={ui("Thèmes")}>{themes.join(", ")}</Line>}
              {duration && <Line label={ui("Durée")}>{duration.replace(" / ép.", ui(" par épisode"))}</Line>}
              {producers.length > 0 && (
                <Line label={ui("Autres crédits")}>
                  {producers.map((s, i) => (
                    <span key={s.id}>
                      <Link href={routes.studio(s.id)} className="font-medium text-paper active:text-accent">
                        {s.name}
                      </Link>
                      {i < producers.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </Line>
              )}
            </dl>
          )}
          {altTitles.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[15px] font-semibold">{ui("Autres titres")}</h3>
              <ul className="flex flex-col gap-0.5 text-[14px] text-soft">
                {altTitles.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {links.length > 0 && (
            <div>
              <h3 className="mb-1 text-[15px] font-semibold">{ui("Liens")}</h3>
              <ul className="flex flex-wrap gap-x-5">
                {links.map((l) => (
                  <li key={l.key}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-1.5 text-[15px] text-soft underline decoration-line underline-offset-4 active:opacity-70">
                      {l.label}
                      <ExternalLink size={14} className="text-muted" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>
    </section>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  useInterfaceLanguage();
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 font-medium text-paper/80">{label}</dt>
      <dd className="min-w-0 text-paper">{children}</dd>
    </div>
  );
}
