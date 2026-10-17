
import { ui } from "@/lib/i18n/translate";
import { TRANSLATION } from "@/config/app";
import { cuesOf, parseVttCues, renderVttCues } from "@/lib/subtitles/vtt-cues";
import { fromSegment, hasWords, plainText, toSegment } from "./segments";
import { type SubtitleTranslator, TranslationError } from "./types";

/** A cue's text without the newlines that end it (only the file's last cue has any). */
const trimmed = (text: string) => text.replace(/\n+$/, "");

/**
 * A WebVTT file translated cue by cue. Timings, ids, settings, NOTE / STYLE / REGION blocks and the order of
 * the cues are the original's, byte for byte: only the text of each cue is replaced. Any doubt (a batch that
 * comes back with another count, an aborted request) throws: a partly translated or shifted file is never returned.
 */
export async function translateVtt(
  vtt: string,
  options: {
    translator: SubtitleTranslator;
    title?: string | null;
    signal?: AbortSignal;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<string> {
  const { translator, signal } = options;
  const parsed = parseVttCues(vtt);
  const cues = cuesOf(parsed);
  if (!cues.length) throw new TranslationError("invalid", ui("Aucune réplique à traduire."));
  if (cues.length > TRANSLATION.maxCuesPerTrack) throw new TranslationError("too_large");

  const toSend = cues.map((c, i) => i).filter((i) => hasWords(cues[i]!.text));
  const results = new Map<number, string>();
  const plain = cues.map((c) => plainText(c.text));

  const batches: number[][] = [];
  for (let i = 0; i < toSend.length; i += TRANSLATION.batchCues) batches.push(toSend.slice(i, i + TRANSLATION.batchCues));

  const contextFor = (batch: number[]): string => {
    const first = batch[0]!;
    const last = batch[batch.length - 1]!;
    const before = plain.slice(Math.max(0, first - TRANSLATION.contextCues), first);
    const after = plain.slice(last + 1, last + 1 + TRANSLATION.contextCues);
    const parts = [
      options.title ? `Anime : ${options.title}. Dialogues de sous-titres, phrases courtes.` : "Dialogues de sous-titres d'un anime, phrases courtes.",
      before.length ? ui("Répliques précédentes : {0}", before.join(" / ")) : "",
      after.length ? ui("Répliques suivantes : {0}", after.join(" / ")) : "",
    ].filter(Boolean);
    return parts.join("\n").slice(0, TRANSLATION.maxContextChars);
  };

  let done = 0;
  let next = 0;
  const worker = async () => {
    while (next < batches.length) {
      if (signal?.aborted) throw new TranslationError("network", ui("Traduction interrompue."));
      const batch = batches[next++]!;
      const out = await translator.translate({
        sourceLang: TRANSLATION.sourceLang,
        targetLang: TRANSLATION.targetLang,
        segments: batch.map((i) => toSegment(trimmed(cues[i]!.text))),
        context: contextFor(batch),
        ...(signal ? { signal } : {}),
      });
      if (out.length !== batch.length) throw new TranslationError("mismatch");
      batch.forEach((cueIndex, k) => {
        // An empty answer for one cue keeps that cue's original text: a cue is never lost.
        const text = fromSegment(out[k]!);
        if (text) results.set(cueIndex, text);
      });
      done += batch.length;
      options.onProgress?.(done, toSend.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(TRANSLATION.concurrency, batches.length) }, worker));

  // The last cue of a file carries the file's trailing newline: it stays where it was.
  const texts = cues.map((c, i) => (results.has(i) ? results.get(i)! + c.text.slice(trimmed(c.text).length) : c.text));
  const rebuilt = renderVttCues(parsed, texts);
  // Belt and braces: the rebuilt file must have exactly the original's cues.
  if (cuesOf(parseVttCues(rebuilt)).length !== cues.length) throw new TranslationError("mismatch");
  return rebuilt;
}
