import { ui } from "@/lib/i18n/translate";
import type { QualityControl } from "./PlayerControls";
import { decodedLabel } from "@/lib/sources/quality";
import type { PlaybackStrategy, QualityLevel } from "./useVideoSource";

/**
 * The browser owns adaptation, so the only honest thing to add to "Auto" is
 * what it actually decoded: "Auto · 1080p observé". Nothing known yet: "Auto".
 * Never a declared quality, never a menu nobody can drive.
 */
export function autoQualityLabel(observed: { width: number; height: number } | null): string {
  return observed && observed.height > 0 ? ui("Auto · {0} observé", decodedLabel(observed.width, observed.height)) : "Auto";
}

/**
 * What the player may honestly show as "Qualité":
 * 1. the source's own separate streams of different resolutions (Maximanim switches them);
 * 2. else hls.js levels (Maximanim pins them);
 * 3. else, for adaptive HLS the browser drives by itself (Safari native HLS), a plain "Auto";
 * 4. else the resolution the source declared for its single file, as a label.
 * Never a menu of qualities nobody can actually select.
 */
export function playerQuality(input: {
  sourceOptions: QualityControl | null;
  strategy: PlaybackStrategy | null;
  levels: QualityLevel[];
  selectedLevel: number;
  onLevel: (index: number) => void;
  declaredHeight: number | null;
  /** What the <video> has really decoded so far (videoWidth × videoHeight), if anything yet. */
  observed?: { width: number; height: number } | null;
}): QualityControl | null {
  if (input.sourceOptions) return input.sourceOptions;
  if (input.levels.length > 1) {
    const selected = input.levels.find((l) => l.index === input.selectedLevel);
    return {
      label: input.selectedLevel === -1 ? "Auto" : (selected?.label ?? "Auto"),
      items: [{ index: -1, label: "Auto" }, ...input.levels].map((l) => ({ key: String(l.index), label: l.label, checked: l.index === input.selectedLevel, onSelect: () => input.onLevel(l.index) })),
    };
  }
  if (input.strategy === "native-hls" || input.strategy === "hls.js") return { label: autoQualityLabel(input.observed ?? null), items: null };
  return input.declaredHeight ? { label: `${input.declaredHeight}p`, items: null } : null;
}
