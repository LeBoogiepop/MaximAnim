import { interfaceLanguage } from "./language";

/** Discovery-area strings kept out of the shared catalogue; the coordinator may fold them into messages.ts. */
export const discoveryMessages = {
  "Saison actuelle": { fr: "Saison actuelle", en: "Current season" },
} as const;

export function disc(key: keyof typeof discoveryMessages): string {
  return discoveryMessages[key][interfaceLanguage()];
}

/** Merged into the shared catalogue (messages.ts). */
export const messagesDiscovery = discoveryMessages;
