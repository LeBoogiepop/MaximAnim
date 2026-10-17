

import { ui } from "@/lib/i18n/translate";
import type { MediaSource, RelationType, SourceWorkRef } from "@/types/anime";

/** Verified, deliberately narrow editorial facts. Evidence and entry ids: docs/RC10_BATCH_B.md.
 * An individual film's ORIGINAL source remains distinct from its franchise's visual novel.
 */
export interface SourceFoundation { source: MediaSource; title: string; href: string; creators?: string }
// Original game storefront and publisher confirmation: RC10_FINAL_HANDOFF.md, RC10.1 evidence.
const STEINS: SourceFoundation = { source: "VISUAL_NOVEL", title: "Steins;Gate", href: "https://store.steampowered.com/app/412830/STEINSGATE/", creators: "5pb. / Nitroplus" };
const STEINS_ZERO: SourceFoundation = { source: "VISUAL_NOVEL", title: "Steins;Gate 0", href: "https://www.spike-chunsoft.com/games/steinsgate-0/" };
const MONOGATARI: SourceFoundation = { source: "LIGHT_NOVEL", title: "Monogatari", href: "https://kodansha.us/book/monogatari/bakemonogatari-part-1/" };
const STEINS_IDS = new Set([9253, 21127, 21624, 10863, 11577, 104174, 20907]);
export const isSteinsEntry = (id: number) => STEINS_IDS.has(id);

export function foundationOf(ids: readonly number[]): SourceFoundation | null {
  if (ids.length === 1 && ids[0] === 21127) return STEINS_ZERO;
  if (ids.some(id => STEINS_IDS.has(id))) return STEINS;
  if (ids.includes(5081)) return MONOGATARI;
  return null;
}

/** Repair only independently verified entry facts, including old cached detail. Never infer from an adaptation edge. */
export function entrySource(id: number, source: MediaSource | null): MediaSource | null {
  if (id === 5081) return "LIGHT_NOVEL";
  if (id === 9253 || id === 21127) return "VISUAL_NOVEL";
  return source;
}

/** An old cache may have chosen an alternative manga as its source. Drop that incorrect link,
 * keeping the verified publisher fallback; never manufacture a replacement AniList work. */
export function entrySourceWork(id: number, work: SourceWorkRef | null): SourceWorkRef | null {
  if (id === 9253 || id === 21127) return null; // AniList's manga/novel work model cannot represent the original VN.
  if (id === 5081 && (work?.format === "MANGA" || work?.format === "ONE_SHOT")) return null;
  return work;
}

/** Walk this documented alternate branch only, not arbitrary alternative adaptations/reboots. */
export function isAlternateBridge(from: number, to: number, type: RelationType): boolean {
  return type === "ALTERNATIVE" && ((from === 9253 && to === 21624) || (from === 21624 && to === 9253));
}

export function relationLabel(type: RelationType | null | undefined, to: number, from?: number): string | null {
  if (to === 21127 && (from === 21624 || from === 9253)) return ui("Suite alternative");
  if (to === 21624 && from === 9253) return ui("Épisode 23β · branche alternative");
  const labels: Record<RelationType, string> = { PREQUEL: ui("Préquelle"), SEQUEL: ui("Suite"), PARENT: ui("Œuvre d'origine"), SIDE_STORY: ui("Histoire parallèle"), SPIN_OFF: "Spin-off", ALTERNATIVE: ui("Version alternative"), SUMMARY: ui("Résumé"), COMPILATION: "Compilation", OTHER: ui("Œuvre liée") };
  return type ? labels[type] : null;
}

/** These company credits are not individual authors. Unknown AniList staff stay unclassified. */
export function isOrganization(name: string): boolean {
  return /^(nitroplus|nitro\+|mages\.?|5pb\.?)$/i.test(name.trim());
}
