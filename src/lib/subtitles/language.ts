const LANGS: [RegExp, string][] = [
  [/\b(fr|fre|fra|french|français|francais|vostfr)\b/i, "fr"],
  [/\b(en|eng|english|anglais)\b/i, "en"],
  [/\b(ja|jpn|japanese|japonais)\b/i, "ja"],
  [/\b(es|spa|spanish|español)\b/i, "es"],
  [/\b(pt|por|portuguese|português)\b/i, "pt"],
  [/\b(de|ger|deu|german|deutsch)\b/i, "de"],
  [/\b(it|ita|italian|italiano)\b/i, "it"],
  [/\b(ar|ara|arabic)\b/i, "ar"],
];

/**
 * Two-letter language of a subtitle track, from its declared code first
 * ("fr", "fr-FR", "fre"), then its label ("Français", "English CC"), then its
 * file name ("eng.srt", "ep1.fr.vtt"); "und" when nothing says.
 */
export function subtitleLanguage(label: string | null | undefined, lang: string | null | undefined, url?: string): string {
  if (lang && /^[a-z]{2}(-[A-Za-z]{2})?$/i.test(lang)) return lang.slice(0, 2).toLowerCase();
  for (const [re, code] of LANGS) if ((lang && re.test(lang)) || re.test(label ?? "")) return code;
  const file = url ? (url.split(/[?#]/)[0]!.split("/").pop() ?? "") : "";
  for (const [re, code] of LANGS) if (re.test(file)) return code;
  return "und";
}
