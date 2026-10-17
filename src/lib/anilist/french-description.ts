import { TRANSLATION } from "@/config/app";
import { fromSegment, toSegment } from "@/lib/translation/segments";
import { TranslationError, type SubtitleTranslator } from "@/lib/translation/types";
import { parseDescription } from "./description";

/** Translate the actual sourced paragraphs, never summarize, truncate or invent plot details. */
export async function translateDescription(raw: string, translator: SubtitleTranslator, signal?: AbortSignal): Promise<string> {
  const segments = parseDescription(raw).map(p => toSegment(p.map(s => s.text).join("")));
  if (!segments.length || segments.length > TRANSLATION.maxSegments || segments.some(s => s.length > TRANSLATION.maxSegmentChars) || segments.reduce((n, s) => n + s.length, 0) > TRANSLATION.maxRequestChars) throw new TranslationError("too_large");
  const translated = await translator.translate({ sourceLang: TRANSLATION.sourceLang, targetLang: TRANSLATION.targetLang, segments, signal });
  if (translated.length !== segments.length) throw new TranslationError("mismatch");
  const clean = translated.map(fromSegment);
  if (clean.some(s => !s)) throw new TranslationError("mismatch");
  return clean.join("\n\n");
}
