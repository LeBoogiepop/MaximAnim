"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Poster } from "@/components/ui/Poster";
import { SEARCH } from "@/config/app";
import { SEARCH_OVERLAY } from "@/config/search-overlay";
import { useTitles } from "@/features/settings/PreferencesContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useOnline } from "@/hooks/useOnline";
import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { clearOpened, readOpened, removeOpened, type RecentAnime } from "@/lib/search/recent";
import { routes } from "@/lib/utils/routes";
import type { AnimeSummary } from "@/types/anime";
import { YearStatus } from "../EntryStatus";
import { NO_FILTERS } from "../filters";
import { DEFAULT_RAIL, searchUrlQuery } from "../url-state";
import { normalizeQuery, useAnimeSearch } from "../useAnimeSearch";

interface SearchOverlayApi {
  /**
   * Opens the quick search over the current page. Call it from the gesture itself (iOS only raises the keyboard from one). `from` is
   * what to give the focus back to when it closes (WebKit does not focus a button that was pressed, so the browser cannot know).
   */
  open: (from?: HTMLElement | null) => void;
}

const SearchOverlayContext = createContext<SearchOverlayApi>({ open: () => {} });

/** The quick search, from anywhere: a dimmed, softly blurred page behind, a small panel with the field, the recents and the first results. */
export function useSearchOverlay(): SearchOverlayApi {
  return useContext(SearchOverlayContext);
}

const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/**
 * One native modal <dialog> for the whole app (focus trap, Escape and top-layer rendering come from the platform), mounted once and
 * opened by `open()`. It reuses the search itself — `useAnimeSearch` (its ranking, typo fallback and cache), the « Récents » of the
 * search tab — and holds no session of its own: choosing a result is a normal navigation, closing it changes nothing on the page
 * underneath (which was never touched, so its scroll position is exactly what it was). The Rechercher tab stays the full screen.
 */
export function SearchOverlayProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [opening, setOpening] = useState(0);
  // Each opening starts clean (what was typed is not kept: the page's own history is the memory), with the recents as of now.
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<RecentAnime[]>([]);
  const opener = useRef<HTMLElement | null>(null);
  const open = useCallback((from?: HTMLElement | null) => {
    const element = dialog.current;
    if (!element || element.open) return;
    const active = document.activeElement;
    opener.current = from instanceof HTMLElement ? from : active instanceof HTMLElement && active !== document.body ? active : null;
    setQuery("");
    setRecent(readOpened());
    setOpening(count => count + 1);
    setIsOpen(true);
    element.showModal();
    input.current?.focus({ preventScroll: true });
  }, []);
  // « / » and ⌘K / Ctrl+K: on a keyboard, from any page but the search tab itself (it has its own field).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || pathname === "/search" || document.querySelector("dialog[open]")) return;
      const shortcut = (event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !typing(event.target));
      if (!shortcut) return;
      event.preventDefault();
      open();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pathname]);
  const closed = useCallback(() => {
    setIsOpen(false);
    if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
    else if (document.activeElement instanceof HTMLElement && dialog.current?.contains(document.activeElement)) {
      // Keyboard opening from body has no opener. WebKit can keep the hidden
      // search field focused after close, swallowing the next '/' shortcut.
      document.activeElement.blur();
    }
    opener.current = null;
  }, []);
  const api = useMemo(() => ({ open }), [open]);
  return (
    <SearchOverlayContext.Provider value={api}>
      {children}
      <Overlay dialog={dialog} input={input} isOpen={isOpen} opening={opening} onClosed={closed} query={query} setQuery={setQuery} recent={recent} setRecent={setRecent} />
    </SearchOverlayContext.Provider>
  );
}

