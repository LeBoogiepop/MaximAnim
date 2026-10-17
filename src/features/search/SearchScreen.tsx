"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Poster } from "@/components/ui/Poster";
import { Sheet } from "@/components/ui/Sheet";
import { SEARCH } from "@/config/app";
import { DiscoveryRow, YearStatus } from "./EntryStatus";
import { useFranchiseGrouping } from "@/features/franchise/useFranchise";
import { useTitles } from "@/features/settings/PreferencesContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useOnline } from "@/hooks/useOnline";
import { AniListError } from "@/lib/anilist/client";
import { clearOpened, readOpened, type RecentAnime } from "@/lib/search/recent";
import { titleSignal } from "@/lib/search/ranking";
import { isSteinsEntry } from "@/lib/anilist/editorial";
import { routes } from "@/lib/utils/routes";
import type { AnimeSummary } from "@/types/anime";
import {
  activeFilterCount,
  FORMAT_OPTIONS,
  GENRES,
  NO_FILTERS,
  RAILS,
  type RailId,
  railParams,
  SEASON_OPTIONS,
  type SearchFilters,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  toBrowseParams,
} from "./filters";
import { readSearchEntry, readSearchSession, replaceSearchUrl, saveSearchSession, searchEntryId } from "./session";
import { consumeSearchFocus } from "@/lib/search/focus-intent";
import { parseSearchUrl, searchUrlQuery } from "./url-state";
import { normalizeQuery, useAnimeSearch, useBrowse } from "./useAnimeSearch";

