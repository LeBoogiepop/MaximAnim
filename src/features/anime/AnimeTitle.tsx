"use client";

import { SourceImage as Image } from "@/components/ui/SourceImage";
import { useEffect, useState, type CSSProperties } from "react";
import { RC10 } from "@/config/app";
import { officialTitleLogo } from "@/lib/artwork/title-logos";
import type { TitlePreference } from "@/types/anime";
import { hasSeenArtwork, isPainted, rememberArtwork } from "@/lib/artwork/reveal";
import { tmdbLogo, type TmdbArtwork } from "@/lib/artwork/tmdb";
import { logoMaxHeightRem, splitSeasonTitle, titleScale } from "@/lib/artwork/title-fit";

type Logo = { src: string; width: number; height: number };

/** The localized semantic title stays the same for logos, fallback and sticky chrome. */
export function AnimeTitle({ animeId, title, preference, artwork, inherited = null, pending = false, rootTitle = null }: { animeId: number; title: string; /** The franchise's first season's title: a later season's typographic title is split against it (same words, same size, one small line for the season). */ rootTitle?: string | null; subtitle?: string | null; preference: TitlePreference; artwork?: TmdbArtwork; /** The franchise's common logo (`franchiseLogoRoot`), used only when the entry has none of its own. */ inherited?: Logo | null; pending?: boolean }) {
  const matchingTmdbLogo = tmdbLogo(artwork?.animeId === animeId && artwork.status === "ready" ? artwork : undefined, preference);
  // Latin preferences never enter the curated Japanese asset path.
  const candidate = (preference === "native" ? officialTitleLogo(animeId, preference) ?? matchingTmdbLogo : matchingTmdbLogo) ?? inherited;
  const [failed, setFailed] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<string | null>(() => candidate && hasSeenArtwork(candidate.src) ? candidate.src : null);
  const logo = candidate && failed !== candidate.src ? candidate : null;
  useEffect(() => {
    if (pending || !logo || decoded === logo.src) return;
    const timer = setTimeout(() => setFailed(logo.src), RC10.heroImageBudgetMs);
    return () => clearTimeout(timer);
  }, [logo, decoded, pending]);
  const split = !pending && !logo ? splitSeasonTitle(title, rootTitle) : null;
  return <>
    <h1 className={pending || logo ? "anime-title-logo" : "display-title"} style={logo ? { "--logo-h": `${logoMaxHeightRem(logo.width / logo.height)}rem` } as CSSProperties : pending ? undefined : { "--title-scale": titleScale(split ? split.main : title) } as CSSProperties} data-title-ready={!pending && (!logo || decoded === logo.src)}>
      {pending ? <><span className="sr-only">{title}</span><span className="hero-title-skeleton" aria-hidden="true" /></> : logo ? <><span className="sr-only">{title}</span>{decoded !== logo.src && <span className="hero-title-skeleton" aria-hidden="true" />}<Image src={logo.src} alt="" width={logo.width} height={logo.height} sizes={RC10.heroLogoSizes} loading="eager" fetchPriority="high" quality={85} className="poster-fade motion-reduce:transition-none" style={{ opacity: decoded === logo.src ? 1 : 0, maxWidth: `min(100%, ${logo.width / 2}px)` }} ref={el => { if (isPainted(el) && decoded !== logo.src) { rememberArtwork(logo.src); setDecoded(logo.src); } }} onLoad={() => { rememberArtwork(logo.src); setDecoded(logo.src); }} onError={() => setFailed(logo.src)} /></> : split ? <><span className="title-main">{split.main}</span><span className="sr-only"> — </span><span className="title-qualifier">{split.qualifier}</span></> : title}
    </h1>
  </>;
}
