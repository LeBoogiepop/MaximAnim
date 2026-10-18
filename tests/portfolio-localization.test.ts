import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { messages } from "../src/lib/i18n/messages";
import { messagesMedia } from "../src/lib/i18n/messages-media";
import { setInterfaceLanguage } from "../src/lib/i18n/language";
import { translate } from "../src/lib/i18n/translate";
import { SMART_VIEW_LABELS } from "../src/lib/library/views";

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

afterEach(() => setInterfaceLanguage("fr"));

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
    expect([SMART_VIEW_LABELS.continue, SMART_VIEW_LABELS.completed, SMART_VIEW_LABELS.abandoned]).toEqual(["À continuer", "Terminés", "Abandonnés"]);
    setInterfaceLanguage("en");
    expect(SMART_VIEW_LABELS.continue).toBe("Continue watching");
    expect(SMART_VIEW_LABELS.completed).toBe("Completed");
    expect(SMART_VIEW_LABELS.abandoned).toBe("Dropped");
  });
});
