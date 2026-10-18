/** Application-owned FR/EN messages for the "media" workstream. Merged into `messages`; same rules as messages.ts. */
export const messagesMedia = {
  "La vidéo est momentanément indisponible.": { fr: "La vidéo est momentanément indisponible.", en: "The video is temporarily unavailable." },
  "Bibliothèque locale, catalogue AniList et médias de démonstration autorisés. Aucun compte nécessaire.": { fr: "Bibliothèque locale, catalogue AniList et médias de démonstration autorisés. Aucun compte nécessaire.", en: "Local library, AniList catalogue and authorized demo media. No account needed." },
  "Avancé · Diagnostic PWA": { fr: "Avancé · Diagnostic PWA", en: "Advanced · PWA diagnostics" },
  "Catalogue et illustrations : AniList et leurs titulaires de droits. Les vidéos de cette édition sont des démonstrations autorisées, pas des épisodes d’anime.": { fr: "Catalogue et illustrations : AniList et leurs titulaires de droits. Les vidéos de cette édition sont des démonstrations autorisées, pas des épisodes d’anime.", en: "Catalogue and artwork: AniList and their respective rights holders. The videos in this edition are authorized demos, not anime episodes." },
  "Préparation de la vidéo": { fr: "Préparation de la vidéo", en: "Preparing the video" },
  "Pour respecter les droits de diffusion, cette démonstration utilise une de mes vidéos personnelles à la place de l’épisode.": { fr: "Pour respecter les droits de diffusion, cette démonstration utilise une de mes vidéos personnelles à la place de l’épisode.", en: "For copyright reasons, this demo plays one of my own videos instead of the anime episode." },
  "{0} saisons": { fr: "{0} saisons", en: "{0} seasons" },
  "{0} ou plus": { fr: "{0} ou plus", en: "{0} or more" },
  "Saison {0}, partie {1}": { fr: "Saison {0}, partie {1}", en: "Season {0}, part {1}" },
  "En publication": { fr: "En publication", en: "Publishing" },
} as const satisfies Record<string, { fr: string; en: string }>;
