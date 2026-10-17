import type { StreamOption } from "@/lib/providers/types";

/**
 * Declared vertical resolution in a source label ("1080p", "FHD 1080P",
 * "Serveur B · 480p", "4K") — or null. Nothing is ever inferred from bitrate,
 * host or server name: a quality exists only when the source says so.
 */
export function parseHeight(text: string | null | undefined): number | null {
  if (!text) return null;
  // Standard heights only ("1080", "1080p", "1080P"): "4800 kbps" or "Server 2" are not qualities.
  const p = /(?<![\d.])(2160|1440|1080|720|576|540|480|360|240|144)\s?[pi]?(?![\d.]|\s?kb)/i.exec(text);
  if (p) return Number(p[1]);
  if (/\b(4k|uhd)\b/i.test(text)) return 2160;
  return null;
}

export function optionHeight(option: Pick<StreamOption, "quality" | "label" | "sources">): number | null {
  return parseHeight(option.quality) ?? parseHeight(option.label) ?? parseHeight(option.sources[0]?.quality ?? null);
}

export function heightLabel(height: number): string {
  return height >= 2160 ? "4K" : `${height}p`;
}

const CLASSES = [2160, 1440, 1080, 720, 576, 480, 360, 240] as const;
/** A frame reaches a class from this share of its 16:9 size (encoders crop a few lines, 1916×1076…). */
const CLASS_TOLERANCE = 0.9;

/**
 * Resolution class of what the <video> actually decoded. Wide cinema encodes
 * keep the width and lose lines (3840×1600, 1920×800): the class uses the
 * 16:9-equivalent height, max(height, width × 9/16), so a 3840×1600 frame is
 * UHD and never "1600p". Never from a label or a manifest.
 */
export function decodedClass(width: number, height: number): number {
  const equivalent = Math.max(height, Math.round((width * 9) / 16));
  for (const c of CLASSES) if (equivalent >= c * CLASS_TOLERANCE) return c;
  return height;
}

/** "2160p observé" material: the decoded class, e.g. "1080p" for 1920×800. */
export function decodedLabel(width: number | null | undefined, height: number): string {
  return `${decodedClass(width ?? 0, height)}p`;
}
