/**
 * Subtitle files as sources hand them out (WebVTT, SubRip, ASS/SSA) turned
 * into the only format <track> renders: WebVTT. Text only — styling beyond
 * <i>/<b>/<u> is dropped, never interpreted — and nothing here touches the DOM.
 */

export type SubtitleFormat = "vtt" | "srt" | "ass";

const SRT_TIMING = /^\s*(\d{1,2}:)?\d{1,2}:\d{2}[,.]\d{1,3}\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}[,.]\d{1,3}/m;

function clean(text: string): string {
  return text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

export function detectSubtitleFormat(raw: string): SubtitleFormat | null {
  const text = clean(raw).trimStart();
  if (/^WEBVTT(\s|$)/.test(text)) return "vtt";
  if (/^\[(Script Info|V4\+? Styles|Events)\]/im.test(text) && /^Dialogue:/m.test(text)) return "ass";
  if (SRT_TIMING.test(text)) return "srt";
  return null;
}

/** "1:02:03,4" / "02:03.456" → "01:02:03.400" / "00:02:03.456". */
function vttTime(value: string): string | null {
  const m = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})[,.](\d{1,3})$/.exec(value.trim());
  if (!m) return null;
  const [, h = "0", min, s, frac] = m;
  return `${h.padStart(2, "0")}:${min!.padStart(2, "0")}:${s}.${frac!.padEnd(3, "0")}`;
}

/** Cue text safe for WebVTT: only <i>, <b>, <u> survive; everything else is plain text. */
function cueText(text: string): string {
  return text
    .replace(/\{\\[^}]*\}/g, "")
    .replace(/<(\/?)([ibu])(?:\s[^>]*)?>/gi, "\u0000$1$2\u0001")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?!(amp|lt|gt|nbsp|lrm|rlm);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\u0000(\/?)([ibu])\u0001/gi, (_, slash: string, tag: string) => `<${slash}${tag.toLowerCase()}>`)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

interface Cue {
  start: string;
  end: string;
  text: string;
}

function render(cues: Cue[]): string | null {
  const usable = cues.filter((c) => c.text && c.start < c.end);
  if (!usable.length) return null;
  return `WEBVTT\n\n${usable.map((c) => `${c.start} --> ${c.end}\n${c.text}`).join("\n\n")}\n`;
}

function fromSrt(text: string): string | null {
  const cues: Cue[] = [];
  for (const block of text.split(/\n{2,}/)) {
    const lines = block.split("\n");
    const at = lines.findIndex((l) => l.includes("-->"));
    if (at < 0) continue;
    const [from, to] = lines[at]!.split("-->");
    const start = vttTime(from ?? "");
    // Anything after the end time (SRT position hints) is dropped.
    const end = vttTime((to ?? "").trim().split(/\s+/)[0] ?? "");
    if (!start || !end) continue;
    cues.push({ start, end, text: cueText(lines.slice(at + 1).join("\n")) });
  }
  return render(cues);
}

/** "0:01:02.34" (centiseconds) → "00:01:02.340". */
function assTime(value: string): string | null {
  const m = /^(\d+):(\d{2}):(\d{2})\.(\d{1,3})$/.exec(value.trim());
  if (!m) return null;
  return `${m[1]!.padStart(2, "0")}:${m[2]}:${m[3]}.${m[4]!.padEnd(3, "0")}`;
}

function fromAss(text: string): string | null {
  let inEvents = false;
  let fields: string[] = ["layer", "start", "end", "style", "name", "marginl", "marginr", "marginv", "effect", "text"];
  const cues: Cue[] = [];
  for (const line of text.split("\n")) {
    const section = /^\s*\[([^\]]+)\]\s*$/.exec(line);
    if (section) {
      inEvents = section[1]!.trim().toLowerCase() === "events";
      continue;
    }
    if (!inEvents) continue;
    if (/^Format:/i.test(line)) {
      fields = line.slice(line.indexOf(":") + 1).split(",").map((f) => f.trim().toLowerCase());
      continue;
    }
    if (!/^Dialogue:/i.test(line)) continue;
    // The text is the last field and may itself contain commas.
    const parts = line.slice(line.indexOf(":") + 1).split(",");
    const values = [...parts.slice(0, fields.length - 1), parts.slice(fields.length - 1).join(",")];
    const get = (name: string) => values[fields.indexOf(name)] ?? "";
    const raw = get("text");
    // Vector drawings ({\p1}) are shapes, not words.
    if (/\{[^}]*\\p[1-9]/.test(raw)) continue;
    const start = assTime(get("start"));
    const end = assTime(get("end"));
    if (!start || !end) continue;
    cues.push({ start, end, text: cueText(raw.replace(/\\N/gi, "\n").replace(/\\h/g, " ")) });
  }
  cues.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  return render(cues);
}

const CUE_TIMING = /^(\s*(?:\d+:)?\d{2}:\d{2}\.\d{3}\s+-->\s+(?:\d+:)?\d{2}:\d{2}\.\d{3})([^\n]*)$/;
const OWN_PLACEMENT = /(?:^|\s)(?:line|region|vertical):/;

/**
 * Places ordinary cues: appends `line:<line>` (e.g. `91%,end`) to every cue timing that carries no placement of its own. A cue with an
 * explicit `line:` (or a `region:` / `vertical:`, where `line` would mean something else) is returned untouched,
 * and so are timestamps, ids, text, NOTE / STYLE / REGION blocks. Native <track> rendering does the rest: no TextTrack
 * is rebuilt in JavaScript and nothing is drawn over the video.
 */
export function raiseCues(vtt: string, line: number | string): string {
  return vtt
    .split(/(\n{2,})/)
    .map((block) => {
      // Separators (the blank lines between blocks) are kept verbatim, like the header and NOTE / STYLE / REGION blocks.
      if (/^\n+$/.test(block) || /^\s*(?:WEBVTT|NOTE|STYLE|REGION)(?:\s|$)/.test(block)) return block;
      const lines = block.split("\n");
      const at = lines.findIndex((l) => l.includes("-->"));
      // The timing line is the first or (after an id) the second line of a cue block.
      if (at < 0 || at > 1) return block;
      const timing = CUE_TIMING.exec(lines[at]!);
      if (!timing || OWN_PLACEMENT.test(timing[2]!)) return block;
      lines[at] = timing[1] + timing[2]!.trimEnd() + " line:" + line;
      return lines.join("\n");
    })
    .join("");
}

/** WebVTT for `raw`, or null when it is not a subtitle file Maximanim can read. */
export function toWebVtt(raw: string): string | null {
  const text = clean(raw);
  switch (detectSubtitleFormat(text)) {
    case "vtt":
      return text;
    case "srt":
      return fromSrt(text);
    case "ass":
      return fromAss(text);
    default:
      return null;
  }
}