export function SearchScreen() {
  useInterfaceLanguage();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(NO_FILTERS);
  const [rail, setRail] = useState<RailId>("trending");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [recent, setRecent] = useState<RecentAnime[]>([]);
  const [engaged, setEngaged] = useState(false);
  const [restored, setRestored] = useState(false);
  // Each opening remounts the sheet: its draft always starts from the applied filters.
  const [sheetKey, setSheetKey] = useState(0);
  // "Cette saison" is computed once per visit.
  const [today] = useState(() => new Date());
  const debounced = useDebouncedValue(query, SEARCH.debounceMs);
  // Restored browsing uses its cached query immediately; debounce only typing.
  const activeQuery = editing ? debounced : query;
  const search = useAnimeSearch(activeQuery, filters, restored);
  const inputRef = useRef<HTMLInputElement>(null);
  const online = useOnline();
  const pathname = usePathname();
  // « Récents » follow the field's REAL focus. Pressing a row blurs the field before the click lands (WebKit), so a press in
  // progress holds the list for a moment instead of letting it vanish under the finger.
  const pressing = useRef(false);
  const release = useCallback(() => { setTimeout(() => { pressing.current = false; }, SEARCH.recentsPressHoldMs); }, []);
  const disengage = useCallback(() => { if (!pressing.current) setEngaged(false); }, []);
  useEffect(() => {
    if (!engaged) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target !== inputRef.current && !event.target.closest('[data-testid="search-recents"]')) setEngaged(false);
    };
    // Keyboard dismissed (Rechercher, Échap) or the page left: the list goes with the focus.
    const hide = () => { if (document.visibilityState === "hidden") setEngaged(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", hide);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("visibilitychange", hide); window.removeEventListener("pagehide", hide); };
  }, [engaged]);
  // The screen can stay mounted behind a destination (opening a Récent, then Back): coming back never reopens the list.
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) { setSeenPath(pathname); setEngaged(false); }
  useEffect(() => {
    if (pathname !== "/search" && document.activeElement === inputRef.current) inputRef.current?.blur();
  }, [pathname]);

  // URL wins for deep links/history; a plain tab visit resumes this browsing session.
  const [restoreVersion, setRestoreVersion] = useState(0);
  const restoreY = useRef<number | null>(null);
  const restoringQuery = useRef<string | null>(null);
  const entryId = useRef<string | null>(null);
  useLayoutEffect(() => {
    const restore = (preserveEarlyInput = false) => {
      if (window.location.pathname !== "/search") return;
      const id = searchEntryId();
      const session = readSearchEntry(id) ?? readSearchSession();
      const saved = parseSearchUrl(window.location.search || session.query);
      if (preserveEarlyInput && inputRef.current?.value) saved.q = inputRef.current.value;
      const canonical = searchUrlQuery(saved);
      entryId.current = id ?? crypto.randomUUID();
      restoreY.current = canonical === session.query ? session.y : 0;
      restoringQuery.current = canonical;
      if (inputRef.current) inputRef.current.value = saved.q;
      setEditing(false);
      setQuery(saved.q); setFilters(saved.filters); setRail(saved.rail);
      setRecent(readOpened());
      setRestored(true);
      setRestoreVersion(version => version + 1);
    };
    restore(true);
    if (consumeSearchFocus()) inputRef.current?.focus({ preventScroll: true });
    if (inputRef.current && document.activeElement === inputRef.current) setEngaged(true);
    const pop = () => restore();
    const show = (event: PageTransitionEvent) => { if (event.persisted) restore(); };
    window.addEventListener("popstate", pop);
    window.addEventListener("pageshow", show);
    return () => { window.removeEventListener("popstate", pop); window.removeEventListener("pageshow", show); };
  }, []);

  const q = normalizeQuery(activeQuery);
  const tooShort = q.length < SEARCH.minQueryLength;
  const typing = normalizeQuery(query) !== q;
  const filterCount = activeFilterCount(filters);
  // Only while the field is actively focused AND empty.
  const showRecents = engaged && !query && !filterCount && recent.length > 0;
  // Before typing: a discovery rail, or everything matching the filters.
  const browse = useBrowse(filterCount ? `filters:${JSON.stringify(filters)}` : `rail:${rail}:${today.getFullYear()}:${Math.floor(today.getMonth() / 3)}`, restored && tooShort && !typing ? (filterCount ? toBrowseParams(null, filters) : railParams(rail, today)) : null);
  // Keep this entry's URL in step with the search (replaceState: no extra history entries, no Next navigation).
  const urlQuery = searchUrlQuery({ q: query, filters, rail });
  useEffect(() => {
    if (!restored || pathname !== "/search" || window.location.pathname !== "/search" || !entryId.current) return;
    if (restoringQuery.current != null && restoringQuery.current !== urlQuery) {
      if (!editing) return;
      restoreY.current = null; restoringQuery.current = null;
    }
    saveSearchSession(urlQuery, restoreY.current ?? window.scrollY, entryId.current);
    if (window.location.search === urlQuery && searchEntryId() === entryId.current) return;
    replaceSearchUrl(entryId.current, urlQuery);
  }, [urlQuery, restored, restoreVersion, pathname, editing]);
  const loading = !tooShort ? search.isFetching || typing : browse.isFetching;
  const hasContent = tooShort ? Boolean(browse.data) && !browse.isPlaceholderData : Boolean(search.data) && !search.isPlaceholderData;
  useLayoutEffect(() => {
    if (!restored || restoreY.current == null || restoringQuery.current !== urlQuery) return;
    const started = performance.now();
    let frame = 0;
    const cancel = () => { restoreY.current = null; restoringQuery.current = null; cancelAnimationFrame(frame); };
    const attempt = () => {
      if (window.location.pathname !== "/search" || restoreY.current == null) return;
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (max < restoreY.current && performance.now() - started < SEARCH.restoreTimeoutMs) { frame = requestAnimationFrame(attempt); return; }
      window.scrollTo({ top: Math.min(restoreY.current, max), behavior: "instant" });
      cancel();
      if (entryId.current) saveSearchSession(urlQuery, window.scrollY, entryId.current);
    };
    // After Next's own route scroll, with enough rows present. A user's gesture wins.
    if (hasContent && !typing) frame = requestAnimationFrame(attempt);
    window.addEventListener("pointerdown", cancel, { once: true, passive: true });
    window.addEventListener("touchmove", cancel, { once: true, passive: true });
    window.addEventListener("wheel", cancel, { once: true, passive: true });
    window.addEventListener("keydown", cancel, { once: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("pointerdown", cancel); window.removeEventListener("touchmove", cancel); window.removeEventListener("wheel", cancel); window.removeEventListener("keydown", cancel); };
  }, [restored, hasContent, typing, restoreVersion, urlQuery]);
  useEffect(() => {
    if (!restored) return;
    // Next may scroll the destination before this effect is cleaned up. Never
    // let that destination's position overwrite the search we just left.
    const save = () => { if (restoreY.current == null && window.location.pathname === "/search" && entryId.current && searchEntryId() === entryId.current) saveSearchSession(urlQuery, window.scrollY, entryId.current); };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [urlQuery, restored]);

  return (
    <div className="catalogue-page" onBlur={e => {
      if (!(e.target as Element).closest('[data-testid="search-recents"]')) return;
      const next = e.relatedTarget;
      if (!(next instanceof Element) || (!next.closest('[data-testid="search-recents"]') && next !== inputRef.current)) disengage();
    }}>
      <div className="page-header px-safe sticky top-0 z-30 bg-ink pb-3">
        <h1 className="display-title mb-5">{ui("Recherche")}</h1>
        <div className="flex items-center gap-2">
          <form
            role="search"
            className="min-w-0 flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              inputRef.current?.blur();
            }}
          >
            <label className="relative block">
              <span className="sr-only">{ui("Rechercher un anime")}</span>
              <Search size={19} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-accent" aria-hidden="true" />
              <input
                ref={inputRef}
                data-testid="search-input"
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                // Uncontrolled on purpose: hydration must not wipe early keystrokes.
                defaultValue=""
                onChange={(e) => { setEditing(true); setQuery(e.target.value); }}
                onFocus={() => { setEngaged(true); setRecent(readOpened()); }}
                onBlur={e => { if (!(e.relatedTarget instanceof Element && e.relatedTarget.closest('[data-testid="search-recents"]'))) disengage(); }}
                onKeyUp={e => { if (e.key === "Escape") inputRef.current?.blur(); }}
                onKeyDown={e => { if (e.key === "ArrowDown" && !query) { const first = document.querySelector<HTMLElement>('[data-testid="search-recent"]'); if (first) { e.preventDefault(); first.focus(); } } }}
                placeholder={ui("Rechercher un anime")}
                className="search-field h-13 w-full rounded-[var(--radius-control)] border border-line bg-raised pr-12 pl-11 text-base font-medium placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
              />
              <span className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center">
                {loading && !tooShort ? (
                  <LoaderCircle size={20} className="mr-3 animate-spin text-muted" aria-label={ui("Recherche en cours")} />
                ) : query ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (inputRef.current) inputRef.current.value = "";
                      // Not "editing": an emptied field is answered at once, not after the typing debounce, so no stale results or blank gap.
                      setEditing(false);
                      setQuery("");
                      inputRef.current?.focus();
                      setEngaged(true);
                    }}
                    aria-label={ui("Effacer la recherche")}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-muted active:bg-surface"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                ) : null}
              </span>
            </label>
          </form>
          <button
            type="button"
            onClick={() => {
              setSheetKey((k) => k + 1);
              setSheetOpen(true);
            }}
            aria-label={filterCount ? ui("Filtres, {0} actif{1}", filterCount, filterCount > 1 ? "s" : "") : ui("Filtres")}
            className={`relative flex h-13 w-13 shrink-0 items-center justify-center rounded-[var(--radius-control)] border active:bg-surface ${filterCount ? "border-accent text-paper" : "border-line text-soft"}`}
            data-testid="search-filters"
          >
            <SlidersHorizontal size={19} aria-hidden="true" />
            {filterCount > 0 && <span className="absolute top-1.5 right-1.5 min-w-4 rounded-full bg-accent px-1 text-[10px] leading-4 font-semibold text-ink">{filterCount}</span>}
          </button>
        </div>

        {tooShort &&
          (filterCount ? (
            <div className="mt-2 flex min-h-11 items-center justify-between text-[13px] text-soft">
              <span>
                {filterCount}{" " + ui("filtre")}{filterCount > 1 ? "s" : ""}{" " + ui("actif")}{filterCount > 1 ? "s" : ""}
              </span>
              <button type="button" onClick={() => setFilters(NO_FILTERS)} className="min-h-11 px-1 text-[15px] text-accent">
                {ui("Réinitialiser")}</button>
            </div>
          ) : (
            <div role="tablist" aria-label={ui("Découvrir")} className="tab-scroller -mx-4 mt-3 gap-1.5 px-4 pb-0.5">
              {RAILS.map((r) => (
                <Chip key={r.id} selected={rail === r.id} onClick={() => setRail(r.id)} role="tab">
                  {r.label}
                </Chip>
              ))}
            </div>
          ))}
      </div>

      <div
        className="px-safe pt-2"
        aria-live="polite"
        aria-busy={loading}
      >
        {showRecents && (
          <Recents
            items={recent}
            onPress={() => { pressing.current = true; document.addEventListener("pointerup", release, { once: true }); document.addEventListener("pointercancel", release, { once: true }); }}
            onClear={() => {
              clearOpened();
              setRecent([]);
            }}
          />
        )}
        {!restored || typing ? <ResultSkeleton /> : showRecents ? null : tooShort ? (
          <Browse browse={browse} online={online} />
        ) : (
          <Results online={online} search={search} onRetry={() => void search.refetch()} query={q} />
        )}
      </div>

      <FilterSheet key={sheetKey} open={sheetOpen} value={filters} onClose={() => setSheetOpen(false)} onApply={setFilters} />
    </div>
  );
}

