"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { createContext, type ReactNode, useCallback, useContext, useLayoutEffect } from "react";
import { ACCENTS, accentOf } from "@/lib/utils/accent";
import { pickTitle, secondaryTitle } from "@/lib/anilist/normalize";
import { DEFAULT_PREFERENCES, getPreferences } from "@/lib/db/preferences";
import type { Preferences } from "@/lib/db/types";
import type { AnimeTitles } from "@/types/anime";
import { setInterfaceLanguage } from "@/lib/i18n/language";

const PreferencesContext = createContext<Preferences>(DEFAULT_PREFERENCES);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const prefs = useLiveQuery(getPreferences, [], DEFAULT_PREFERENCES);
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--color-accent", ACCENTS[accentOf(prefs.accent)].color);
  }, [prefs.accent]);
  useLayoutEffect(() => {
    const language = prefs.interfaceLanguage === "en" ? "en" : "fr";
    setInterfaceLanguage(language);
    document.documentElement.lang = language;
  }, [prefs.interfaceLanguage]);
  return <PreferencesContext.Provider value={prefs}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): Preferences {
  return useContext(PreferencesContext);
}

/** Title helpers bound to the user's title-language preference. */
export function useTitles() {
  const { titleLanguage } = usePreferences();
  const main = useCallback((titles: AnimeTitles) => pickTitle(titles, titleLanguage), [titleLanguage]);
  const secondary = useCallback((titles: AnimeTitles) => secondaryTitle(titles, titleLanguage), [titleLanguage]);
  return { main, secondary };
}
