import { ui } from "@/lib/i18n/translate";
import { SUBTITLES } from "@/config/app";

/** The only subtitle choice a viewer makes. */
export type SubtitleChoice = "auto" | "fr" | "en" | "off";

export const SUBTITLE_CHOICES: readonly SubtitleChoice[] = ["auto", "fr", "en", "off"];

export const SUBTITLE_LABELS: Record<Exclude<SubtitleChoice, "auto" | "off">, string> = { get fr() { return ui("Français"); }, en: "English" };

/**
 * Index of the track to show, or -1 for none. Auto follows the preferred
 * languages, then whatever the source marked as its default, then the first
 * track: if usable subtitles exist, Auto shows them. A language asked for
 * explicitly but absent from this episode falls back to Auto.
 */
export function resolveSubtitle(tracks: readonly { lang: string; default?: boolean }[], choice: SubtitleChoice): number {
  if (choice === "off" || !tracks.length) return -1;
  if (choice !== "auto") {
    const exact = tracks.findIndex((t) => t.lang === choice);
    if (exact >= 0) return exact;
  }
  for (const lang of SUBTITLES.autoLanguages) {
    const i = tracks.findIndex((t) => t.lang === lang);
    if (i >= 0) return i;
  }
  const marked = tracks.findIndex((t) => t.default);
  return marked >= 0 ? marked : 0;
}
