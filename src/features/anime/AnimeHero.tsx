"use client";

import { SourceImage as Image } from "@/components/ui/SourceImage";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { RC10 } from "@/config/app";
import { HERO, MEDIA } from "@/config/media";
import { ui } from "@/lib/i18n/translate";
import { useTmdbArtwork } from "@/features/episodes/useTmdbArtwork";
import { useDesktopLayout } from "@/hooks/useDesktopLayout";
import { franchiseLogoRoot, inheritedLogo } from "@/lib/artwork/franchise-logo";
import { focusOf } from "@/lib/artwork/focal";
import { dissolveMask, focusWindowFor, heroSources, plateStyle, plateSizes, rankHeroSources, type HeroArtKind, type HeroFit, type HeroSource } from "@/lib/artwork/hero-art";
import { knownArtworkProbe, probeArtwork, type ArtworkProbe } from "@/lib/artwork/probe";
import { hasSeenArtwork, isPainted, recalledHeroDecision, rememberArtwork, rememberHeroDecision } from "@/lib/artwork/reveal";
import { tmdbLogo, type TmdbArtwork } from "@/lib/artwork/tmdb";
import { officialTitleLogo } from "@/lib/artwork/title-logos";
import type { Anime, Franchise, TitlePreference } from "@/types/anime";
import { AnimeTitle } from "./AnimeTitle";

/**
 * The top of an anime page: ONE stage — the picture, the title or logo, and (placed by the page) the season row — whose height
 * does not depend on the picture. Choosing another season keeps this component and swaps the entry's identity inside it.
 *
 * - ONE picture layer per entry, dissolved by a mask into the page's black: no blurred copy, no mirror, no second layer. Which
 *   picture is chosen from what each real one would BE in the tall phone frame (`lib/artwork/hero-art.ts`): a poster fits, a
 *   4.75:1 banner would be a crop of ~20 % of itself.
 * - One decision per identity. A first visit is neutral (the page's own ground) until the picture is decoded and fits. Choosing
 *   another season publishes only that entry’s artwork; a neutral stage holds its geometry until the new image is ready. A
 *   catalogue answer that arrives after the decision does not change what is on show; it serves the next visit.
 * - The title is the opposite of the art in one respect: it is drawn once, as the verified logo, and holds a skeleton (never the
 *   typographic fallback) until the catalogue has answered or its longer budget ends.
 */
