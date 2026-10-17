import { ui } from "@/lib/i18n/translate";
import { availabilityDay, type EpisodeAvailability } from "@/lib/airing/availability";

/** A non-interactive row shared by the full fiche list and the player's picker. */
export function UnavailableEpisode({ number, availability }: { number: number; availability: EpisodeAvailability }) {
  return <div className="flex h-full min-w-0 flex-1 flex-col justify-center gap-1 px-3 text-soft" data-testid="episode-row" data-episode={number} data-upcoming={availability.kind === "future"} aria-disabled="true">
    <span className="text-[15px] font-semibold">{ui("Épisode {0}", number)}</span>
    <span className="text-[13px] text-muted">{availability.kind === "future"
      ? availability.airingAt != null ? ui("Disponible le {0}", availabilityDay(availability.airingAt)) : ui("Pas encore disponible")
      : ui("Vérifie la saison ou la partie sur la fiche de l'anime.")}</span>
  </div>;
}
