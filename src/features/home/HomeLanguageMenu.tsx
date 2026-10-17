"use client";

import { Check } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { IconButton } from "@/components/ui/Button";
import { usePreferences } from "@/features/settings/PreferencesContext";
import { updatePreferences } from "@/lib/db/preferences";
import type { InterfaceLanguage } from "@/lib/i18n/language";

const LANGUAGES = [{ value: "fr", label: "Français" }, { value: "en", label: "English" }] as const;

export function HomeLanguageMenu() {
  const { interfaceLanguage } = usePreferences();
  const english = interfaceLanguage === "en";
  const label = english ? "Interface language" : "Langue de l’interface";
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const initialFocus = useRef(0);
  const [open, setOpen] = useState(false);
  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) root.current?.querySelector("button")?.focus();
  }, []);
  const show = (index: number) => { initialFocus.current = index; setOpen(true); };

  useLayoutEffect(() => { if (open) items.current[initialFocus.current]?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) close(false); };
    const focusOutside = (event: FocusEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) close(false); };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", focusOutside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", focusOutside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, close]);

  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    // Return to the trigger before the browser's normal Tab movement; never trap focus.
    if (event.key === "Tab") { close(true); return; }
    const current = items.current.findIndex(item => item === document.activeElement);
    const next = event.key === "ArrowDown" ? (current + 1) % LANGUAGES.length : event.key === "ArrowUp" ? (current + LANGUAGES.length - 1) % LANGUAGES.length : event.key === "Home" || event.key.toLowerCase() === "f" ? 0 : event.key === "End" || event.key.toLowerCase() === "e" ? 1 : null;
    if (next != null) { event.preventDefault(); items.current[next]?.focus(); }
  };
  const select = (language: InterfaceLanguage) => {
    if (language !== (english ? "en" : "fr")) void updatePreferences({ interfaceLanguage: language });
    close(true);
  };

  return <div ref={root} className="relative shrink-0">
    <IconButton id={id} label={`${label}: ${english ? "English" : "Français"}`} data-testid="home-language-toggle" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? `${id}-menu` : undefined} className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" onClick={() => open ? close(true) : show(english ? 1 : 0)} onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(event.key === "ArrowDown" ? 0 : 1); } }}>
      <LanguageFlag english={english} />
    </IconButton>
    {open && <div id={`${id}-menu`} role="menu" aria-labelledby={id} onKeyDown={navigate} className="absolute right-0 top-full z-50 mt-2 w-44 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface p-1 shadow-xl">
      {LANGUAGES.map((language, index) => {
        const selected = language.value === (english ? "en" : "fr");
        return <button key={language.value} ref={node => { items.current[index] = node; }} type="button" role="menuitemradio" aria-checked={selected} tabIndex={-1} onClick={() => select(language.value)} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-[15px] text-paper hover:bg-raised focus:bg-raised focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent">
          <LanguageFlag english={language.value === "en"} /><span>{language.label}</span>{selected && <Check size={16} className="ml-auto shrink-0 text-accent" aria-hidden="true" data-testid="language-selected-check" />}
        </button>;
      })}
    </div>}
  </div>;
}

/** Inline graphics keep the owner's French/Australian flags reliable on Windows too. */
function LanguageFlag({ english }: { english: boolean }) {
  if (!english) return <svg aria-hidden="true" data-language="fr" width="26" height="18" viewBox="0 0 30 20" className="rounded-sm"><path fill="#002654" d="M0 0h10v20H0z" /><path fill="#fff" d="M10 0h10v20H10z" /><path fill="#ed2939" d="M20 0h10v20H20z" /></svg>;
  const star = "0,-1 .22,-.46 .78,-.62 .49,-.11 .97,.22 .39,.33 .43,.9 0,.5 -.43,.9 -.39,.33 -.97,.22 -.49,-.11 -.78,-.62 -.22,-.46";
  return <svg aria-hidden="true" data-language="en-AU" width="26" height="18" viewBox="0 0 32 16" className="rounded-sm">
    <path fill="#012169" d="M0 0h32v16H0z" />
    <svg width="16" height="8" viewBox="0 0 16 8" overflow="hidden">
      <path stroke="#fff" strokeWidth="2" d="m0 0 16 8M16 0 0 8" /><path stroke="#c8102e" strokeWidth=".8" d="m0 0 16 8M16 0 0 8" />
      <path stroke="#fff" strokeWidth="2.7" d="M8 0v8M0 4h16" /><path stroke="#c8102e" strokeWidth="1.5" d="M8 0v8M0 4h16" />
    </svg>
    <g fill="#fff"><polygon points={star} transform="translate(8 12) scale(2.3)" /><polygon points={star} transform="translate(24 3) scale(1.15)" /><polygon points={star} transform="translate(19 7) scale(1.15)" /><polygon points={star} transform="translate(28 6) scale(1.15)" /><polygon points={star} transform="translate(24 13) scale(1.15)" /><path d="m26 8 .2.5.6.1-.4.4.1.6-.5-.3-.5.3.1-.6-.4-.4.6-.1z" /></g>
  </svg>;
}
