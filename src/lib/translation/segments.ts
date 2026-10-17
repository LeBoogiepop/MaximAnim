/**
 * Cue text ⇄ the markup handed to the translator.
 *
 * A cue's text is WebVTT-safe text (see `lib/subtitles/convert.ts`): plain text with the entities `&amp; &lt; &gt;
 * &nbsp;` and the tags `<i> <b> <u>`, lines separated by a newline. The translator gets it as XML with
 * `tag_handling: xml`: entities decoded then XML-escaped, the tags kept as elements, line breaks as `<br/>`.
 * Coming back, only those four elements survive; every other tag is dropped, text is unescaped and re-escaped as
 * WebVTT. A cue whose tags are unbalanced goes out without them rather than as broken XML.
 */

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  lrm: "",
  rlm: "",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
    if (name[0] === "#") {
      const code = name[1] === "x" || name[1] === "X" ? Number.parseInt(name.slice(2), 16) : Number.parseInt(name.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : "";
    }
    return NAMED[name.toLowerCase()] ?? whole;
  });
}

const xmlEscape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const vttEscape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;");

const TAG = /<(\/?)([ibu])>/gi;

function balanced(text: string): boolean {
  const stack: string[] = [];
  for (const m of text.matchAll(TAG)) {
    const tag = m[2]!.toLowerCase();
    if (m[1]) {
      if (stack.pop() !== tag) return false;
    } else stack.push(tag);
  }
  return stack.length === 0;
}

/** True when a cue has something to translate (a lone "♪" or "..." is kept as is and not billed). */
export function hasWords(cueText: string): boolean {
  return /\p{L}/u.test(cueText.replace(TAG, ""));
}

/** Cue text → translator markup. */
export function toSegment(cueText: string): string {
  const keepTags = balanced(cueText);
  const pieces = cueText.split(/(<\/?[ibu]>)/i);
  return pieces
    .map((piece, i) => {
      if (i % 2 === 1) return keepTags ? piece.toLowerCase() : "";
      return piece
        .split("\n")
        .map((line) => xmlEscape(decodeEntities(line)))
        .join("<br/>");
    })
    .join("");
}

/** The same text without markup, for context. */
export function plainText(cueText: string): string {
  return decodeEntities(cueText.replace(TAG, ""))
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

/** Translator markup → cue text, or null when nothing usable came back. */
export function fromSegment(segment: string): string | null {
  const pieces = segment.split(/(<\/?(?:i|b|u)>|<br\s*\/?>|<\/br>|<[^>]*>)/i);
  const out = pieces
    .map((piece, i) => {
      if (i % 2 === 0) return vttEscape(decodeEntities(piece)).replace(/\r?\n/g, " ");
      const tag = /^<(\/?)([ibu])>$/i.exec(piece);
      if (tag) return `<${tag[1]}${tag[2]!.toLowerCase()}>`;
      return /^<br/i.test(piece) ? "\n" : "";
    })
    .join("");
  const text = (balanced(out) ? out : out.replace(TAG, ""))
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
  return text.replace(TAG, "").trim() ? text : null;
}
