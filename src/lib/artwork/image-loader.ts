/**
 * Where an <Image> actually downloads from. The catalogue CDNs (TMDB, AniList) already serve cacheable, correctly
 * sized files over HTTP/2 with CORS, so the page talks to them directly instead of paying a second hop through
 * Vercel's `/_next/image`. That optimizer answers HTTP 402 once the plan's transformation quota is spent, which made
 * every picture fail first and queue behind a two-slot fallback (staggered posters, empty thumbnails, missing portraits).
 * Anything that is not an exact known catalogue pattern fails closed: `data:,` is an unusable image, so the caller's
 * own `onError` fallback runs and no other host is ever contacted.
 */

/** TMDB serves exactly these widths (plus `original`); any other `w<number>` is a 400. */
const TMDB_WIDTHS = [185, 300, 500, 780, 1280, 1920] as const;
/** PNG logos are often lighter at `original` than at the 1280/1920 renditions, which only re-encode them larger. */
const TMDB_PNG_WIDTHS = [185, 300, 500, 780] as const;
/** Next's width ladder is coarse (1284 for a 1170 px phone); a rendition within 5 % of it is sharp enough and far lighter. */
const WIDTH_SLACK = 0.95;
const TMDB_PATH = /^\/t\/p\/(w\d{2,4}|original)\/([a-zA-Z0-9]{1,80})\.(png|jpg|webp)$/;
const ANILIST_PATH = /^\/file\/anilistcdn\/[a-zA-Z0-9][a-zA-Z0-9._/-]*\.(?:png|jpg|jpeg|webp|avif)$/;
const CRUNCHYROLL_PATH = /^\/i\/spire[1-4]-tmb\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9][a-zA-Z0-9_-]*\.(?:png|jpg|jpeg|webp|avif)$/;
const BLOCKED = "data:,";

/** Smallest TMDB rendition that covers the requested device pixels, never above the one the resolver selected. */
function tmdbUrl(pathname: string, width: number): string | null {
  const match = TMDB_PATH.exec(pathname);
  if (!match) return null;
  const [, size, file, extension] = match as unknown as [string, string, string, string];
  const ceiling = size === "original" ? Infinity : Number(size.slice(1));
  const tiers = extension === "png" && size === "original" ? TMDB_PNG_WIDTHS : TMDB_WIDTHS;
  const wanted = tiers.find(tier => tier >= width * WIDTH_SLACK);
  const best = wanted && wanted <= ceiling ? `w${wanted}` : size;
  // A requested width past every tier of a capped source simply keeps the source's own size.
  return `https://image.tmdb.org/t/p/${best}/${file}.${extension}`;
}

export function artworkImageUrl(src: string, width: number): string {
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  try {
    const url = new URL(src);
    if (url.protocol !== "https:" || url.port || url.username || url.password || url.search || url.hash) return BLOCKED;
    if (url.hostname === "image.tmdb.org") return tmdbUrl(url.pathname, width) ?? BLOCKED;
    if (url.hostname === "s4.anilist.co") return ANILIST_PATH.test(url.pathname) ? url.href : BLOCKED;
    if (url.hostname === "img1.ak.crunchyroll.com") return CRUNCHYROLL_PATH.test(url.pathname) ? url.href : BLOCKED;
  } catch { /* Fail closed. */ }
  return BLOCKED;
}