export function AnimeHero({ anime, title, preference, switching, fromCache, controls, franchise, franchiseResolved, franchiseFailed = false, rootTitle = null }: { anime: Anime; title: string; preference: TitlePreference; switching: boolean; fromCache: boolean; controls: ReactNode; franchise: Franchise; franchiseResolved: boolean; franchiseFailed?: boolean; /** The first season's title (already localized), when the franchise is resolved and this is a later season. */ rootTitle?: string | null }) {
  const id = anime.id;
  const desktop = useDesktopLayout();
  const query = useTmdbArtwork(id, !switching);
  const decided = !query.isPending;
  const [waited, setWaited] = useState<{ id: number; hero: boolean; title: boolean } | null>(null);
  // The art waits only as long as a reviewed vertical picture could still change the choice (phones), or for the verified backdrop (desktop).
  const artBudget = desktop ? MEDIA.heroCatalogueBudgetMs : HERO.decisionBudgetMs;
  useEffect(() => {
    if (decided || switching) return;
    const hero = setTimeout(() => setWaited(w => ({ id, hero: true, title: w?.id === id && w.title })), artBudget);
    return () => clearTimeout(hero);
  }, [decided, switching, id, artBudget]);
  // This deadline includes the franchise walk and inherited artwork, even when our own query is already cached/settled.
  // A query completing early must not cancel or restart the entry's presentation budget.
  useEffect(() => {
    if (switching) return;
    const text = setTimeout(() => setWaited(w => ({ id, hero: w?.id === id && w.hero, title: true })), MEDIA.heroTitleBudgetMs);
    return () => clearTimeout(text);
  }, [switching, id]);
  const mine = waited?.id === id ? waited : null;
  const artwork = query.data?.animeId === id ? query.data : undefined;
  // A season with no logo of its own may show its franchise's common one. Only an entry that has a prequel can be a later season,
  // so the others never wait for the franchise; a later season holds the skeleton until the franchise and its first season's answer
  // are known (bounded by the title budget), so a logo never arrives after a generic title.
  const ownLogo = (preference === "native" ? officialTitleLogo(id, preference) : null) ?? tmdbLogo(artwork?.status === "ready" ? artwork : undefined, preference);
  const mayInherit = decided && !ownLogo && anime.relations.some(r => r.type === "PREQUEL");
  const rootId = mayInherit ? franchiseLogoRoot(franchise, franchiseResolved, id) : null;
  const root = useTmdbArtwork(rootId ?? 0, rootId != null && !switching);
  const inheritSettled = !mayInherit || ((franchiseResolved || franchiseFailed) && (rootId == null || !root.isPending));
  const inherited = inheritedLogo(root.data, rootId, preference);
  // The title for an entry that is not the one shown yet (switching) is never drawn: a skeleton holds its place.
  const titleReady = !switching && ((decided && inheritSettled) || mine?.title === true);
  // An entry whose picture was revealed earlier in this tab is decided: it needs no catalogue answer to be shown again.
  const artReady = !switching && (decided || mine?.hero === true || recalledHeroDecision(id) != null);
  // The title is decided once per entry, from what is known when it is first drawn: a catalogue answer that comes later only warms
  // the next visit (the readable title is final), it never swaps the title for a logo mid-read.
  const [titleChoice, setTitleChoice] = useState<{ id: number; artwork?: TmdbArtwork; inherited: ReturnType<typeof inheritedLogo>; rootTitle: string | null } | null>(null);
  if (titleReady && titleChoice?.id !== id) setTitleChoice({ id, artwork, inherited, rootTitle });
  const titleArtwork = titleChoice?.id === id ? titleChoice.artwork : undefined;

  const cover = anime.coverImage.extraLarge ?? anime.coverImage.large ?? anime.coverImage.medium;
  const sources = artReady ? heroSources({ cover, banner: anime.bannerImage, artwork, desktop }) : [];
  return <>
    <div className="anime-hero-art pointer-events-none absolute inset-x-0 top-0 overflow-hidden" data-artwork-pending={!artReady} aria-hidden="true" data-testid="anime-hero-art">
      <HeroPlates id={id} sources={sources} desktop={desktop} />
      <div className="hero-top-scrim absolute inset-x-0 top-0" />
    </div>
    <div className="anime-hero relative" data-testid="anime-hero" data-artwork-pending={!artReady} data-has-seasons={franchise.main.length > 1}>
      <span className="sr-only" data-testid="hero-glow" />
      {controls}
      <header className="anime-heading px-safe absolute inset-x-0 z-10 flex flex-col items-center justify-end text-center" data-testid="anime-heading">
        <AnimeTitle key={preference} animeId={id} title={title} preference={preference} artwork={titleArtwork} inherited={titleChoice?.id === id ? titleChoice.inherited : null} rootTitle={titleChoice?.id === id ? titleChoice.rootTitle : null} pending={!titleReady || titleChoice?.id !== id} />
        {fromCache && <p className="mono-meta mt-1.5 text-cream">{ui("copie hors ligne")}</p>}
      </header>
    </div>
  </>;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** `data-artwork-source`: where the shown picture came from (kept as the page's QA hooks have always named it). */
const sourceName = (kind: HeroArtKind) => (kind === "banner" ? "anilist" : kind === "cover" ? "cover" : "tmdb");

type Size = { width: number; height: number };
/** The desktop frame is wide and bounded: it shows the verified backdrop, then the banner; a cover is only ever an object (not a frame). */
const desktopRank = (sources: readonly HeroSource[], measured: ReadonlyMap<string, Size>): { source: HeroSource; fit: HeroFit }[] => {
  const framed = sources.filter(s => s.kind !== "cover");
  const pool = framed.length ? framed : sources;
  return pool.map(source => {
    const m = measured.get(source.src);
    const width = m?.width ?? source.width ?? (source.kind === "banner" ? MEDIA.bannerAssumedRatio * 100 : 100);
    const height = m?.height ?? source.height ?? 100;
    return { source: { ...source, width, height }, fit: { class: source.kind === "cover" ? "card" : "wide", ratio: width / height, visible: 1, upscale: 1 } as HeroFit };
  });
};

const sourcesKey = (sources: readonly HeroSource[]) => sources.map(s => s.src).join("|");

/** Keep a same-entry decision during metadata refresh, never an older entry's pixels. */
function HeroPlates({ id, sources, desktop }: { id: number; sources: readonly HeroSource[]; desktop: boolean }) {
  const [shown, setShown] = useState({ id, sources });
  if (sources.length > 0 && (shown.id !== id || sourcesKey(shown.sources) !== sourcesKey(sources))) setShown({ id, sources });
  const current = sources.length > 0 ? sources : shown.id === id ? shown.sources : [];
  return current.length > 0 ? <HeroPlate key={id} entryId={id} sources={current} desktop={desktop} /> : null;
}

/**
 * THE picture of one entry (mounted per entry, so nothing of another season can linger in it).
 *
 * 1. It probes the best-fitting candidate once (`probe.ts`: real size and a small pixel grid, in CORS mode). Only then is the `<img>`
 *    rendered — it loads the same URL in the same mode, from the HTTP cache.
 * 2. A picture that turns out unfit (a small cover) is dropped for the next candidate BEFORE anything is revealed.
 * 3. The frame crops around the subject (`focal.ts`) rather than around a fixed point.
 * 4. Once revealed it is locked for the visit, and remembered for the entry: coming back shows it at once, with no probe and no fade.
 */
function HeroPlate({ entryId, sources, desktop, over = false, retiring = false, retireDelayMs = 0, onReveal }: { entryId: number; sources: readonly HeroSource[]; desktop: boolean; /** Fades in over another plate (never cuts in). */ over?: boolean; /** Fades out, after `retireDelayMs`: the new plate is opaque by then. */ retiring?: boolean; retireDelayMs?: number; onReveal?: (entryId: number) => void }) {
  const recalled = recalledHeroDecision(entryId);
  // What is already known (the entry's remembered picture, a neighbouring season the page prefetched) needs no probe: it is shown at once.
  const [probes, setProbes] = useState<ReadonlyMap<string, ArtworkProbe>>(() => {
    const seed = new Map<string, ArtworkProbe>();
    for (const source of sources) { const probe = knownArtworkProbe(source.src); if (probe) seed.set(source.src, probe); }
    if (recalled && !seed.has(recalled.src)) seed.set(recalled.src, { width: recalled.width, height: recalled.height, grid: null, cors: recalled.cors ?? false });
    return seed;
  });
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(() => new Set());
  const [locked, setLocked] = useState<string | null>(() => (recalled && sources.some(s => s.src === recalled.src) ? recalled.src : null));
  // A size the catalogue declares (TMDB) is the picture's own; only what declares none (AniList) is measured.
  const sizes = useMemo(() => new Map([...probes].filter(([key]) => !sources.some(s => s.src === key && s.width && s.height)).map(([key, probe]) => [key, { width: probe.width, height: probe.height }])), [probes, sources]);
  const usable = sources.filter(s => !failed.has(s.src));
  const ranked = desktop ? desktopRank(usable, sizes) : rankHeroSources(usable, sizes);
  const current = (locked ? ranked.find(r => r.source.src === locked) : undefined) ?? ranked[0];
  const src = current?.source.src ?? null;
  const probe = src ? probes.get(src) : undefined;
  const window = current && probe ? focusWindowFor(current.fit) : null;
  const focus = !current || !probe ? null : recalled && recalled.src === current.source.src && recalled.focus ? recalled.focus : probe.grid && window ? focusOf(probe.grid, window) : null;
  // Revealed: probed (real size known), decoded, and either already locked or still the best fit now that its real size is known.
  const revealed = !!current && !!probe && !!src && loaded.has(src) && (locked === src || ranked[0]?.source.src === src);
  useEffect(() => {
    if (!src || probe) return;
    let live = true;
    probeArtwork(src).then(next => { if (live) setProbes(old => new Map(old).set(src, next)); }, () => { if (live) setFailed(old => new Set([...old, src])); });
    return () => { live = false; };
  }, [src, probe]);
  // The first picture revealed is locked for the visit (derived state: set while rendering, never in an effect)…
  if (revealed && src && locked !== src) setLocked(src);
  // …and remembered for the entry, so coming back shows it at once.
  const lockedSrc = locked;
  useEffect(() => {
    if (!lockedSrc || !probe || lockedSrc !== src) return;
    rememberArtwork(lockedSrc);
    rememberHeroDecision(entryId, { src: lockedSrc, width: probe.width, height: probe.height, focus: focus ?? undefined, cors: probe.cors });
  }, [lockedSrc, src, probe, focus, entryId]);
  // A picture that has not been revealed within the budget is given up for the next candidate (never left pending forever).
  useEffect(() => {
    if (!src || revealed) return;
    const timer = setTimeout(() => setFailed(old => new Set([...old, src])), RC10.heroImageBudgetMs);
    return () => clearTimeout(timer);
  }, [src, revealed]);
  const markLoaded = (el: HTMLImageElement | null) => {
    if (!el || !src || !isPainted(el)) return;
    setLoaded(old => (old.has(src) ? old : new Set(old).add(src)));
  };
  useEffect(() => { if (revealed) onReveal?.(entryId); }, [revealed, entryId, onReveal]);
  if (!current || !src) return null;
  const { source, fit } = current;
  const style = plateStyle(fit, focus);
  const immediate = hasSeenArtwork(src);
  const image = () => probe && (
    <Image key={src} fill src={src} alt="" loading="eager" fetchPriority="high" quality={85} sizes={plateSizes(fit, desktop)} draggable={false} ref={markLoaded}
      crossOrigin={probe.cors ? "anonymous" : undefined}
      className="pointer-events-none select-none object-cover" style={{ objectPosition: style.position }}
      onLoad={e => markLoaded(e.currentTarget)} onError={() => setFailed(old => new Set([...old, src]))} />
  );
  const fadeMs = retiring ? HERO.ghostFadeMs : over ? HERO.crossfadeMs : immediate ? 0 : HERO.revealMs;
  const motion = { opacity: revealed && !retiring ? 1 : 0, transitionDuration: `${fadeMs}ms`, transitionDelay: retiring ? `${retireDelayMs}ms` : "0ms" } as CSSProperties;
  // Fade the image AND its black ground as one composited layer. Fading only
  // the masked image leaves the old season visible through the transparent tail,
  // even after the incoming image is fully opaque. The mask and crop stay intact.
  const layer = (art: ReactNode) => <div data-hero-layer={entryId} className={`absolute inset-0 transition-opacity motion-reduce:transition-none ${over ? "bg-ink" : ""}`} style={motion}>{art}</div>;
  if (fit.class === "card") {
    // A small cover: an object on the page's ground, never enlarged into a backdrop.
    const width = probe ? Math.round(probe.width / 3 * 2) : 0;
    return layer(<div className="hero-card absolute" data-hero-class="card" data-artwork-source={sourceName(source.kind)} data-decoded={revealed} data-retiring={retiring || undefined} style={{ width: width ? `min(${width}px, 50%)` : "40%", aspectRatio: probe ? `${probe.width} / ${probe.height}` : "0.7" }}>
      <div className="absolute inset-0 overflow-hidden rounded-[10px]">{image()}</div>
    </div>);
  }
  const frame = { "--plate-mask": dissolveMask(style.fadeStart), "--hero-ratio": clamp(fit.ratio, MEDIA.heroMinRatio, MEDIA.heroMaxRatio) } as CSSProperties;
  return layer(<div className="hero-plate absolute" data-hero-class={fit.class} data-artwork-source={sourceName(source.kind)} data-decoded={revealed} data-retiring={retiring || undefined} data-focus={focus ? `${Math.round(focus.x * 100)},${Math.round(focus.y * 100)}` : undefined} style={frame}>
    {image()}
  </div>);
}
