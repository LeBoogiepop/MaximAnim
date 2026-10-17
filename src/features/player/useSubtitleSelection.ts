"use client";



import { ui } from "@/lib/i18n/translate";
import { type RefObject, useEffect, useState } from "react";
import { TRANSLATION_ERROR_LABELS } from "@/lib/translation/types";
import { EXTERNAL_SUBTITLES } from "@/config/app";
import type { ExternalSubtitles } from "./useExternalSubtitles";
import type { SubtitleTranslation } from "./useSubtitleTranslation";
import { subtitleLanguage } from "@/lib/subtitles/language";
import { resolveSubtitle, SUBTITLE_LABELS, type SubtitleChoice } from "@/lib/subtitles/select";
import type { MenuControl, SheetChoice } from "./PlayerControls";

interface Described {
  lang: string;
  label: string;
  default: boolean;
}

function sameList(a: Described[], b: Described[]): boolean {
  return a.length === b.length && a.every((x, i) => x.lang === b[i]!.lang && x.label === b[i]!.label && x.default === b[i]!.default);
}

/**
 * Shows the preferred subtitle track and offers the CC menu. Works on the
 * element's text tracks, so it covers the source's files (our <track>s) as
 * well as subtitles carried inside an HLS manifest (Safari, hls.js).
 * Only tracks that really exist are offered: no subtitles, no CC control.
 */