interface OverlayProps {
  dialog: React.RefObject<HTMLDialogElement | null>;
  input: React.RefObject<HTMLInputElement | null>;
  isOpen: boolean;
  /** Counts the openings: what an opening held (its last answer) is never carried into the next. */
  opening: number;
  onClosed: () => void;
  query: string;
  setQuery: (query: string) => void;
  recent: RecentAnime[];
  setRecent: (recent: RecentAnime[]) => void;
}

function Overlay({ dialog, input, isOpen, opening, onClosed, query, setQuery, recent, setRecent }: OverlayProps) {
  useInterfaceLanguage();
  const router = useRouter();
  const { main } = useTitles();
  const online = useOnline();
  const panel = useRef<HTMLDivElement>(null);
  const debounced = useDebouncedValue(query, SEARCH.debounceMs);
  // Only while the overlay is on screen: a closed one asks for nothing.
  const search = useAnimeSearch(isOpen ? debounced : "", NO_FILTERS);
  const q = normalizeQuery(query);
  const tooShort = q.length < SEARCH.minQueryLength;
  const waiting = !tooShort && (search.isFetching || normalizeQuery(debounced) !== q);
  // The search itself no longer lends one query's list to another while it loads (a restored query must never show another's results).
  // Inside the overlay, typing on IS the same search: the last answer stays, marked busy, until the next one arrives. A new opening
  // starts with nothing held.
  const [held, setHeld] = useState<{ query: string; items: AnimeSummary[] } | null>(null);
  const settled = isOpen && !tooShort && !waiting && search.data != null;
  if (settled && held?.query !== q) setHeld({ query: q, items: search.data!.items });
  const [heldOpening, setHeldOpening] = useState(opening);
  if (heldOpening !== opening) { setHeldOpening(opening); setHeld(null); }
  if (!isOpen && held != null) setHeld(null);
  const items = (settled ? search.data!.items : waiting ? held?.items ?? [] : []).slice(0, SEARCH_OVERLAY.maxResults);
  const full = `${routes.search()}${searchUrlQuery({ q: query, filters: NO_FILTERS, rail: DEFAULT_RAIL })}`;

  const close = useCallback(() => dialog.current?.close(), [dialog]);
  // The panel follows what the phone really shows: with the keyboard up, the visual viewport is shorter than the layout one.
  useEffect(() => {
    if (!isOpen) return;
    const viewport = window.visualViewport;
    const element = panel.current;
    if (!viewport || !element) return;
    const fit = () => element.style.setProperty("--overlay-h", `${Math.round(viewport.height)}px`);
    fit();
    viewport.addEventListener("resize", fit);
    viewport.addEventListener("scroll", fit);
    return () => { viewport.removeEventListener("resize", fit); viewport.removeEventListener("scroll", fit); };
  }, [isOpen]);

  const go = useCallback((href: string) => { close(); router.push(href); }, [close, router]);
  const forget = (id: number) => { removeOpened(id); setRecent(readOpened()); };
  const clearAll = () => { clearOpened(); setRecent([]); };

  return (
    <dialog
      ref={dialog}
      aria-label={ui("Recherche rapide")}
      className="search-overlay"
      data-testid="search-overlay"
      // The browser announces a close a moment after it happens: one that arrives after the next opening is not about this one.
      onClose={() => { if (!dialog.current?.open) onClosed(); }}
      // A press on the dimmed page (the dialog box itself, outside the panel) puts the overlay away.
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
    >
      <div ref={panel} className="search-overlay-panel" data-testid="search-overlay-panel">
        <form
          role="search"
          className="flex items-center gap-1 border-b border-line px-3"
          onSubmit={(event) => { event.preventDefault(); if (!tooShort) go(full); }}
        >
          <Search size={20} className="shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            // One Escape closes the overlay on every engine (Chromium would first clear a search field, then need a second press).
            onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); close(); } }}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={SEARCH_OVERLAY.maxQueryLength}
            placeholder={ui("Rechercher un anime")}
            aria-label={ui("Rechercher un anime")}
            className="search-overlay-input"
            data-testid="search-overlay-input"
          />
          {waiting && <LoaderCircle size={18} className="shrink-0 animate-spin text-muted motion-reduce:animate-none" aria-hidden="true" />}
          {query && <button type="button" aria-label={ui("Effacer la recherche")} onClick={() => { setQuery(""); input.current?.focus({ preventScroll: true }); }} className="flex h-11 w-9 shrink-0 items-center justify-center text-muted active:opacity-60"><X size={18} aria-hidden="true" /></button>}
          <button type="button" onClick={close} className="min-h-11 shrink-0 px-2 text-[15px] font-semibold context-accent active:opacity-60" data-testid="search-overlay-close">{ui("Fermer")}</button>
        </form>
        <div className="search-overlay-body" role="region" aria-label={ui("Résultats")} aria-live="polite">
          {tooShort ? (
            recent.length > 0 ? (
              <section aria-labelledby="overlay-recents" data-testid="search-overlay-recents">
                <div className="flex min-h-11 items-center justify-between px-4">
                  <h2 id="overlay-recents" className="text-[12px] font-bold tracking-[0.09em] text-muted uppercase">{ui("Récents")}</h2>
                  <button type="button" onClick={clearAll} className="min-h-11 pl-3 text-[14px] font-medium text-soft active:opacity-60">{ui("Effacer")}</button>
                </div>
                <ul>
                  {recent.map((entry) => (
                    <li key={entry.id} className="flex items-center" data-testid="search-overlay-recent">
                      <Link href={routes.anime(entry.id)} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey) return; event.preventDefault(); go(routes.anime(entry.id)); }} className="search-overlay-row min-w-0 flex-1">
                        <Poster cover={entry.cover} alt="" sizes="40px" className="w-10 shrink-0" rounded="rounded-md" />
                        <span className="line-clamp-2 min-w-0 flex-1 text-[15px] leading-snug font-semibold">{main(entry.titles)}</span>
                      </Link>
                      <button type="button" aria-label={ui("Retirer {0} des récents", main(entry.titles))} onClick={() => forget(entry.id)} className="flex h-11 w-11 shrink-0 items-center justify-center text-muted active:opacity-60" data-testid="search-overlay-forget"><X size={18} aria-hidden="true" /></button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className="px-4 py-5 text-[14px] text-soft">{ui("Tapez au moins deux lettres du titre.")}</p>
            )
          ) : items.length > 0 ? (
            <>
              <ul data-testid="search-overlay-results" aria-busy={waiting} className={waiting ? "opacity-60" : undefined}>
                {items.map((anime) => (
                  <li key={anime.id}>
                    <Link href={routes.anime(anime.id)} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey) return; event.preventDefault(); go(routes.anime(anime.id)); }} className="search-overlay-row" data-testid="search-overlay-result">
                      <Poster cover={anime.coverImage} alt="" sizes="40px" className="w-10 shrink-0" rounded="rounded-md" />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 block text-[15px] leading-snug font-semibold">{main(anime.titles)}</span>
                        <span className="mt-0.5 block text-[13px] text-soft"><YearStatus year={anime.seasonYear} status={anime.status} /></span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={full} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey) return; event.preventDefault(); go(full); }} className="search-overlay-all" data-testid="search-overlay-all">{ui("Tous les résultats")}</Link>
            </>
          ) : waiting ? (
            <p className="px-4 py-5 text-[14px] text-soft">{ui("Recherche…")}</p>
          ) : search.isError || !online ? (
            <p className="px-4 py-5 text-[14px] text-soft" role="status">{online ? ui("La recherche n'a pas abouti.") : ui("Hors ligne : la recherche attend la connexion.")}</p>
          ) : (
            <p className="px-4 py-5 text-[14px] text-soft" role="status" data-testid="search-overlay-empty">{ui("Aucun résultat pour « {0} ».", query.trim())}</p>
          )}
        </div>
      </div>
    </dialog>
  );
}
