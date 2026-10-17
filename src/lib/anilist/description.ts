/**
 * AniList descriptions contain a small HTML subset (<br>, <i>, <b>, sometimes
 * links and entities). Instead of injecting HTML, we tokenize into plain data
 * that React renders as text — nothing from AniList ever reaches innerHTML.
 */

export interface DescriptionSegment {
  text: string;
  italic: boolean;
  bold: boolean;
}

export type DescriptionParagraph = DescriptionSegment[];

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

const TAG = /<\s*(\/?)\s*([a-z0-9]+)[^>]*>/gi;

export function parseDescription(input: string | null): DescriptionParagraph[] {
  if (!input) return [];
  // AniList writes "<br>\n" for a single line break: count it once.
  const raw = input.replace(/<br\s*\/?>[ \t]*\r?\n/gi, "<br>");
  const paragraphs: DescriptionParagraph[] = [];
  let current: DescriptionParagraph = [];
  let italic = 0;
  let bold = 0;
  let pendingBreaks = 0;

  const flushParagraph = () => {
    const trimmed = trimParagraph(current);
    if (trimmed.length) paragraphs.push(trimmed);
    current = [];
  };

  const pushText = (chunk: string) => {
    // AniList mixes literal newlines and <br>; both mean the same thing.
    const lines = chunk.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (i > 0) pendingBreaks++;
      const text = decodeEntities(line).replace(/\s+/g, " ");
      if (!text.trim()) return;
      if (pendingBreaks >= 2) flushParagraph();
      else if (pendingBreaks === 1 && current.length) current.push({ text: " ", italic: false, bold: false });
      pendingBreaks = 0;
      current.push({ text, italic: italic > 0, bold: bold > 0 });
    });
  };

  let last = 0;
  for (const match of raw.matchAll(TAG)) {
    pushText(raw.slice(last, match.index));
    last = match.index + match[0].length;
    const closing = match[1] === "/";
    const name = (match[2] ?? "").toLowerCase();
    if (name === "br") pendingBreaks++;
    else if (name === "p" && closing) pendingBreaks += 2;
    else if (name === "i" || name === "em") italic = Math.max(0, italic + (closing ? -1 : 1));
    else if (name === "b" || name === "strong") bold = Math.max(0, bold + (closing ? -1 : 1));
    // Every other tag (a, span, img…) is dropped; its inner text is kept.
  }
  pushText(raw.slice(last));
  flushParagraph();

  return paragraphs;
}

function trimParagraph(p: DescriptionParagraph): DescriptionParagraph {
  const out = p.map((s) => ({ ...s }));
  while (out.length && !out[0]!.text.trim()) out.shift();
  while (out.length && !out[out.length - 1]!.text.trim()) out.pop();
  if (out.length) {
    out[0]!.text = out[0]!.text.trimStart();
    out[out.length - 1]!.text = out[out.length - 1]!.text.trimEnd();
  }
  return out;
}

export function descriptionLength(paragraphs: DescriptionParagraph[]): number {
  return paragraphs.reduce((n, p) => n + p.reduce((m, s) => m + s.text.length, 0), 0);
}
