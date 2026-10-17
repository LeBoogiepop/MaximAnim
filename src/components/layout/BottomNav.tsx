"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { CalendarDays, History, House, Library, Search, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { NAVIGATION } from "@/config/app";
import { mobileNavigationTab, navigationTab, restoreNavigationTab } from "@/lib/utils/navigation";
import { LogoMark } from "@/components/brand/LogoMark";
import { requestSearchFocus } from "@/lib/search/focus-intent";

const ITEMS = [
  { href: "/", get label() { return ui("Accueil"); }, icon: House, match: (p: string) => p === "/" || p.startsWith("/anime") || p.startsWith("/franchise") },
  { href: "/search", get label() { return ui("Recherche"); }, icon: Search, match: (p: string) => p.startsWith("/search") },
  { href: "/schedule", get label() { return ui("Planning"); }, icon: CalendarDays, match: (p: string) => p.startsWith("/schedule") },
  { href: "/lists", get label() { return ui("Listes"); }, icon: Library, match: (p: string) => p.startsWith("/lists") },
  { href: "/history", get label() { return ui("Historique"); }, icon: History, match: (p: string) => p.startsWith("/history") },
] as const;

const subscribe = (cb: () => void) => { window.addEventListener("popstate", cb); return () => window.removeEventListener("popstate", cb); };
const origin = () => navigationTab(window.location.pathname, window.history.state);
const desktop = () => window.matchMedia("(min-width: 1024px)").matches;
const subscribeDesktop = (cb: () => void) => {
  const media = window.matchMedia("(min-width: 1024px)");
  media.addEventListener("change", cb);
  return () => media.removeEventListener("change", cb);
};

export function BottomNav() {
  useInterfaceLanguage();
  const dock = useRef<HTMLElement>(null);
  // CSS owns the edge from the server paint onwards. VisualViewport coordinates
  // are relative to a different viewport on iOS; feeding them into fixed `top`
  // changes the anchor at hydration. Only use it to hide chrome during typing.
  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    const sync = () => {
      const el = dock.current;
      if (!el) return;
      const typing = document.activeElement?.matches("input, textarea, [contenteditable='true']");
      const keyboard = typing && viewport?.scale === 1 && viewport.height < window.innerHeight * NAVIGATION.keyboardViewportRatio;
      el.toggleAttribute("data-keyboard", Boolean(keyboard));
    };
    sync();
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", sync);
    return () => {
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", sync);
    };
  }, []);
  const pathname = usePathname();
  const router = useRouter();
  const tab = useSyncExternalStore(subscribe, origin, () => "/");
  const isDesktop = useSyncExternalStore(subscribeDesktop, desktop, () => false);
  return (
    <nav
      ref={dock}
      aria-label={ui("Navigation principale")}
      className="app-navigation"
    >
      <Link href="/" aria-label={ui("MaximAnim, accueil")} className="nav-brand"><LogoMark size={38} /><span className="display-title text-[1.125rem] leading-none">MaximAnim<span className="text-accent" aria-hidden="true">.</span></span></Link>
      <ul className="nav-items">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const selected = pathname === "/" ? "/" : navigationTab(pathname, { __mxOrigin: tab });
          const active = href === (isDesktop ? selected : mobileNavigationTab(selected));
          return (
            <li key={href} className={href === "/lists" || href === "/history" ? "nav-secondary" : undefined}>
              <Link href={href} onClick={e => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                if (href === "/search" && pathname === "/search") { requestSearchFocus(); return; }
                void restoreNavigationTab(href, url => router.push(url), { root: active }).then(restored => { if (!restored) router.push(href); });
              }} aria-current={active ? "page" : undefined} className="nav-item tactile">
                <span className="nav-icon">
                  <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href="/settings" aria-current={pathname.startsWith("/settings") ? "page" : undefined} className="nav-settings nav-item tactile"><Settings size={22} strokeWidth={1.75} aria-hidden="true" /><span>{ui("Réglages")}</span></Link>
    </nav>
  );
}
