import { interfaceLanguage } from "./language";

/**
 * FR/EN messages of the entity pages (anime relations, studios, persons, credits). Kept apart from `messages.ts` so that
 * parallel work does not collide; read through `et()`, same placeholders (`{0}`) as `ui()`. External content never enters here.
 */
export const entityMessages = {
  "En diffusion": { fr: "En diffusion", en: "Airing" },
  "À venir": { fr: "À venir", en: "Upcoming" },
  Film: { fr: "Film", en: "Movie" },
  "Histoire parallèle": { fr: "Histoire parallèle", en: "Side story" },
  "Version alternative": { fr: "Version alternative", en: "Alternative version" },
  "Œuvre liée": { fr: "Œuvre liée", en: "Related work" },
  "Spécial": { fr: "Spécial", en: "Special" },
  "Série": { fr: "Série", en: "Series" },
  "Saison {0}": { fr: "Saison {0}", en: "Season {0}" },
  "Suite de la saison {0}": { fr: "Suite de la saison {0}", en: "Sequel to season {0}" },
  "Choisir la partie de la série": { fr: "Choisir la partie de la série", en: "Choose a part of the series" },
  "Cet épisode": { fr: "Cet épisode", en: "This episode" },
  "Autour de la série": { fr: "Autour de la série", en: "Around the series" },
  "Histoire inédite": { fr: "Histoire inédite", en: "New story" },
  "Inédite dans l'œuvre source, franchise adaptée de {0}": { fr: "Inédite dans l'œuvre source ; franchise adaptée de {0}", en: "Not in the source work; franchise adapted from {0}" },
  "Œuvre originale": { fr: "Œuvre originale", en: "Original work" },
  "Liste": { fr: "Liste", en: "List" },
  "Grille": { fr: "Grille", en: "Grid" },
  "Participation": { fr: "Participation", en: "Credit" },
  "Ville d'origine": { fr: "Ville d'origine", en: "Hometown" },
  "Première œuvre connue": { fr: "Première œuvre connue : {0}", en: "First known work: {0}" },
  "Œuvres principales": { fr: "Œuvres principales", en: "Main works" },
} as const;

export type EntityMessageKey = keyof typeof entityMessages;

export function et(key: EntityMessageKey, ...values: unknown[]): string {
  return entityMessages[key][interfaceLanguage()].replace(/\{(\d+)\}/g, (_, i: string) => String(values[Number(i)] ?? ""));
}

/** Merged into the shared catalogue (messages.ts). */
export const messagesEntities = entityMessages;
