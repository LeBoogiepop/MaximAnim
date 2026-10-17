import { TranslationError, type SubtitleTranslator } from "./types";
export const TRANSLATE_ENDPOINT = "";
export function createRemoteTranslator(): SubtitleTranslator { return { id: "unavailable", version: "0", async translate() { throw new TranslationError("not_configured", "Translation is unavailable in the portfolio edition"); } }; }
