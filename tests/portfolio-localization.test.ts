import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { messages } from "../src/lib/i18n/messages";
import { messagesMedia } from "../src/lib/i18n/messages-media";
import { DEFAULT_LANGUAGE, setInterfaceLanguage } from "../src/lib/i18n/language";
import { translate } from "../src/lib/i18n/translate";
import { SMART_VIEW_LABELS } from "../src/lib/library/views";
import { franchiseHeader, seasonLabel } from "../src/lib/franchise/label";
import { rowStatus } from "../src/lib/utils/facts";
import type { Franchise } from "../src/types/anime";

// Screens that only exist in the public edition. Their wording must come from the shared FR/EN catalogue.
const SCREENS = [
  "src/features/player/WatchScreen.tsx",
  "src/features/settings/SettingsScreen.tsx",
  "src/features/settings/ArtworkCredits.tsx",
  "src/features/episodes/EpisodesScreen.tsx",
];
const UI_CALL = /\bui\("((?:[^"\\]|\\.)*)"[^)]*\)/g;
const source = (file: string) => readFileSync(file, "utf8");
const keysIn = (file: string) => [...source(file).matchAll(UI_CALL)].map(match => match[1]);

afterEach(() => setInterfaceLanguage(DEFAULT_LANGUAGE));

describe("public screens use the interface language", () => {
  it.each(SCREENS)("%s has no hard-coded French outside ui()", file => {
    // "Français" is the language's own name in the language picker: it never translates.
    const stripped = source(file).replace(UI_CALL, "").replace(/\/\/.*$/gm, "").replaceAll("Français", "");
    expect(stripped.match(/[àâçéèêëîïôùûüÀÉÈ]/g) ?? []).toEqual([]);
    expect(stripped).not.toMatch(/\b(Préc|Suiv|Réessayer|Chargement|Épisode|droits de diffusion)\b/);
  });

  it.each(SCREENS)("%s only asks for catalogue entries that exist, translated", file => {
    for (const key of keysIn(file)) {
      expect(messages, key).toHaveProperty([key]);
      const entry = messages[key as keyof typeof messages];
      expect(entry.fr, key).toBe(key);
      expect(entry.en.trim(), key).not.toBe("");
    }
  });

  it("never ships a public-edition entry whose English is still the French text", () => {
    for (const [key, entry] of Object.entries(messagesMedia)) expect(entry.en, key).not.toBe(entry.fr);
  });
});

describe("watch screen wording", () => {
  const rights = "Pour respecter les droits de diffusion, cette démonstration utilise une de mes vidéos personnelles à la place de l’épisode.";
  it("keeps the French copy and gives the English one", () => {
    expect(translate(rights as keyof typeof messages, [], "fr")).toBe(rights);
    expect(translate(rights as keyof typeof messages, [], "en")).toBe("For copyright reasons, this demo plays one of my own videos instead of the anime episode.");
  });

  it.each([
    ["Épisode {0}", [3], "Épisode 3", "Episode 3"],
    ["Préc.", [], "Préc.", "Prev."],
    ["Suiv.", [], "Suiv.", "Next"],
    ["Réessayer", [], "Réessayer", "Try again"],
    ["Épisode précédent", [], "Épisode précédent", "Previous episode"],
    ["Épisode suivant", [], "Épisode suivant", "Next episode"],
    ["Navigation des épisodes", [], "Navigation des épisodes", "Episode navigation"],
    ["La vidéo est momentanément indisponible.", [], "La vidéo est momentanément indisponible.", "The video is temporarily unavailable."],
    ["Préparation de la vidéo", [], "Préparation de la vidéo", "Preparing the video"],
  ] as const)("%s", (key, values, fr, en) => {
    expect(translate(key as keyof typeof messages, values, "fr")).toBe(fr);
    expect(translate(key as keyof typeof messages, values, "en")).toBe(en);
  });
});

describe("library smart views", () => {
  it("follow the interface language at render time", () => {
    setInterfaceLanguage("fr");
    expect([SMART_VIEW_LABELS.continue, SMART_VIEW_LABELS.completed, SMART_VIEW_LABELS.abandoned]).toEqual(["À continuer", "Terminés", "Abandonnés"]);
    setInterfaceLanguage("en");
    expect(SMART_VIEW_LABELS.continue).toBe("Continue watching");
    expect(SMART_VIEW_LABELS.completed).toBe("Completed");
    expect(SMART_VIEW_LABELS.abandoned).toBe("Dropped");
  });
});

describe("franchise page wording", () => {
  const member = (season: number, status: string, from: number, to?: number) => ({ season, part: null, entry: { status, startDate: { year: from }, endDate: to ? { year: to } : null, seasonYear: from } });
  const franchise = (main: unknown[], extra: Partial<Franchise> = {}) => ({ main, others: [], continuous: false, truncated: false, ...extra }) as unknown as Franchise;
  const finished = franchise([member(1, "FINISHED", 2023, 2024), member(2, "FINISHED", 2024, 2026), member(3, "NOT_YET_RELEASED", 2027)]);
  const airing = franchise([member(1, "FINISHED", 2023, 2024), member(2, "RELEASING", 2025)]);

  it("reads in French by default of the catalogue", () => {
    setInterfaceLanguage("fr");
    expect(franchiseHeader(finished)).toMatchObject({ count: "2 saisons", period: "2023 à 2026", state: "Suite annoncée", stateKey: "sequel" });
    expect(franchiseHeader(airing)).toMatchObject({ period: "2023 à aujourd'hui", state: "En diffusion", stateKey: "airing" });
    expect(seasonLabel({ season: 2, part: 1 })).toBe("Saison 2, partie 1");
  });

  it("reads in English with no French left", () => {
    setInterfaceLanguage("en");
    expect(franchiseHeader(finished)).toMatchObject({ count: "2 seasons", period: "2023 to 2026", state: "Sequel announced", stateKey: "sequel" });
    expect(franchiseHeader(airing)).toMatchObject({ period: "2023 to today", state: "Airing" });
    expect(franchiseHeader(franchise([member(1, "FINISHED", 2020, 2020)])).count).toBe("One season");
    expect(franchiseHeader(franchise([member(1, "FINISHED", 2020, 2021), member(2, "FINISHED", 2022, 2023)], { truncated: true })).count).toBe("2 seasons or more");
    expect(seasonLabel({ season: 2, part: 1 })).toBe("Season 2, part 1");
    expect(seasonLabel({ season: 3, part: null })).toBe("Season 3");
  });

  it("calls an airing anime « Airing », never the default list name « Watching »", () => {
    setInterfaceLanguage("en");
    expect(rowStatus("RELEASING")?.label).toBe("Airing");
  });
});