/** « Récents »: the anime opened lately — cover and title, on this device only. One tap opens it again. */
function Recents({ items, onClear, onPress }: { items: RecentAnime[]; onClear: () => void; onPress: () => void }) {
  useInterfaceLanguage();
  const { main } = useTitles();
  return (
    <section aria-labelledby="recent-title" className="mb-4" data-testid="search-recents" onPointerDown={onPress}>
      <div className="flex min-h-11 items-center justify-between">
        <h2 id="recent-title" className="text-[17px] font-semibold">
          {ui("Récents")}</h2>
        <button type="button" onClick={onClear} className="min-h-11 px-1 text-[15px] font-medium text-accent transition-opacity active:opacity-70" data-testid="search-recents-clear">
          {ui("Effacer")}</button>
      </div>
      <ul className="divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={routes.anime(item.id)} className="flex min-h-[3.75rem] items-center gap-3 py-1.5 transition-colors active:bg-raised" data-testid="search-recent">
              <Poster cover={item.cover} alt="" sizes="40px" className="w-9 shrink-0" rounded="rounded-md" />
              <span className="min-w-0 flex-1 truncate text-[16px]">{main(item.titles)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Chip({ selected, onClick, children, role }: { selected: boolean; onClick: () => void; children: ReactNode; role?: "tab" }) {
  useInterfaceLanguage();
  return (
    <button
      type="button"
      role={role}
      aria-selected={role === "tab" ? selected : undefined}
      aria-pressed={role ? undefined : selected}
      onClick={onClick}
      className={`min-h-11 shrink-0 rounded-xl border px-3.5 text-[14px] font-medium ${selected ? "border-accent bg-surface text-paper" : "border-line text-soft"}`}
    >
      {children}
    </button>
  );
}

function metaOf(anime: AnimeSummary) { return <YearStatus year={anime.seasonYear} status={anime.status} />; }

function ResultList({ items, stale }: { items: AnimeSummary[]; stale: boolean }) {
  useInterfaceLanguage();
  return (
    <ul className={`flex flex-col transition-opacity ${stale ? "opacity-60" : ""}`}>
      {items.map((anime, i) => (
        <li key={anime.id}>
          <DiscoveryRow anime={anime} href={routes.anime(anime.id)} priority={i < 4} meta={metaOf(anime)} />
        </li>
      ))}
    </ul>
  );
}

/** Conservative grouping keeps one ranked entry row, with direct access to its anime. */
function GroupedResultList({ items, stale, query }: { items: AnimeSummary[]; stale: boolean; query: string }) {
  useInterfaceLanguage();
  // The verified alternate branch is not a PREQUEL/SEQUEL group. A broad family query still has one clean lead.
  // Specific queries keep their own ranked entry, including 0, the film and 23β.
  const broadSteins = ["steins", "steins gate"].includes(titleSignal(query));
  const lead = items.find(a => a.id === 9253);
  const compact = broadSteins && lead ? items.filter(a => !isSteinsEntry(a.id) || a.id === lead.id) : items;
  const rows = useFranchiseGrouping(compact);
  return (
    <ul data-testid="search-results" className={`flex flex-col transition-opacity ${stale ? "opacity-60" : ""}`}>
      {rows.map((row, i) => (
        <li key={row.kind === "group" ? row.group.members[0]!.id : row.anime.id}>
          {(() => {
            const anime = row.kind === "entry" ? row.anime : row.group.members[0]!;
            return <DiscoveryRow anime={anime} href={routes.anime(anime.id)} priority={i < 4} meta={metaOf(anime)} />;
          })()}
        </li>
      ))}
    </ul>
  );
}

function Browse({ browse, online }: { browse: ReturnType<typeof useBrowse>; online: boolean }) {
  useInterfaceLanguage();
  if (!browse.data) {
    if (!online) {
      return (
        <EmptyState title={ui("Pas de connexion")} compact>
          {ui("La recherche a besoin d'internet. Tes listes restent accessibles depuis l'accueil.")}</EmptyState>
      );
    }
    if (browse.isError) {
      return (
        <EmptyState title={ui("AniList ne répond pas")} compact action={<Button variant="secondary" onClick={() => void browse.refetch()}>{ui("Réessayer")}</Button>}>
          {ui("Tape un titre, ou réessaie dans un instant.")}</EmptyState>
      );
    }
    return <ResultSkeleton />;
  }
  if (!browse.data.length) {
    return (
      <EmptyState title={ui("Aucun anime avec ces filtres")} compact>
        {ui("Élargis un filtre : une autre année, un autre format…")}</EmptyState>
    );
  }
  return <ResultList items={browse.data} stale={browse.isPlaceholderData} />;
}

function Results({ online, search, onRetry, query }: { online: boolean; search: ReturnType<typeof useAnimeSearch>; onRetry: () => void; query: string }) {
  useInterfaceLanguage();
  if (!online && !search.data) {
    return (
      <EmptyState title={ui("Pas de connexion")} tone="warning" compact>
        {ui("La recherche a besoin d'internet. Tes listes restent accessibles depuis l'accueil.")}</EmptyState>
    );
  }
  if (search.isError && !search.data) {
    const rateLimited = search.error instanceof AniListError && search.error.kind === "rateLimited";
    return (
      <EmptyState title={rateLimited ? ui("AniList demande une pause") : ui("AniList ne répond pas")} tone="warning" compact action={<Button variant="secondary" onClick={onRetry}>{ui("Réessayer")}</Button>}>
        {rateLimited ? ui("Trop de recherches d'un coup. Réessaie dans quelques secondes.") : ui("Vérifie ta connexion, puis réessaie.")}
      </EmptyState>
    );
  }
  if (!search.data) return <ResultSkeleton />;
  if (search.data.items.length === 0) {
    return (
      <EmptyState title={ui("Aucun anime trouvé")} compact>
        {ui("Rien pour «") + " "}{query}{" " + ui("». Essaie le titre romaji ou japonais.")}</EmptyState>
    );
  }
  return (
    <>
      {search.data.approximate && (
        <p className="pb-1 text-[13px] text-soft" data-testid="approximate">
          {ui("Résultats approchants pour «") + " "}{query}{" " + ui("»")}</p>
      )}
      <GroupedResultList items={search.data.items} query={query} stale={search.isPlaceholderData} />
    </>
  );
}

function ResultSkeleton() {
  useInterfaceLanguage();
  return (
    <ul aria-hidden="true" className="flex flex-col gap-3 pt-2">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="flex items-center gap-3.5">
          <div className="skeleton aspect-[5/7] w-[3.6rem] rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/3 rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}

const YEARS_BACK = 60;

/** Format, status, season/year, genre, sort — a draft applied with "Afficher". */
function FilterSheet({ open, value, onClose, onApply }: { open: boolean; value: SearchFilters; onClose: () => void; onApply: (f: SearchFilters) => void }) {
  useInterfaceLanguage();
  const [draft, setDraft] = useState(value);
  const [thisYear] = useState(() => new Date().getFullYear());
  const set = <K extends keyof SearchFilters>(key: K, v: SearchFilters[K]) => setDraft((d) => ({ ...d, [key]: v }));
  const years = Array.from({ length: YEARS_BACK }, (_, i) => thisYear + 1 - i);
  const selectClass = "h-12 w-full rounded-xl border border-line bg-ink px-3 text-base focus:border-accent focus:outline-none";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={ui("Filtres")}
      footer={
        <div className="flex gap-2.5">
          <Button variant="secondary" block onClick={() => setDraft(NO_FILTERS)}>
            {ui("Réinitialiser")}</Button>
          <Button
            block
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            {ui("Afficher")}</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pb-2" data-testid="filter-sheet">
        <FilterGroup title="Format">
          <Chip selected={draft.format == null} onClick={() => set("format", null)}>
            {ui("Tous")}</Chip>
          {FORMAT_OPTIONS.map((o) => (
            <Chip key={o.value} selected={draft.format === o.value} onClick={() => set("format", o.value)}>
              {o.label}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup title={ui("Statut")}>
          <Chip selected={draft.status == null} onClick={() => set("status", null)}>
            {ui("Tous")}</Chip>
          {STATUS_OPTIONS.map((o) => (
            <Chip key={o.value} selected={draft.status === o.value} onClick={() => set("status", o.value)}>
              {o.label}
            </Chip>
          ))}
        </FilterGroup>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-soft">{ui("Saison")}</span>
            <select value={draft.season ?? ""} onChange={(e) => set("season", (e.target.value || null) as SearchFilters["season"])} className={selectClass}>
              <option value="">{ui("Toutes")}</option>
              {SEASON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-soft">{ui("Année")}</span>
            <select value={draft.year ?? ""} onChange={(e) => set("year", e.target.value ? Number(e.target.value) : null)} className={selectClass}>
              <option value="">{ui("Toutes")}</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-soft">Genre</span>
          <select value={draft.genre ?? ""} onChange={(e) => set("genre", e.target.value || null)} className={selectClass}>
            <option value="">{ui("Tous")}</option>
            {GENRES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <FilterGroup title={ui("Trier par")}>
          {SORT_OPTIONS.map((o) => (
            <Chip key={o.value} selected={draft.sort === o.value} onClick={() => set("sort", o.value)}>
              {o.label}
            </Chip>
          ))}
        </FilterGroup>
      </div>
    </Sheet>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  useInterfaceLanguage();
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px] text-soft">{title}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}
