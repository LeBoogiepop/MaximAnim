/**
 * A WebVTT file as blocks, so text can be replaced while everything else (header, NOTE / STYLE / REGION blocks,
 * cue ids, timings and their settings, blank-line separators) is kept byte for byte. Used by the translation
 * pipeline; nothing here touches the DOM.
 */

export type VttBlock = { kind: "raw"; text: string } | { kind: "cue"; head: string[]; text: string };

export interface ParsedVtt {
  blocks: VttBlock[];
}

/** Cue blocks in file order. */
export function cuesOf(parsed: ParsedVtt): Extract<VttBlock, { kind: "cue" }>[] {
  return parsed.blocks.filter((b): b is Extract<VttBlock, { kind: "cue" }> => b.kind === "cue");
}

export function parseVttCues(vtt: string): ParsedVtt {
  const blocks: VttBlock[] = vtt.split(/(\n{2,})/).map((block): VttBlock => {
    if (/^\n+$/.test(block) || /^\s*(?:WEBVTT|NOTE|STYLE|REGION)(?:\s|$)/.test(block)) return { kind: "raw", text: block };
    const lines = block.split("\n");
    const at = lines.findIndex((l) => l.includes("-->"));
    // The timing line is the first or (after an id) the second line of a cue block.
    if (at < 0 || at > 1) return { kind: "raw", text: block };
    return {
      kind: "cue",
      head: lines.slice(0, at + 1),
      text: lines.slice(at + 1).join("\n"),
    };
  });
  return { blocks };
}

/** The file again, cue texts replaced in order by `texts` (one per cue block). */
export function renderVttCues(parsed: ParsedVtt, texts: readonly string[]): string {
  let i = 0;
  return parsed.blocks
    .map((b) => {
      if (b.kind === "raw") return b.text;
      const text = texts[i++];
      if (text == null) throw new Error("renderVttCues: fewer texts than cues");
      return [...b.head, text].join("\n");
    })
    .join("");
}

/** Timing lines (identifier line excluded), used to prove a rebuilt file keeps every timing untouched. */
export function timingsOf(vtt: string): string[] {
  return cuesOf(parseVttCues(vtt)).map((c) => c.head[c.head.length - 1]!);
}
