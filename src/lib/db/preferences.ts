import { PLAYER, PROGRESS } from "@/config/app";
const AUTO_BEST = "portfolio";
import { clampSubtitleHeight, clampSubtitleSize, DEFAULT_SUBTITLE_STYLE } from "@/lib/subtitles/style";
import { nextClock } from "@/lib/utils/hash";
import { accentOf } from "@/lib/utils/accent";
import { db } from "./database";
import type { Preferences } from "./types";

export const DEFAULT_PREFERENCES: Preferences = {
  interfaceLanguage: "en",
  accent: "pink",
  titleLanguage: "english",
  playbackRate: PLAYER.defaultPlaybackRate,
  completionThreshold: PROGRESS.defaultCompletionThreshold,
  // A new profile starts on « Qualité d'abord », stored explicitly. A stored `null` (every profile before RC9.1) still reads as
  // « Français préféré » (`sourceModeOf`): nobody's choice is reinterpreted.
  preferredProviderId: AUTO_BEST,
  subtitleLanguage: "auto",
  subtitleStyle: DEFAULT_SUBTITLE_STYLE,
  subtitleSize: clampSubtitleSize(undefined),
  subtitleHeight: clampSubtitleHeight(undefined),
  subtitleOutline: null,
  translateSubtitles: false,
  showAdult: false,
};

export async function getPreferences(): Promise<Preferences> {
  const stored = await db.preferences.get("prefs");
  if (!stored) return DEFAULT_PREFERENCES;
  const { id: _id, updatedAt: _updatedAt, ...rest } = stored;
  return { ...DEFAULT_PREFERENCES, ...rest, interfaceLanguage: rest.interfaceLanguage === "en" ? "en" : "fr", accent: accentOf(rest.accent) };
}

export async function updatePreferences(patch: Partial<Preferences>): Promise<void> {
  await db.transaction("rw", db.preferences, async () => {
    const stored = await db.preferences.get("prefs");
    const current = await getPreferences();
    await db.preferences.put({ ...current, ...patch, id: "prefs", updatedAt: nextClock(stored?.updatedAt) });
  });
}

/** Wipes everything, including lists. The default list is recreated on next open. */
export async function resetAllData(): Promise<void> {
  await db.delete();
  await db.open();
}
