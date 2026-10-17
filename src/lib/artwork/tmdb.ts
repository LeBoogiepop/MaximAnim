import { z } from "zod";
import type { TitlePreference } from "@/types/anime";

export const tmdbImageSchema = z.object({ src: z.string().url(), width: z.number().positive(), height: z.number().positive() });
const tmdbStatus = z.enum(["ready", "unmapped", "unavailable", "notConfigured", "rejected"]);
const tmdbEpisodeSchema = z.object({ number: z.number().int().positive(), thumbnail: z.string().url(), href: z.string().url(), site: z.literal("TMDB"), provenance: z.literal("tmdb"), title: z.null(), attribution: z.string() });
export const tmdbArtworkSchema = z.object({
  animeId: z.number().int().positive(),
  status: tmdbStatus,
  sourcePage: z.string().url().nullable(),
  latinLogo: tmdbImageSchema.nullable(), nativeLogo: tmdbImageSchema.nullable(), backdrop: tmdbImageSchema.nullable(),
  /**
   * A vertical picture for phones, only when a reviewed descriptor pinned one (rights and identity checked): never the best-voted
   * poster, which usually carries a title of its own. Absent for every other entry.
   */
  portrait: tmdbImageSchema.nullable().default(null),
  /**
   * What the logos stand for. `series`: the show's own logo, valid for every season of it (it may be shown on a later season that
   * has none of its own). `entry`: specific to this entry or part (a pinned part logo, a film's logo): never carried to another.
   * Answers stored before this field existed read as `entry`.
   */
  logoScope: z.enum(["entry", "series"]).default("entry"),
  /** Always empty in the branding answer (`/api/artwork/<id>`): stills come from `/api/artwork/<id>/episodes`. */
  episodes: z.array(tmdbEpisodeSchema),
});
export const tmdbEpisodesSchema = z.object({ animeId: z.number().int().positive(), status: tmdbStatus, episodes: z.array(tmdbEpisodeSchema) });
export type TmdbEpisodes = z.infer<typeof tmdbEpisodesSchema>;
export type TmdbArtwork = z.infer<typeof tmdbArtworkSchema>;
export function emptyTmdbArtwork(animeId: number, status: TmdbArtwork["status"]): TmdbArtwork {
  return { animeId, status, sourcePage: null, latinLogo: null, nativeLogo: null, backdrop: null, portrait: null, logoScope: "entry", episodes: [] };
}
/** CDN URLs are produced only from catalogue file paths, never supplied by a caller. */
export function tmdbImageUrl(path: string | null | undefined, size: "w500" | "w1280" | "w1920" | "original"): string | null {
  return path && /^\/[a-zA-Z0-9]{1,80}\.(?:png|jpg|webp)$/.test(path) ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
/** Measured CDN variants: w1280 also serves raster logos. Avoid its upscaling
 * of small originals and never fetch a giant original just for a phone hero. */
export function tmdbHeroSize(width: number, height: number, role: "logo" | "backdrop" | "portrait"): "original" | "w1280" | "w1920" {
  const maxWidth = role === "backdrop" ? 1920 : 1280;
  return width <= maxWidth && (role === "portrait" || height <= 1280) ? "original" : role === "backdrop" ? "w1920" : "w1280";
}
export function tmdbLogo(artwork: TmdbArtwork | undefined, preference: TitlePreference) {
  return preference === "native" ? artwork?.nativeLogo ?? null : artwork?.latinLogo ?? null;
}
