import { artworkImageUrl } from "@/lib/artwork/image-loader";

/** AniList's own staff pictures: `…/file/anilistcdn/staff/{large,medium}/<id-hash>.<ext>`. */
const STAFF_PORTRAIT = /^\/file\/anilistcdn\/staff\/(?:large|medium)\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:png|jpg|jpeg|webp)$/;

/**
 * A portrait is shown only when the picture is AniList's own record of THIS person (it came with the exact staff id) and is a real
 * one: AniList's default silhouette (`default.jpg`) says nothing about the person, and a picture from anywhere else is never used.
 */
export function verifiedPortrait(image: string | null | undefined): string | null {
  if (!image) return null;
  try {
    const url = new URL(image);
    if (url.hostname !== "s4.anilist.co" || !STAFF_PORTRAIT.test(url.pathname) || /\/default\.[a-z]+$/i.test(url.pathname)) return null;
    return artworkImageUrl(url.href, 80) === url.href ? url.href : null;
  } catch {
    return null;
  }
}