export function useSubtitleSelection(videoRef: RefObject<HTMLVideoElement | null>, choice: SubtitleChoice, onChoose: (choice: SubtitleChoice) => void, translation?: SubtitleTranslation, external?: ExternalSubtitles, translatorAvailable = false): MenuControl | null {
  const [tracks, setTracks] = useState<Described[]>([]);
  const [showOthers, setShowOthers] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const list = video.textTracks;
    // No text-track API (jsdom, very old engines): no CC control rather than a fake one.
    if (typeof list?.addEventListener !== "function") return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const apply = () => {
      const all = Array.from(list).filter((t) => t.kind === "subtitles" || t.kind === "captions");
      const elements = Array.from(video.querySelectorAll("track"));
      const described = all.map((t) => ({
        lang: subtitleLanguage(t.label, t.language),
        label: t.label,
        default: elements.some((el) => el.track === t && el.dataset.sourceDefault === "1"),
      }));
      const shown = resolveSubtitle(described, choice);
      // Maximanim alone decides: at most one track is ever "showing" (the rest disabled), whatever a provider flagged.
      const enforce = () => {
        all.forEach((t, i) => {
          const mode: TextTrackMode = i === shown ? "showing" : "disabled";
          if (t.mode !== mode) t.mode = mode;
        });
        // Diagnostic: how many real text tracks are showing. If this says 1 (or 0) and two languages are visible, one of them is burned into the video.
        video.dataset.textShowing = String(all.filter((t) => t.mode === "showing").length);
      };
      enforce();
      // A browser may auto-select a flagged track just after the list changed: assert the choice once more, shortly after.
      if (all.length > 1) timers.push(setTimeout(enforce, 0), setTimeout(enforce, 300));
      setTracks((prev) => (sameList(prev, described) ? prev : described));
    };
    apply();
    // Tracks arrive late (fetched files, manifest subtitles). A choice made in
    // iOS's own fullscreen menu (`change`) is the viewer's: it is not overridden.
    list.addEventListener("addtrack", apply);
    list.addEventListener("removetrack", apply);
    return () => {
      list.removeEventListener("addtrack", apply);
      list.removeEventListener("removetrack", apply);
      timers.forEach(clearTimeout);
    };
  }, [videoRef, choice]);

  if (!tracks.length) return null;
  const has = (lang: string) => tracks.some((t) => t.lang === lang);
  // A language chosen once but absent from this episode behaves as Auto.
  const effective: SubtitleChoice = choice === "fr" || choice === "en" ? (has(choice) ? choice : "auto") : choice;
  const shown = resolveSubtitle(tracks, effective);
  const item = (key: SubtitleChoice, label: string) => ({ key, label, checked: effective === key, onSelect: () => onChoose(key) });
  const frLabel = SUBTITLE_LABELS.fr;
  // The translation action: only while no French track exists at all, and always said as what it is.
  const action = (): { key: string; label: string; checked: boolean; disabled?: boolean; onSelect: () => void } | null => {
    // Never offered as a working action while no translator backend exists: it would only fail.
    if (!translation || !translatorAvailable || has("fr") || !has("en")) return null;
    const noop = () => undefined;
    switch (translation.status) {
      case "idle":
        return { key: "translate", label: ui("Traduire en français"), checked: false, onSelect: () => (translation.request(), onChoose("fr")) };
      case "checking":
      case "translating":
        return { key: "translate", label: "Traduction…", checked: false, disabled: true, onSelect: noop };
      case "failed": {
        const error = translation.error ?? "upstream";
        const final = error === "not_configured" || error === "needs_account";
        return { key: "translate", label: final ? TRANSLATION_ERROR_LABELS[error] : ui("{0} Réessayer", TRANSLATION_ERROR_LABELS[error]), checked: false, disabled: final, onSelect: final ? noop : () => translation.request() };
      }
      default:
        return null;
    }
  };
  const translate = action();

  // External French files: the active one is the French track the element actually shows.
  const externalShown = !!external?.track && shown >= 0 && tracks[shown]?.label === external.track.label;
  const hasOthers = !!external && external.options.length > 0 && (external.options.length > 1 || !external.track);
  const signed = (seconds: number) => `${seconds > 0 ? "+" : seconds < 0 ? "−" : ""}${Math.abs(seconds).toFixed(1).replace(".", ",")} s`;
  const step = EXTERNAL_SUBTITLES.offsetStepSeconds;
  const extras: NonNullable<MenuControl["extras"]> = [];
  if (external && hasOthers && showOthers) {
    extras.push({
      title: ui("Autres sous-titres"),
      items: external.options.map((o) => ({
        key: o.key,
        label: o.label,
        checked: o.key === external.selectedKey,
        onSelect: () => {
          external.select(o.key);
          onChoose("fr");
        },
      })),
    });
  }
  if (external && externalShown) {
    extras.push({
      title: ui("Décalage {0}{1}", signed(external.offset), external.aligned ? " (calé sur l'anglais)" : ""),
      items: [
        { key: "offset-earlier", label: ui("{0} (plus tôt)", signed(-step)), checked: false, keepOpen: true, onSelect: () => external.adjust(-step) },
        { key: "offset-later", label: `${signed(step)} (plus tard)`, checked: false, keepOpen: true, onSelect: () => external.adjust(step) },
        { key: "offset-reset", label: ui("Réinitialiser"), checked: false, disabled: external.offset === 0, keepOpen: true, onSelect: () => external.resetOffset() },
      ],
    });
  }
  // The phone sheet: the same choices, in sections. The checked language is the one actually shown.
  const shownLang = shown >= 0 ? tracks[shown]!.lang : null;
  const languages: SheetChoice[] = [
    ...(has("fr") ? [{ key: "fr", label: frLabel, checked: shownLang === "fr", onSelect: () => onChoose("fr") }] : []),
    ...(has("en") ? [{ key: "en", label: SUBTITLE_LABELS.en, checked: shownLang === "en", onSelect: () => onChoose("en") }] : []),
    ...(translate ? [{ key: "translate", label: translate.label, checked: false, disabled: translate.disabled, onSelect: translate.onSelect }] : []),
    ...(effective !== "auto" && effective !== "off" ? [{ key: "auto", label: ui("Automatique"), checked: false, onSelect: () => onChoose("auto") }] : []),
    { key: "off", label: ui("Désactivés"), checked: shown < 0, onSelect: () => onChoose("off") },
  ];
  const sheetOthers = external && hasOthers ? { count: external.options.length, items: external.options.map((o) => ({ key: o.key, label: o.label, checked: o.key === external.selectedKey && externalShown, onSelect: () => (external.select(o.key), onChoose("fr")) })) } : null;
  const sheetSync =
    external && externalShown
      ? { offsetLabel: signed(external.offset), note: external.aligned ? ui("calé sur l'anglais") : null, canReset: external.offset !== 0, earlierLabel: signed(-step), laterLabel: signed(step), earlier: () => external.adjust(-step), later: () => external.adjust(step), reset: () => external.resetOffset() }
      : null;
  return {
    sheet: { languages, sync: sheetSync, others: sheetOthers },
    label: effective === "auto" ? "Auto" : effective === "off" ? ui("Désactivés") : effective === "fr" ? frLabel : SUBTITLE_LABELS[effective],
    active: shown >= 0,
    items: [
      item("auto", ui("Automatique")),
      ...(has("fr") ? [item("fr", frLabel)] : []),
      ...(has("en") ? [item("en", SUBTITLE_LABELS.en)] : []),
      ...(translate ? [translate] : []),
      ...(hasOthers ? [{ key: "others", label: ui("Autres sous-titres…"), checked: showOthers, keepOpen: true, onSelect: () => setShowOthers((v) => !v) }] : []),
      item("off", ui("Désactivés")),
    ],
    ...(extras.length ? { extras } : {}),
  };
}
