
import { ui, plural } from "@/lib/i18n/translate";
import { localeDateFormat, shortMonth, interfaceLanguage } from "@/lib/i18n/language";
import type { AnimeFormat, AnimeSeason, AnimeStatus, AnimeSummary, MediaSource, PartialDate, StaffRoleGroup } from "@/types/anime";

export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** "12 min restantes" style, for cards. */
export function formatRemaining(currentTime: number, duration: number): string | null {
  if (!(duration > 0)) return null;
  const minutes = Math.max(1, Math.round((duration - currentTime) / 60));
  return ui("{0} min restante{1}", minutes, plural(interfaceLanguage(), minutes, "", "s"));
}

const FORMAT_LABELS: Record<AnimeFormat, string> = {
  get TV() { return ui("Série"); },
  get TV_SHORT() { return ui("Série courte"); },
  MOVIE: "Film",
  get SPECIAL() { return ui("Spécial"); },
  OVA: "OVA",
  ONA: "ONA",
  get MUSIC() { return ui("Clip"); },
};

const STATUS_LABELS: Record<AnimeStatus, string> = {
  get FINISHED() { return ui("Terminé"); },
  get RELEASING() { return ui("En diffusion"); },
  get NOT_YET_RELEASED() { return ui("À venir"); },
  get CANCELLED() { return ui("Annulé"); },
  get HIATUS() { return ui("En pause"); },
};

const SEASON_LABELS: Record<AnimeSeason, string> = {
  get WINTER() { return ui("Hiver"); },
  get SPRING() { return ui("Printemps"); },
  get SUMMER() { return ui("Été"); },
  get FALL() { return ui("Automne"); },
};

export const formatLabel = (f: AnimeFormat | null) => (f ? FORMAT_LABELS[f] : null);
export const statusLabel = (s: AnimeStatus | null) => (s ? STATUS_LABELS[s] : null);
export const seasonLabel = (s: AnimeSeason | null) => (s ? SEASON_LABELS[s] : null);

export const STAFF_GROUP_LABELS: Record<StaffRoleGroup, string> = {
  get director() { return ui("Réalisation"); },
  // The author of the work the anime adapts (a person), not to be mistaken with an anime that is itself original.
  get original() { return ui("Auteur de l'œuvre originale"); },
  get composition() { return ui("Scénario"); },
  characterDesign: "Character design",
  get animationDirection() { return ui("Direction de l'animation"); },
  storyboard: "Storyboard",
  get artDirection() { return ui("Direction artistique"); },
  get soundDirection() { return ui("Direction du son"); },
  get music() { return ui("Musique"); },
};

/** What the adaptation comes from, in French. `OTHER` says nothing useful: not shown. */
export const SOURCE_LABELS: Record<MediaSource, string | null> = {
  // The anime is not an adaptation (never to be mixed up with the staff role « Œuvre originale »: a person).
  get ORIGINAL() { return ui("Œuvre originale"); },
  MANGA: "Manga",
  LIGHT_NOVEL: "Light novel",
  VISUAL_NOVEL: "Visual novel",
  get VIDEO_GAME() { return ui("Jeu vidéo"); },
  get NOVEL() { return ui("Roman"); },
  WEB_NOVEL: "Web novel",
  DOUJINSHI: "Doujinshi",
  ANIME: "Anime",
  get LIVE_ACTION() { return ui("Film ou série live"); },
  get GAME() { return ui("Jeu"); },
  COMIC: "Comics",
  get MULTIMEDIA_PROJECT() { return ui("Projet multimédia"); },
  get PICTURE_BOOK() { return ui("Livre illustré"); },
  OTHER: null,
};

/** A country as « Japon » with its flag, from AniList's ISO code; null when the code is not a real region. */
export function countryOf(code: string | null | undefined): { name: string; flag: string } | null {
  // ZZ is CLDR's « unknown region »: it has a name (« région indéterminée »), not a country.
  if (!code || !/^[A-Z]{2}$/.test(code) || code === "ZZ") return null;
  let name: string | undefined;
  try {
    name = new Intl.DisplayNames([interfaceLanguage()], { type: "region", fallback: "none" }).of(code);
  } catch {
    return null;
  }
  // An unknown code echoes itself back: that is not a country name.
  if (!name || name === code) return null;
  const flag = String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
  return { name, flag };
}


