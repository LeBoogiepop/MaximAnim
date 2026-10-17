import { SEASON_CATALOGUE } from "@/config/app";
import { SEASONS, type SeasonSelection } from "@/lib/anilist/seasons";
import { SOURCE_LABELS } from "@/lib/utils/format";
import type { MediaSource } from "@/types/anime";

export function parseScheduleUrl(search: string, current: SeasonSelection) {
  const params = new URLSearchParams(search);
  const year = Number(params.get("year"));
  const season = SEASONS.find(s => s === params.get("season"));
  const source = params.get("source");
  return {
    view: params.get("view") === "seasons" ? "seasons" as const : "week" as const,
    selection: season && Number.isInteger(year) && year >= SEASON_CATALOGUE.minYear && year <= SEASON_CATALOGUE.maxYear ? { season, year, ...(source && Object.hasOwn(SOURCE_LABELS, source) ? { source: source as MediaSource } : {}) } : current,
  };
}
export function scheduleUrlQuery(view: "week" | "seasons", selection: SeasonSelection) {
  return `?${new URLSearchParams({ view, season: selection.season, year: String(selection.year), ...(selection.source ? { source: selection.source } : {}) })}`;
}
