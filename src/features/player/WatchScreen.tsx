"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAnime } from "@/features/anime/useAnime";
import { useTitles } from "@/features/settings/PreferencesContext";
import { upsertAnimeSummary } from "@/lib/db/library";
import { BackButton } from "@/components/layout/BackButton";
import { VideoPlayer } from "./VideoPlayer";
import { YoutubeDemo } from "./YoutubeDemo";
import { chooseDemo, type DemoSession, storeDemo, setDemoMode } from "@/lib/portfolio/demo";
import { routes } from "@/lib/utils/routes";
export function WatchScreen({ animeId, episodeNumber }: { animeId: number; episodeNumber: number; labSource?: string | null }) {
  const anime = useAnime(animeId);
  const { main } = useTitles();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [html5, setHtml5] = useState(false);
  const [youtubeError, setYoutubeError] = useState<number | null>(null);
  useEffect(() => { let live = true; const selected = chooseDemo(`${animeId}:${episodeNumber}`); queueMicrotask(() => { if (live) { setSession(selected); setHtml5(selected.mode === "html5"); } }); return () => { live = false; }; }, [animeId, episodeNumber]);
  useEffect(() => { if (anime.data) void upsertAnimeSummary(anime.data.anime); }, [anime.data]);
  const active = session?.key === `${animeId}:${episodeNumber}` ? session : null;
  useEffect(() => { if (active) setDemoMode(active.key, html5 ? "html5" : "youtube"); }, [active, html5]);
  const title = anime.data ? main(anime.data.anime.titles) : "MaximAnim";
  return <div className="watch-page px-safe pb-8" data-display="browser"><header className="flex min-h-16 items-center gap-3 safe-top"><BackButton fallback={`/anime/${animeId}`} /><Link href={`/anime/${animeId}`} className="min-w-0 truncate font-semibold">{title}</Link></header><div className="mx-auto max-w-5xl"><p className="mb-3 text-sm text-soft">Épisode {episodeNumber} · Démonstration vidéo, pas un épisode d’anime</p><div role="group" aria-label="Média de démonstration" className="mb-4 flex gap-4"><button className="min-h-11 text-sm text-accent" aria-pressed={!html5} onClick={() => setHtml5(false)}>Vlogs · YouTube</button><button className="min-h-11 text-sm text-accent" aria-pressed={html5} onClick={() => setHtml5(true)}>Le dernier bug · HTML5</button></div>
  {html5 ? <div className="watch-stage relative aspect-video w-full"><VideoPlayer key={`html5:${animeId}:${episodeNumber}`} title="Le dernier bug" episodeLabel="Une histoire de 59 pixels" startAt={readHtml5Position(animeId, episodeNumber)} playbackRate={1} persistence={{ animeId, episodeNumber, providerId: "portfolio-html5", providerEpisodeId: "last-bug", completionThreshold: 0.9 }} sources={[{ type: "mp4", url: "/demo-media/last-bug.mp4" }, { type: "webm", url: "/demo-media/last-bug.webm" }]} subtitles={[]} next={null} onPosition={seconds => { try { localStorage.setItem(`portfolio-html5:${animeId}:${episodeNumber}`, String(seconds)); } catch {} }} /></div> : active ? <YoutubeDemo key={active.id} session={active} animeId={animeId} episodeNumber={episodeNumber} onProgress={next => { storeDemo(next); }} onUnavailable={code => { setYoutubeError(code); setHtml5(true); }} /> : <div className="aspect-video bg-surface" aria-label="Préparation du média" />}
  {html5 && youtubeError !== null && <p role="status" data-demo-fallback={youtubeError} className="mt-3 text-sm text-soft">YouTube a refusé cette intégration. La démo originale reste disponible ; les vlogs sont accessibles sur ma chaîne.</p>}
  <h1 className="mt-5 text-xl font-semibold">{html5 ? "Le dernier bug — une histoire de 59 pixels" : active?.title}</h1><p className="mt-2 text-sm text-soft">{html5 ? "Court métrage original · lecteur HTML5 MaximAnim, avec ses vrais contrôles." : "Un vlog de Boogiepop · contrôles et plein écran fournis par YouTube."}</p><a href="https://www.youtube.com/@booogiepopp" className="mt-3 inline-flex min-h-11 items-center text-accent" target="_blank" rel="noreferrer">Découvrir ma chaîne YouTube ↗</a>
  <nav className="mt-4 flex justify-between" aria-label="Épisodes">{episodeNumber > 1 && <Link href={routes.watch(animeId, episodeNumber - 1)} className="min-h-11">← Épisode précédent</Link>}<Link href={`/anime/${animeId}`} className="min-h-11">Fiche et épisodes</Link>{anime.data && episodeNumber < (anime.data.anime.episodeCount ?? 1) && <Link href={routes.watch(animeId, episodeNumber + 1)} className="min-h-11">Épisode suivant →</Link>}</nav></div></div>;
}
function readHtml5Position(animeId: number, episode: number) { try { return typeof window === "undefined" ? 0 : Math.max(0, Number(localStorage.getItem(`portfolio-html5:${animeId}:${episode}`)) || 0); } catch { return 0; } }
