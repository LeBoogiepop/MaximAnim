
import { ui } from "@/lib/i18n/translate";
/**
 * The translator seam. The player and the subtitle pipeline only know this interface: DeepL is one implementation
 * of it (server: `src/server/translation/deepl.ts`), the browser talks to it through `remote.ts`.
 */

export interface TranslateInput {
  sourceLang: string;
  targetLang: string;
  /** Text segments in the translator's markup (see `segments.ts`); the answer has exactly as many, in order. */
  segments: string[];
  /** Untranslated background that may improve consistency (title, neighbouring lines). Never billed, never returned. */
  context?: string;
  signal?: AbortSignal;
}

export interface SubtitleTranslator {
  readonly id: string;
  readonly version: string;
  translate(input: TranslateInput): Promise<string[]>;
}

/** Why a translation did not happen. The original track is never affected by any of these. */
export type TranslationErrorCode =
  "not_configured" | "needs_account" | "rate_limited" | "quota" | "timeout" | "network" | "upstream" | "invalid" | "mismatch" | "too_large";

export class TranslationError extends Error {
  constructor(
    readonly code: TranslationErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "TranslationError";
  }
}

export const TRANSLATION_ERROR_LABELS: Record<TranslationErrorCode, string> = {
  get not_configured() { return ui("Traduction non configurée"); },
  get needs_account() { return ui("Connexion requise pour traduire"); },
  get rate_limited() { return ui("Traduction momentanément saturée"); },
  get quota() { return ui("Quota de traduction atteint"); },
  get timeout() { return ui("Traduction trop lente"); },
  get network() { return ui("Traduction injoignable"); },
  get upstream() { return ui("Traduction indisponible"); },
  get invalid() { return ui("Traduction refusée"); },
  get mismatch() { return ui("Traduction incohérente, ignorée"); },
  get too_large() { return ui("Sous-titres trop longs à traduire"); },
};
