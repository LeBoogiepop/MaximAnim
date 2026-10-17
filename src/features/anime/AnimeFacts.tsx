"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import type { ReactNode } from "react";
import { FactList, FactRow, FactStatus } from "@/components/ui/FactList";
import { intent } from "@/features/catalogue/queries";
import { isSingleItem } from "@/lib/anilist/normalize";
import { foundationOf } from "@/lib/anilist/editorial";
import { unreleasedStoryOf } from "@/lib/anilist/origin";
import { et } from "@/lib/i18n/messages-entities";
import { countryOf, durationLabel, formatLabel, SOURCE_LABELS } from "@/lib/utils/format";
import { diffusionStatus, episodesFact, periodLabel, seasonYearLabel } from "@/lib/utils/facts";
import { SourcePublication } from "./SourcePublication";
import type { Anime, Studio } from "@/types/anime";

/**
 * The fiche technique: the same rows in the same order for EVERY season of every anime — Type, Pays, Diffusion, Épisodes,
 * Origine, Studio — whether or not the viewer has started it. A row is absent only when AniList does not know the fact
 * (never « ? », never an invented total). Everything is about THIS entry (this season, this film): « Terminée » never speaks
 * for the whole franchise. The duration of an episode is secondary, in À propos. No AniList score, no global rating.
 */

export interface Fact {
  key: string;
  label: string;
  value: ReactNode;
  /** A second, quieter line. */
  note?: ReactNode;
  /** The whole row opens this. */
  href?: string;
  /** Weighs more than its neighbours (the animation studio). */
  emphasis?: boolean;
  linkTestId?: string;
  /** What a finger going down on the row's link is a hint of: the page it opens is prefetched (only the tapped target). */
  prefetch?: { kind: "studio" | "work"; id: number };
}

/** The studios that made the anime: the main animation studios; else the main ones. Producers and other credits are not « the studio ». */
export function headlineStudios(studios: readonly Studio[]): Studio[] {
  const animation = studios.filter((s) => s.isAnimationStudio && s.isMain);
  return (animation.length ? animation : studios.filter((s) => s.isMain)).slice(0, 2);
}

export function factsOf(anime: Anime, { originHref = null, studioHref }: { originHref?: string | null; studioHref?: (id: number) => string }): Fact[] {
  const workId = anime.sourceWork?.id ?? null;
  const single = isSingleItem(anime);
  const country = countryOf(anime.countryOfOrigin);
  const origin = (anime.source ? SOURCE_LABELS[anime.source] : null) ?? (anime.sourceWork?.format === "NOVEL" ? ui("Roman") : anime.sourceWork?.format === "MANGA" || anime.sourceWork?.format === "ONE_SHOT" ? "Manga" : null);
  const season = seasonYearLabel(anime);
  const period = periodLabel(anime.startDate, anime.endDate, anime.status);
  const status = diffusionStatus(anime.status, anime.format);
  const episodes = single ? null : episodesFact(anime);
  const duration = single ? durationLabel(anime.episodeDuration, false) : null;
  const studios = headlineStudios(anime.studios);
  const foundation = foundationOf([anime.id]);
  // A film tagged ORIGINAL beside an adapted franchise is a new story of that franchise, not an original work.
  const unreleased = foundation ? null : unreleasedStoryOf(anime);

  const facts: (Fact | null)[] = [
    formatLabel(anime.format) ? { key: "type", label: "Type", value: formatLabel(anime.format) } : null,
    country ? { key: "country", label: ui("Pays"), value: country.name } : null,
    season || period
      ? {
          key: "run",
          label: ui("Diffusion"),
          value: season ?? period,
          note:
            season && period ? (
              <>
                {period}
                {status && <FactStatus tone={status.tone}>{status.label}</FactStatus>}
              </>
            ) : status ? (
              <FactStatus tone={status.tone}>{status.label}</FactStatus>
            ) : null,
        }
      : null,
    // A film has no episodes: its length takes the place.
    episodes ? { key: "episodes", label: ui("Épisodes"), value: episodes.value, note: episodes.note } : duration ? { key: "duration", label: ui("Durée"), value: duration } : null,
    origin
      ? {
          key: "origin",
          label: ui("Origine"),
          value: unreleased ? et("Histoire inédite") : origin,
          note: unreleased ? et("Inédite dans l'œuvre source, franchise adaptée de {0}", SOURCE_LABELS[unreleased.source] ?? "") : foundation?.source === anime.source ? [foundation.title, foundation.creators].filter(Boolean).join(" · ") : undefined,
          href: originHref ?? (foundation?.source === anime.source ? foundation.href : undefined),
          linkTestId: "origin-link",
          prefetch: originHref && workId != null ? { kind: "work", id: workId } : undefined,
        }
      : null,
    foundation && foundation.source !== anime.source ? { key: "foundation", label: ui("Source fondatrice"), value: SOURCE_LABELS[foundation.source], href: foundation.href } : null,
    studios.length
      ? {
          key: "studio",
          label: "Studio",
          value:
            studioHref == null ? (
              studios.map((s) => s.name).join(", ")
            ) : studios.length === 1 ? (
              studios[0]!.name
            ) : (
              // Parallel studios, not a path: side by side, a dot between, each its own link (44 px high), no chevron chain.
              <span className="flex flex-wrap items-center justify-end" data-testid="studios">
                {studios.map((s) => (
                  <span key={s.id} className="flex items-center">
                    <Link href={studioHref(s.id)} className="fact-link ml-3 inline-flex min-h-11 items-center px-0.5 transition-opacity active:opacity-60" data-testid="studio-link">
                      {s.name}
                    </Link>
                  </span>
                ))}
              </span>
            ),
          href: studioHref && studios.length === 1 ? studioHref(studios[0]!.id) : undefined,
          linkTestId: "studio-link",
          prefetch: studioHref && studios.length === 1 ? { kind: "studio", id: studios[0]!.id } : undefined,
        }
      : null,
  ];
  return facts.filter((f): f is Fact => f != null);
}

export function AnimeFacts({ facts, anime }: { facts: Fact[]; anime?: Anime }) {
  useInterfaceLanguage();
  const queryClient = useQueryClient();
  if (!facts.length) return null;
  return (
    <section aria-label={ui("Informations")} className="px-safe">
      <FactList testId="anime-facts">
        {facts.map((f) => f.key === "origin" && anime?.sourceWork && anime.source !== "ORIGINAL" ? <SourcePublication key={f.key} anime={anime} /> : (
          <FactRow key={f.key} fact={f.key} label={f.label} note={f.note} href={f.href} emphasis={f.emphasis} linkTestId={f.linkTestId} onIntent={f.prefetch ? () => intent[f.prefetch!.kind](queryClient, f.prefetch!.id) : undefined}>
            {f.value}
          </FactRow>
        ))}
      </FactList>
    </section>
  );
}