/** « 22 oct. 2023 », « oct. 2023 » or « 2023 » — as precise as AniList is. */
export function formatPartialDate(date: PartialDate | null | undefined): string | null {
  if (!date?.year) return null;
  const month = date.month && date.month >= 1 && date.month <= 12 ? shortMonth(date.month) : null;
  if (!month) return String(date.year);
  return date.day ? `${date.day} ${month} ${date.year}` : `${month} ${date.year}`;
}

/** The run of an anime: « 22 oct. 2023 – 24 mars 2024 », « depuis le 5 oct. 2025 », « 2027 ». Null when no date is known. */
export function runLabel(start: PartialDate | null | undefined, end: PartialDate | null | undefined, status: AnimeStatus | null): string | null {
  const from = formatPartialDate(start);
  const to = formatPartialDate(end);
  if (!from) return null;
  if (status === "RELEASING" || status === "HIATUS") return start?.day ? ui("depuis le {0}", from) : ui("depuis {0}", from);
  if (status === "NOT_YET_RELEASED") return start?.day ? ui("prévu le {0}", from) : ui("prévu en {0}", from);
  if (!to || to === from) return from;
  return `${from} – ${to}`;
}

const DAY_MS = 86_400_000;

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayLabel(timestamp: number, now = Date.now()): string {
  const diff = Math.round((startOfDay(now) - startOfDay(timestamp)) / DAY_MS);
  if (diff === 0) return ui("Aujourd'hui");
  if (diff === 1) return ui("Hier");
  const sameYear = new Date(timestamp).getFullYear() === new Date(now).getFullYear();
  return localeDateFormat({ weekday: diff < 7 ? "long" : undefined, day: "numeric", month: "long", year: sameYear ? undefined : "numeric" }).format(timestamp);
}

export function clockLabel(timestamp: number): string {
  return localeDateFormat({ hour: "2-digit", minute: "2-digit" }).format(timestamp);
}

/** A known future (or past) airing time, as a date and a local clock: « lundi 6 octobre · 17:30 ». */
export function airingDateLabel(timestamp: number, now = Date.now()): string {
  const sameYear = new Date(timestamp).getFullYear() === new Date(now).getFullYear();
  const day = localeDateFormat({ weekday: "long", day: "numeric", month: "long", year: sameYear ? undefined : "numeric" }).format(timestamp);
  return `${day} ${clockLabel(timestamp)}`;
}

/** « 24 min / ép. » for a series, « 1 h 52 » for a film; null when AniList does not know. */
export function durationLabel(minutes: number | null | undefined, perEpisode: boolean): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes >= 60 && !perEpisode) return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
  return perEpisode ? ui("{0} min / ép.", minutes) : `${minutes} min`;
}

export function joinMeta(parts: (string | number | null | undefined | false)[]): string {
  return parts.filter((p) => p !== null && p !== undefined && p !== false && p !== "").join(" · ");
}

/** What a list holds: « Vide », « 1 titre », « 12 titres » (a list of titles, not a count of « anime »). */
export function titlesLabel(n: number): string {
  if (n <= 0) return ui("Vide");
  return ui("{0} titre{1}", n, plural(interfaceLanguage(), n, "", "s"));
}

export function episodesLabel(n: number | null): string | null {
  if (n == null) return null;
  return ui("{0} ép.", n);
}

/** Counts are metadata, never a promise that a playback source has those episodes. */
export function formatWithEpisodes(anime: Pick<AnimeSummary, "format" | "episodeCount">): string {
  const count = anime.format !== "MOVIE" && anime.episodeCount != null && anime.episodeCount > 0 ? ui("{0} épisode{1}", anime.episodeCount, anime.episodeCount > 1 ? "s" : "") : null;
  const redundant = count && (anime.format === "TV" || anime.format === "TV_SHORT");
  return joinMeta([redundant ? null : formatLabel(anime.format), count]);
}

export function animeMetadata(anime: Pick<AnimeSummary, "format" | "episodeCount" | "seasonYear" | "status" | "source">, withSource = false): string {
  const source = withSource ? (anime.source === "ORIGINAL" ? "Original" : anime.source ? SOURCE_LABELS[anime.source] : null) : null;
  const format = source && anime.episodeCount == null && anime.format === "TV" ? null : formatWithEpisodes(anime);
  return joinMeta([anime.seasonYear, source, anime.status === "RELEASING" || anime.status === "NOT_YET_RELEASED" || anime.status === "HIATUS" ? statusLabel(anime.status) : null, format]);
}
