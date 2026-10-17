import { z } from "zod";
import { RC10 } from "@/config/app";
import { request } from "./client";
import { mergeEpisodePreviews, officialEpisodePreviews } from "@/lib/artwork/episode-artwork";

export interface EpisodePreview { number: number; title: string | null; thumbnail: string | null; href: string; site: string; provenance?: "provider" | "official" | "tmdb" | "capture"; attribution?: string; alternatives?: EpisodePreview[]; displayCrop?: { inset: number; width: number; height: number } }
const responseSchema = z.object({ Media: z.object({ id: z.number().optional(), format: z.string().nullish(), episodes: z.number().nullish(), streamingEpisodes: z.array(z.object({ title: z.string().nullish(), thumbnail: z.string().nullish(), url: z.string().nullish(), site: z.string().nullish() }).nullable()).nullish() }).nullish() });

/** Exact legal-stream metadata from AniList. A number must be explicit; array positions never become episode ids. */
export function normalizeEpisodePreviews(rows: NonNullable<z.infer<typeof responseSchema>["Media"]>["streamingEpisodes"]): EpisodePreview[] {
  const byNumber = new Map<number, EpisodePreview>();
  for (const row of (rows ?? []).slice(0, RC10.episodeMetadataLimit)) {
    if (!row || row.site !== "Crunchyroll") continue;
    const match = row.title?.match(/^Episode\s+(\d+(?:\.\d+)?)\s*[-–:]\s*(.*)$/i);
    if (!match || !row.url) continue;
    try {
      const link = new URL(row.url);
      if (!["http:", "https:"].includes(link.protocol) || !["www.crunchyroll.com", "crunchyroll.com"].includes(link.hostname) || !link.pathname.startsWith("/watch/") || link.username || link.password || link.port) continue;
      link.protocol = "https:";
      const number = Number(match[1]);
      if (!Number.isFinite(number) || number <= 0 || byNumber.has(number)) continue;
      byNumber.set(number, { number, title: match[2]?.trim() || null, thumbnail: episodeThumbnail(row.thumbnail), href: link.href, site: "Crunchyroll" });
    } catch { /* Invalid metadata is omitted, not turned into a playable episode. */ }
  }
  const previews = [...byNumber.values()].sort((a, b) => a.number - b.number);
  const occurrences = new Map<string, number>();
  for (const preview of previews) if (preview.thumbnail) occurrences.set(preview.thumbnail, (occurrences.get(preview.thumbnail) ?? 0) + 1);
  return previews.map(preview => preview.thumbnail && (occurrences.get(preview.thumbnail) ?? 0) > 1 ? { ...preview, thumbnail: null } : preview);
}

/** Metadata-image URLs only. This is not an extension broker, playback URL or arbitrary image proxy. */
export function episodeThumbnail(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "img1.ak.crunchyroll.com" && !url.username && !url.password && !url.port && /^\/i\/spire[1-4]-tmb\/[a-f\d]+_full\.jpg$/.test(url.pathname) && !url.search ? url.href : null;
  } catch { return null; }
}

export async function fetchEpisodePreviews(id: number, signal?: AbortSignal): Promise<EpisodePreview[]> {
  const curated = officialEpisodePreviews(id);
  try {
    const data = await request(`query EpisodePreviews($id: Int!) { Media(id: $id, type: ANIME) { id format episodes streamingEpisodes { title thumbnail url site } } }`, { id }, responseSchema, signal);
    const previews = normalizeEpisodePreviews(data.Media?.streamingEpisodes);
    // AniList sometimes attaches a different season's entire streaming list, even to a film.
    // Reject ambiguous numbering. Never infer a season offset from a row count.
    const ambiguous = data.Media?.id !== id || data.Media?.format === "MOVIE" || (data.Media?.episodes != null && previews.some(p => p.number > data.Media!.episodes!));
    return mergeEpisodePreviews(curated, ambiguous ? [] : previews);
  } catch (error) {
    if (signal?.aborted || !curated.length) throw error;
    return curated;
  }
}
