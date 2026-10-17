import { ui } from "@/lib/i18n/translate";
import type { ExternalLink } from "@/types/anime";

export interface ShownLink {
  key: "official" | "anilist" | "wikipedia" | "nautiljon";
  label: string;
  url: string;
}

const hostOf = (url: string): string | null => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
};

const hostIs = (url: string, domain: string) => {
  const host = hostOf(url);
  return host != null && (host === domain || host.endsWith(`.${domain}`));
};

/**
 * The few external links worth a place on a page, taken ONLY from what AniList itself lists for the work: the official
 * site, AniList, and Wikipédia / Nautiljon when AniList carries such a link (so the match is AniList's, never ours).
 * A Nautiljon or Wikipedia address is never built from a title or a slug. Streaming services and social networks are
 * not shown: Maximanim is where the viewer watches.
 */
export function shownLinks({ id, siteUrl, links, kind = "anime" }: { id: number; siteUrl: string | null; links: readonly ExternalLink[]; kind?: "anime" | "manga" | "studio" | "staff" }): ShownLink[] {
  const out: ShownLink[] = [];
  const official = links.find((l) => l.site.toLowerCase() === "official site" && hostOf(l.url));
  if (official) out.push({ key: "official", label: ui("Site officiel"), url: official.url });
  const wikipedia = links.find((l) => hostIs(l.url, "wikipedia.org"));
  if (wikipedia) out.push({ key: "wikipedia", label: ui("Wikipédia"), url: wikipedia.url });
  const nautiljon = links.find((l) => hostIs(l.url, "nautiljon.com"));
  if (nautiljon) out.push({ key: "nautiljon", label: "Nautiljon", url: nautiljon.url });
  // AniList's own page: the id is the work's, nothing is guessed.
  out.push({ key: "anilist", label: "AniList", url: siteUrl && hostIs(siteUrl, "anilist.co") ? siteUrl : `https://anilist.co/${kind}/${id}` });
  return out;
}
