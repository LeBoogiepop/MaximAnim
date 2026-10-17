"use client";

import { usePathname } from "next/navigation";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { installInputModality } from "@/lib/a11y/input-modality";
import { markRoute, markTap } from "@/lib/perf/marks";
import { recordNavigation } from "@/lib/utils/navigation";
import { FALLBACK_TONE, type Tone } from "@/lib/utils/tone";
import { ArtworkPaletteContext } from "./ArtworkPalette";
import { toneVars } from "./ToneScope";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

import { BottomNav } from "./BottomNav";
import { HomeScreen } from "@/features/home/HomeScreen";
import { NAVIGATION } from "@/config/app";

/** The player is immersive: no bottom navigation competing with the video. */
function isImmersive(pathname: string) {
  return pathname.startsWith("/watch/");
}

// URL strings only, no retained page trees or decoded image buffers.
const presentedRoutes = new Set<string>();

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const returning = presentedRoutes.has(pathname);
  useEffect(() => () => {
    presentedRoutes.delete(pathname); presentedRoutes.add(pathname);
    if (presentedRoutes.size > NAVIGATION.retainedEntries) presentedRoutes.delete(presentedRoutes.values().next().value!);
  }, [pathname]);
  const immersive = isImmersive(pathname);
  const homeActive = pathname === "/";
  const [homeVisited, setHomeVisited] = useState(homeActive);
  if (homeActive && !homeVisited) setHomeVisited(true);
  const [artworkTone, setArtworkTone] = useState<Tone>(FALLBACK_TONE);
  const contextual = /^\/(anime|franchise)\/\d+/.test(pathname);
  useEffect(() => recordNavigation(), [pathname]);
  useEffect(() => markRoute(pathname), [pathname]);
  useEffect(() => installInputModality(), []);
  // Diagnostics only (no-op in production): the clock for tap → route → content starts on the finger.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (link) markTap(link.getAttribute("href") ?? "");
    };
    document.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    return () => document.removeEventListener("pointerdown", onDown, { capture: true });
  }, []);
  return (
    <ArtworkPaletteContext.Provider value={setArtworkTone}><div className={`app-shell ${immersive ? "app-shell-immersive" : ""}`} style={contextual ? toneVars(artworkTone) : { "--tone": "var(--color-accent)", "--tone-on": "var(--color-ink)" } as CSSProperties}>
      <OfflineBanner />

      <main id="main-content" data-returning={returning || undefined} className={immersive ? "min-h-dvh" : "app-content pb-nav"}>
        {/* One bounded retained surface. Native hidden excludes it from focus and
            accessibility; live DB reads stay current, no private snapshot cache. */}
        {homeVisited && <div hidden={!homeActive}><HomeScreen active={homeActive} /></div>}
        {children}
      </main>
      {!immersive && <BottomNav />}
    </div></ArtworkPaletteContext.Provider>
  );
}
