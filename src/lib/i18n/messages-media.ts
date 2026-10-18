/** Application-owned FR/EN messages for the "media" workstream. Merged into `messages`; same rules as messages.ts. */
export const messagesMedia = {
  "La vidéo est momentanément indisponible.": { fr: "La vidéo est momentanément indisponible.", en: "The video is temporarily unavailable." },
  "Préparation de la vidéo": { fr: "Préparation de la vidéo", en: "Preparing the video" },
  "Pour respecter les droits de diffusion, cette démonstration utilise une de mes vidéos personnelles à la place de l’épisode.": { fr: "Pour respecter les droits de diffusion, cette démonstration utilise une de mes vidéos personnelles à la place de l’épisode.", en: "For copyright reasons, this demo plays one of my own videos instead of the anime episode." },
} as const satisfies Record<string, { fr: string; en: string }>;
