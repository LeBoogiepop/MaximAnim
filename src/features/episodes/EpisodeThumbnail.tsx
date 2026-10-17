"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import Image from "next/image";
import { useState } from "react";
import { Film } from "lucide-react";
import { RC10 } from "@/config/app";
import type { EpisodePreview } from "@/lib/anilist/episodes";
import { formatEpisodeNumber } from "@/lib/providers/episodes";

export function EpisodeThumbnail({ preview, concealed, cover, banner, percentage, number, priority, settling = false, quiet = false, sizes = "(min-width: 640px) 208px, 176px" }: { preview: EpisodePreview | undefined; concealed: boolean; cover: string | null; banner?: string | null; percentage?: number; number: number; priority?: boolean; /** The exact-still sources have not answered yet: no series-wide stand-in is drawn meanwhile. */ settling?: boolean; /** A list that already says the number and the title: a concealed tile is only a calm, empty frame (the words stay for screen readers). */ quiet?: boolean; sizes?: string }) {
  useInterfaceLanguage();
  const [failed, setFailed] = useState<string[]>([]);
  const [bannerFailed, setBannerFailed] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const candidate = !concealed && RC10.episodeThumbnailsEnabled ? [preview, ...(preview?.alternatives ?? [])].find(p => p?.number === number && p.thumbnail && !failed.includes(p.thumbnail)) : undefined;
  const still = candidate?.thumbnail;
  // A verified border embedded in the original official image is cropped only at display time.
  const crop = candidate?.displayCrop;
  const scale = crop && crop.inset > 0 && crop.inset * 2 < Math.min(crop.width, crop.height) ? Math.max(crop.width / (crop.width - crop.inset * 2), crop.height / (crop.height - crop.inset * 2)) : 1;
  const waiting = settling && !concealed && !still;
  const landscape = !concealed && !still && !waiting && !bannerFailed ? banner : null;
  const generic = !concealed && !still && !waiting && !landscape && !coverFailed ? cover : null;
  // Absent data, a load error and a blocked resource are different states (the first needs no retry, the others do).
  const state = concealed ? "concealed" : still ? "exact" : waiting ? "loading" : landscape || generic ? "series" : failed.length || bannerFailed || coverFailed ? "error" : "absent";
  return <span data-testid="episode-thumbnail" data-artwork-state={state} data-artwork-source={candidate?.provenance ?? (still ? "anilist" : landscape || generic ? "series" : "none")} title={candidate?.attribution} className="relative flex w-full aspect-video items-center justify-center overflow-hidden rounded-[var(--radius-poster)] bg-gradient-to-br from-raised to-ink">
    {still ? <Image key={still} src={still} alt="" fill sizes={sizes} priority={priority} unoptimized={candidate?.provenance === "provider"} referrerPolicy="no-referrer" style={scale > 1 ? { transform: `scale(${scale})` } : undefined} className="object-cover" onError={() => setFailed(values => [...values, still])} /> : landscape ? <Image src={landscape} alt={ui("Illustration officielle de la série (pas une image de cet épisode)")} fill sizes={sizes} priority={priority} className="object-cover" onError={() => setBannerFailed(true)} /> : generic ? <>
      <Image src={generic} alt={ui("Affiche de l'anime (pas une image de cet épisode)")} fill sizes={sizes} priority={priority} className="object-cover object-[center_30%]" onError={() => setCoverFailed(true)} />
    </> : waiting ? <span className="skeleton absolute inset-0" aria-hidden="true" /> : <span role="img" aria-label={concealed ? ui("Image masquée pour éviter les spoilers") : ui("Aucune illustration autorisée disponible")} className="flex flex-col items-center gap-1 text-xs text-soft"><Film size={quiet ? 20 : 22} className={quiet ? "opacity-35" : "opacity-50"} aria-hidden="true" />{!quiet && <span aria-hidden="true" className="display-title text-3xl leading-none text-paper/25">{formatEpisodeNumber(number)}</span>}{concealed && <span className={quiet ? "sr-only" : undefined}>{ui("Sans spoiler")}</span>}</span>}
    {percentage != null && percentage > 0 && <span className="absolute inset-x-0 bottom-0 z-10 h-0.5 bg-black/60" role="progressbar" aria-label={ui("Progression de l'épisode ") + formatEpisodeNumber(number)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, percentage) * 100)}><span className="block h-full bg-[var(--tone,var(--color-accent))]" style={{ width: `${Math.min(1, percentage) * 100}%` }} /></span>}
  </span>;
}
