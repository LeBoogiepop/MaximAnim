"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ListVideo } from "lucide-react";
import { BackButton } from "@/components/layout/BackButton";
import { useAnime } from "@/features/anime/useAnime";
import { useWatchCredits } from "@/features/anime/useWatchCredits";
import { headlineStudios } from "@/features/anime/AnimeFacts";
import { useEpisodeArtwork } from "@/features/episodes/useEpisodeArtwork";
import { useTitles, usePreferences } from "@/features/settings/PreferencesContext";
import { upsertAnimeSummary } from "@/lib/db/library";
import { availableEpisodeCount, isSingleItem } from "@/lib/anilist/normalize";
import { realEpisodeTitle } from "@/lib/providers/episodes";
import { openDemo, nextDemo, storeDemo, type DemoSession } from "@/lib/portfolio/demo";
import { routes } from "@/lib/utils/routes";
import { WatchCredits, type CreditGroup } from "./WatchCredits";
import { YoutubeDemo } from "./YoutubeDemo";

export function WatchScreen(props: { animeId: number; episodeNumber: number; labSource?: string | null }) {
  // Each episode owns its selection lifecycle; no stale identity during navigation.
  return <WatchEpisode key={`${props.animeId}:${props.episodeNumber}`} {...props} />;
}
function WatchEpisode({ animeId, episodeNumber }: { animeId: number; episodeNumber: number }) {
  const anime = useAnime(animeId);
  const previews = useEpisodeArtwork(animeId);
  const { credits } = useWatchCredits(animeId, episodeNumber);
  const { main } = useTitles();
  const { titleLanguage } = usePreferences();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const rejected = useRef(new Set<string>());
  const active = useRef<DemoSession | null>(null);
  const query = useSearchParams().toString();
  useEffect(() => {
    let live = true;
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("session");
    const intent = url.searchParams.get("intent");
    // Persist this navigation entry in its URL. Reload/Back reuse it; a new episode click replaces it.
    const selected = !intent && sessionId && active.current?.sessionId === sessionId ? active.current : openDemo(`${animeId}:${episodeNumber}`, intent === "resume" ? { kind: "resume" } : !intent && sessionId ? { kind: "session", sessionId } : { kind: "new" });
    if (active.current?.sessionId !== selected.sessionId) { rejected.current.clear(); setUnavailable(false); }
    active.current = selected;
    url.searchParams.delete("intent");
    url.searchParams.set("session", selected.sessionId);
    if (url.search !== window.location.search) window.history.replaceState(window.history.state, "", url);
    queueMicrotask(() => { if (live) setSession(selected); });
    return () => { live = false; };
  }, [animeId, episodeNumber, query]);
  useEffect(() => { if (anime.data) void upsertAnimeSummary(anime.data.anime); }, [anime.data]);
  const entry = anime.data?.anime;
  const single = entry ? isSingleItem(entry) : false;
  const available = entry ? availableEpisodeCount(entry) : null;
  const title = realEpisodeTitle({ number: episodeNumber, title: previews.find(p => p.number === episodeNumber)?.title ?? null }, titleLanguage);
  const groups = (items: NonNullable<typeof credits>["episodeGroups"]): CreditGroup[] => items.map(group => ({ key: group.category, role: group.label, people: group.entities.map(person => ({ id: person.id, name: person.name, nativeName: person.nativeName, image: person.image })) }));
  const retry = () => { if (!session) return; rejected.current.clear(); setUnavailable(false); const next = openDemo(session.key, { kind: "session", sessionId: session.sessionId }); active.current = next; setSession(next); };
  const fail = (code: number) => {
    if (!session) return;
    rejected.current.add(session.id);
    // Media restrictions can improve with another approved video; API/network failures cannot.
    const next = [100, 101, 150].includes(code) ? nextDemo(session, [...rejected.current]) : null;
    if (next) { active.current = next; setSession(next); } else setUnavailable(true);
  };
  return <div className="watch-page contextual-content flex min-h-dvh flex-col bg-ink" data-display="browser">
    <header className="px-safe flex min-h-14 shrink-0 items-center gap-3"><BackButton fallback={routes.anime(animeId)} /><Link href={routes.anime(animeId)} className="min-w-0 truncate text-sm font-semibold text-soft">{entry ? main(entry.titles) : "MaximAnim"}</Link></header>
    <div className="watch-shell watch-layout flex flex-col" data-testid="watch-layout"><div className="watch-col relative flex min-w-0 flex-1 flex-col gap-2 pb-8">
      <div className="watch-stage relative aspect-video min-h-[200px] w-full shrink-0 bg-black lg:overflow-hidden lg:rounded-2xl lg:border lg:border-line" data-testid="watch-stage">
        {unavailable ? <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 px-5 text-center" role="status"><p className="text-sm text-soft">La vidéo est momentanément indisponible.</p><button type="button" onClick={retry} className="min-h-11 text-sm text-accent">Réessayer</button></div> : session ? <YoutubeDemo key={`${session.sessionId}:${session.revision}`} session={session} animeId={animeId} episodeNumber={episodeNumber} onProgress={storeDemo} onUnavailable={fail} /> : <div className="aspect-video min-h-[200px]" aria-label="Préparation de la vidéo" />}
      </div>
      <p className="px-safe text-xs leading-relaxed text-muted lg:px-0">Pour respecter les droits de diffusion, cette démonstration utilise une de mes vidéos personnelles à la place de l’épisode.</p>
      {!single && <nav className="watch-next px-safe grid grid-cols-3 gap-2 lg:px-0" aria-label="Navigation des épisodes">
        {episodeNumber > 1 ? <Link href={routes.watch(animeId, episodeNumber - 1)} aria-label="Épisode précédent" className="flex min-h-12 items-center justify-center gap-1 rounded-xl border border-line text-sm"><ChevronLeft size={18} aria-hidden="true" />Préc.</Link> : <span aria-disabled="true" className="flex min-h-12 items-center justify-center rounded-xl border border-line text-sm text-muted">Préc.</span>}
        <Link href={routes.episodes(animeId)} className="flex min-h-12 items-center justify-center gap-1 rounded-xl border border-line text-sm"><ListVideo size={18} aria-hidden="true" />Épisodes</Link>
        {available != null && episodeNumber < available ? <Link href={routes.watch(animeId, episodeNumber + 1)} aria-label="Épisode suivant" className="flex min-h-12 items-center justify-center gap-1 rounded-xl border border-line text-sm">Suiv.<ChevronRight size={18} aria-hidden="true" /></Link> : <span aria-disabled="true" className="flex min-h-12 items-center justify-center rounded-xl border border-line text-sm text-muted">Suiv.</span>}
      </nav>}
      <div className="watch-details px-safe flex flex-col items-start gap-1 lg:px-0" data-testid="watch-identity">
        {entry && <Link href={routes.anime(animeId)} className="inline-flex min-h-11 max-w-full items-center gap-1 text-sm font-semibold text-soft" data-testid="watch-anime-link"><span className="line-clamp-2">{main(entry.titles)}</span><ChevronRight size={14} className="shrink-0 text-accent" aria-hidden="true" /></Link>}
        <h1 className="m-0 text-[17px] font-semibold leading-snug wrap-anywhere">{single ? "Film" : `Épisode ${episodeNumber}`}{title && <> · <span className="font-medium text-soft" data-testid="watch-episode-title">{title}</span></>}</h1>
      </div>
      {entry && <WatchCredits animeId={animeId} episodeNumber={episodeNumber} episode={credits ? groups(credits.episodeGroups) : []} series={credits ? groups(credits.seriesGroups.filter(group => group.category !== "studio" && group.category !== "original")) : []} studios={headlineStudios(entry.studios)} film={single} />}
    </div></div>
  </div>;
}
