import type { TitlePreference } from "@/types/anime";
// This edition uses remote catalogue posters; no privately collected promotional rasters are redistributed.
export const OFFICIAL_TITLE_LOGOS: { animeId: number; language: "ja"; src: string; width: number; height: number; sourcePage: string; sourceImage: string; sha256: string; attribution: string; verifiedAt: string; authorization: string }[] = [];
export function officialTitleLogo(_animeId: number, _preference: TitlePreference): (typeof OFFICIAL_TITLE_LOGOS)[number] | undefined { return undefined; }
