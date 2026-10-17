import { episodeSlug } from "@/lib/providers/episodes";

export const routes = {
  home: () => "/",
  search: () => "/search",
  lists: () => "/lists",
  list: (id: string) => `/lists/${encodeURIComponent(id)}`,
  /** An automatic view of the library (À continuer / Terminés / Abandonnés). */
  smartView: (view: "continue" | "completed" | "abandoned") => `/lists/auto/${view}`,
  history: () => "/history",
  schedule: () => "/schedule",
  settings: () => "/settings",
  sources: () => "/settings/sources",
  diagnostics: () => "/settings/diagnostics",
  anime: (id: number) => `/anime/${id}`,
  /** The anime page with "Tester les sources" open. */
  animeLab: (id: number) => `/anime/${id}?lab=1`,
  episodes: (id: number) => `/anime/${id}/episodes`,
  /** Every credit of an anime (« Tout le staff »). */
  staff: (id: number) => `/anime/${id}/staff`,
  /** A series seen as one entity (seasons, films, side stories); the id is any entry of it. */
  franchise: (id: number) => `/franchise/${id}`,
  studio: (id: number) => `/studio/${id}`,
  /** `fromAnime`: the anime page they were opened from, so the person page can say what they did ON IT first. */
  person: (id: number, fromAnime?: number) => (fromAnime != null && Number.isInteger(fromAnime) && fromAnime > 0 ? `/person/${id}?fromAnime=${fromAnime}` : `/person/${id}`),
  /** The manga / novel an anime is adapted from. */
  /** `origin`: how the anime says it adapts it (« Light novel »): the page says the same word instead of AniList's plainer « Roman ». */
  work: (id: number, origin?: string | null) => (origin && /^[A-Z_]{3,20}$/.test(origin) ? `/work/${id}?origin=${origin}` : `/work/${id}`),
  watch: (animeId: number, episodeNumber: number) => `/watch/${animeId}/${episodeSlug(episodeNumber)}`,
  /** Source Lab deep test: the normal player, with one given source. */
  labWatch: (animeId: number, episodeNumber: number, providerId: string) => `/watch/${animeId}/${episodeSlug(episodeNumber)}?source=${encodeURIComponent(providerId)}`,
};
