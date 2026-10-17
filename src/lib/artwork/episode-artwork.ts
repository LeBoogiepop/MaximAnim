import { localizeOwnedText } from "@/lib/i18n/translate";
const official = { entries: [] as { animeId: number; number: number; title: string | null; thumbnail: string; sourcePage: string; attribution: string; displayCropInset?: number; width: number; height: number; staff?: string }[] };
import type { EpisodePreview } from "@/lib/anilist/episodes";
import type { EpisodeItem } from "@/lib/providers/episodes";
import { assertSafeUrl } from "@/lib/net/host-policy";
import { hasJapaneseScript } from "@/lib/utils/script";
import type { TitlePreference } from "@/types/anime";

export interface EpisodeArtworkCredit { label: string; name: string }
/** Exact curated identities; no title search, season inference or offset guesses. */
export function officialEpisodePreviews(animeId: number): EpisodePreview[] {
  return official.entries.filter(e => e.animeId === animeId).map(e => ({ number: e.number, title: e.title, thumbnail: e.thumbnail, href: e.sourcePage, site: "Site officiel", provenance: "official", attribution: e.attribution, ...(e.displayCropInset ? { displayCrop: { inset: e.displayCropInset, width: e.width, height: e.height } } : {}) }));
}
export function officialEpisodeCredits(animeId: number, number: number): EpisodeArtworkCredit[] {
  const staff = official.entries.find(e => e.animeId === animeId && e.number === number)?.staff;
  const labels: Record<string, string> = { "脚本": "Scénario", "絵コンテ": "Storyboard", "演出": "Réalisation", "絵コンテ・演出": "Storyboard / réalisation", "作画監督": "Direction de l’animation", "作監協力": "Animation · collaboration" };
  return staff?.split(" / ").flatMap(row => { const [role, name] = row.split("："); return role && name && labels[role] ? [{ label: labels[role], name }] : []; }) ?? [];
}

/** Only an exact, unique native-name match in this anime's AniList credits can create a person link. */
export function readableEpisodeCredits(credits: readonly EpisodeArtworkCredit[], people: readonly { id: number; name: string; nativeName: string | null }[], preference: TitlePreference) {
  const key = (name: string) => name.replace(/\s/g, "");
  return credits.map(credit => ({ label: localizeOwnedText(credit.label), people: credit.name.split(/[、,]/).map(native => {
    const matches = [...new Map(people.filter(p => p.nativeName && key(p.nativeName) === key(native)).map(p => [p.id, p])).values()];
    const person = matches.length === 1 && !hasJapaneseScript(matches[0]!.name) ? matches[0] : undefined;
    return { name: preference === "native" ? native : person?.name ?? null, nativeName: native, id: person?.id ?? null };
  }) }));
}
/** Approved provider hosts remain device-local; never broaden the Next image proxy. */
export function providerEpisodePreviews(episodes: readonly EpisodeItem[], hosts: readonly string[], sourceName: string, seriesArtwork: readonly (string | null | undefined)[] = []): EpisodePreview[] {
  const occurrences = new Map<string, number>();
  for (const ep of episodes) if (ep.thumbnail) occurrences.set(ep.thumbnail, (occurrences.get(ep.thumbnail) ?? 0) + 1);
  return episodes.flatMap(ep => {
    if (!ep.providerEpisode || ep.providerEpisode.number !== ep.number || !ep.thumbnail || seriesArtwork.includes(ep.thumbnail) || (occurrences.get(ep.thumbnail) ?? 0) > 1) return [];
    try {
      const url = assertSafeUrl(ep.thumbnail, { allowedHosts: hosts });
      return [{ number: ep.number, title: ep.title, thumbnail: url.href, href: "", site: sourceName, provenance: "provider" as const }];
    } catch { return []; }
  });
}
/** Ordered candidates are retained so an unavailable still can try another exact-episode source. */
export function mergeEpisodePreviews(...sources: readonly EpisodePreview[][]): EpisodePreview[] {
  const byNumber = new Map<number, EpisodePreview>();
  for (const rows of sources) for (const preview of rows) {
    const existing = byNumber.get(preview.number);
    if (!existing) byNumber.set(preview.number, { ...preview, alternatives: [...(preview.alternatives ?? [])] });
    else {
      const candidates = [preview, ...(preview.alternatives ?? [])];
      existing.alternatives = [...(existing.alternatives ?? []), ...candidates].filter((p, i, all) => p.thumbnail && p.thumbnail !== existing.thumbnail && all.findIndex(c => c.thumbnail === p.thumbnail) === i);
    }
  }
  return [...byNumber.values()].sort((a, b) => a.number - b.number);
}
