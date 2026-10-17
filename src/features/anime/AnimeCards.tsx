"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { Info, X } from "lucide-react";
import Link from "next/link";
import { Poster } from "@/components/ui/Poster";
import { EpisodeThumbnail } from "@/features/episodes/EpisodeThumbnail";
import { useEpisodeArtwork } from "@/features/episodes/useEpisodeArtwork";
import { toneVars } from "@/components/layout/ToneScope";
import { toneFromArtwork } from "@/lib/utils/tone";
import { routes } from "@/lib/utils/routes";
import { usePreferences, useTitles } from "@/features/settings/PreferencesContext";
import { shortItemLabel } from "@/lib/providers/episodes";
import { formatRemaining } from "@/lib/utils/format";
import { PROGRESS } from "@/config/app";
import type { AnimeSummary } from "@/types/anime";

const POSTER_SIZES = "(min-width: 768px) 160px, 34vw";

/** Poster card for rails and grids: cover, title, one line of progress. */
export function PosterCard({
  anime,
  href,
  caption,
  captionTone,
  progress,
  badge,
  priority,
  width = "w-[7.6rem]",
}: {
  anime: AnimeSummary;
  href: string;
  caption?: string | null;
  /** "cream" marks a highlight (a newly aired episode). */
  captionTone?: "cream";
  progress?: number | null;
  badge?: string | null;
  priority?: boolean;
  width?: string;
}) {
  useInterfaceLanguage();
  const { main } = useTitles();
  const { showAdult } = usePreferences();
  const title = main(anime.titles);
  if (anime.isAdult === true && !showAdult) return null;
  return (
    <Link href={href} className={`group block ${width}`} aria-label={[title, badge, caption].filter(Boolean).join(", ")}>
      <div className="lift relative transition-opacity duration-150 group-active:opacity-70">
        <Poster cover={anime.coverImage} alt="" sizes={POSTER_SIZES} priority={priority} className="" />
        {badge && (
          <span className="absolute top-1.5 left-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-medium text-paper">
            {badge}
          </span>
        )}
        {progress != null && progress > 0 && (
          // Progress belongs to the picture: a rose strip flush with the poster's bottom edge over a soft shade, no floating bar.
          <div className="absolute inset-x-0 bottom-0 overflow-hidden rounded-b-[var(--radius-poster)]" role="progressbar" aria-label={ui("Progression de {0}", title)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, progress) * 100)}>
            <div className="h-7 bg-gradient-to-t from-black/60 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/55" aria-hidden="true">
              <div className="h-full rounded-r-full bg-accent" style={{ width: `${Math.round(Math.min(1, progress) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-[13.5px] leading-tight font-medium">{title}</p>
      {caption && <p className={`mt-0.5 line-clamp-2 min-h-8 text-[12px] leading-4 ${captionTone === "cream" ? "font-medium text-cream" : "text-soft"}`}><CatalogueMeta text={caption} /></p>}
    </Link>
  );
}

/** One episode image, independent play/fiche/dismiss actions and embedded progress. */
export function ContinueCard({
  anime,
  href,
  episodeNumber,
  percentage,
  currentTime,
  duration,
  priority,
  onDismiss,
  nextLabel,
  artworkAllowed,
  completed = false,
}: {
  anime: AnimeSummary;
  href: string;
  episodeNumber: number;
  percentage: number;
  currentTime: number;
  duration: number;
  priority?: boolean;
  /** "Retirer de Continuer" (progress and history are kept). */
  onDismiss?: () => void;
  nextLabel?: string;
  artworkAllowed?: boolean;
  completed?: boolean;
}) {
  useInterfaceLanguage();
  const { main } = useTitles();
  const { showAdult } = usePreferences();
  const title = main(anime.titles);
  const revealed = artworkAllowed ?? currentTime > 0;
  const previews = useEpisodeArtwork(anime.id, revealed && (anime.isAdult !== true || showAdult));
  if (anime.isAdult === true && !showAdult) return null;
  const remaining = formatRemaining(currentTime, duration);
  const item = shortItemLabel(anime, episodeNumber);
  const preview = revealed ? previews.find(p => p.number === episodeNumber) : undefined;
  const partial = !completed && currentTime >= PROGRESS.minMeaningfulSeconds && percentage > 0 && percentage < 1;
  return (
    <div className="relative isolate overflow-hidden rounded-[var(--radius-poster)]" style={toneVars(toneFromArtwork(anime.coverImage.color))} data-testid={currentTime > 0 ? "continue-card" : "next-card"}>
      <Link href={href} prefetch={false} className="group block" aria-label={`${currentTime > 0 ? ui("Reprendre") : ui("Lire")} ${title}, ${item}${remaining ? `, ${remaining}` : ""}`}>
        <EpisodeThumbnail key={`${anime.id}:${episodeNumber}`} preview={preview} concealed={false} cover={anime.coverImage.extraLarge ?? anime.coverImage.large ?? anime.coverImage.medium} percentage={partial ? percentage : undefined} number={episodeNumber} priority={priority} sizes="(min-width: 1024px) 320px, 63vw" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/60" aria-hidden="true" />
        <span className="absolute left-3 right-12 top-3 line-clamp-2 text-[16px] font-semibold leading-snug text-white">{title}</span>
        <span className="absolute bottom-4 left-3 text-[13px] font-medium text-white">{item}{nextLabel ? ` · ${nextLabel}` : ""}</span>
      </Link>
        {onDismiss && <button type="button" onClick={onDismiss} aria-label={ui("Retirer {0} de Continuer", title)} className="absolute top-1 right-1 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white"><X size={17} aria-hidden="true" /></button>}
      <div className="absolute bottom-1 right-1 flex text-white">
        <Link href={routes.anime(anime.id)} aria-label={ui("Fiche de {0}", title)} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50"><Info size={17} aria-hidden="true" /></Link>
      </div>
    </div>
  );
}

/** Row used in search results and history. */
export function AnimeRow({
  anime,
  href,
  meta,
  metaContent,
  trailing,
  priority,
  showSubtitle = false,
}: {
  anime: AnimeSummary;
  href: string;
  meta?: string | null;
  /** A ready-made single line (e.g. a follow's « Épisode 01 · 20 octobre »): `meta` would split it on « · » into separate chips. */
  metaContent?: React.ReactNode;
  trailing?: React.ReactNode;
  priority?: boolean;
  showSubtitle?: boolean;
}) {
  useInterfaceLanguage();
  const { main, secondary } = useTitles();
  const { showAdult } = usePreferences();
  const title = main(anime.titles);
  if (anime.isAdult === true && !showAdult) return null;
  const sub = secondary(anime.titles);
  return (
    <Link href={href} className="group flex min-h-[5.5rem] items-center gap-3.5 rounded-2xl py-2 active:bg-raised">
      <Poster cover={anime.coverImage} alt="" sizes="64px" priority={priority} className="w-[3.6rem] shrink-0" rounded="rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[15px] leading-snug font-semibold">{title}</p>
        {showSubtitle && sub && <p className="truncate text-[13px] text-muted">{sub}</p>}
        {metaContent ? <p className="mt-1 line-clamp-2 text-[12px] text-soft">{metaContent}</p> : meta && <p className="mt-1 line-clamp-2 text-[12px] text-soft"><CatalogueMeta text={meta} /></p>}
      </div>
      {trailing}
    </Link>
  );
}

/** Status hues are semantic, independent of anime artwork or the global theme. */
export function CatalogueMeta({ text }: { text: string }) {
  useInterfaceLanguage();
  // Keep absolute screen-reader separators inside the scroller's clip chain.
  // Otherwise an off-screen card can enlarge the entire document on iPhone.
  return <span className="relative inline-flex flex-wrap gap-x-3 gap-y-0.5">{text.split(" · ").map((part, i) => <span key={i}>{i > 0 && <span className="sr-only">, </span>}<span className={part === ui("En diffusion") ? "text-green font-medium" : part === ui("À venir") ? "text-cream font-medium" : undefined}>{part}</span></span>)}</span>;
}
