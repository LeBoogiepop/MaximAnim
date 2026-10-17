
import { ui } from "@/lib/i18n/translate";
/**
 * AniList's genres and tags are English. Genres have a fixed, short list: all said in French. Tags are a few hundred:
 * only the commonly met ones are translated, and a tag without a French word is simply left out — the page never shows raw
 * English where a viewer expects French, and never invents a translation.
 */

const GENRE_FR: Record<string, string> = {
  Action: "Action",
  get Adventure() { return ui("Aventure"); },
  get Comedy() { return ui("Comédie"); },
  get Drama() { return ui("Drame"); },
  Ecchi: "Ecchi",
  Fantasy: "Fantasy",
  get Horror() { return ui("Horreur"); },
  "Mahou Shoujo": "Magical girl",
  Mecha: "Mecha",
  get Music() { return ui("Musique"); },
  get Mystery() { return ui("Mystère"); },
  get Psychological() { return ui("Psychologique"); },
  Romance: "Romance",
  "Sci-Fi": "Science-fiction",
  get "Slice of Life"() { return ui("Tranche de vie"); },
  Sports: "Sport",
  get Supernatural() { return ui("Surnaturel"); },
  Thriller: "Thriller",
};

/** The genres a search can filter on (the adult one is left out: search never returns adult titles). */
export const GENRES: { value: string; label: string }[] = Object.entries(GENRE_FR)
  .filter(([value]) => value !== "Ecchi")
  .map(([value, label]) => ({ value, label }));

/** A genre in French; an unknown one keeps AniList's word (genres are a closed list: this is a safety net). */
export const frenchGenre = (genre: string): string => GENRE_FR[genre] ?? genre;

const TAG_FR: Record<string, string> = {
  get School() { return ui("École"); },
  get "School Club"() { return ui("Club scolaire"); },
  Isekai: "Isekai",
  get "Female Protagonist"() { return ui("Héroïne"); },
  get "Male Protagonist"() { return ui("Héros"); },
  get "Ensemble Cast"() { return ui("Distribution chorale"); },
  get "Primarily Female Cast"() { return ui("Surtout des personnages féminins"); },
  get "Primarily Male Cast"() { return ui("Surtout des personnages masculins"); },
  get "Adult Cast"() { return ui("Personnages adultes"); },
  get "Coming of Age"() { return ui("Passage à l'âge adulte"); },
  get "Anti-Hero"() { return ui("Antihéros"); },
  get Military() { return ui("Militaire"); },
  get Magic() { return ui("Magie"); },
  get Swordplay() { return ui("Combats à l'épée"); },
  get "Super Power"() { return ui("Super-pouvoirs"); },
  get Historical() { return ui("Historique"); },
  Gore: "Gore",
  Cyberpunk: "Cyberpunk",
  get Space() { return ui("Espace"); },
  get "Post-Apocalyptic"() { return ui("Post-apocalyptique"); },
  get "Time Manipulation"() { return ui("Manipulation du temps"); },
  get Reincarnation() { return ui("Réincarnation"); },
  get Survival() { return ui("Survie"); },
  get Tragedy() { return ui("Tragédie"); },
  get War() { return ui("Guerre"); },
  get Detective() { return ui("Enquête"); },
  get Superhero() { return ui("Super-héros"); },
  Vampire: "Vampires",
  get Demons() { return ui("Démons"); },
  get Gods() { return ui("Dieux"); },
  Dragons: "Dragons",
  Youkai: "Yōkai",
  get Idols() { return ui("Idoles"); },
  get Cooking() { return ui("Cuisine"); },
  get Medicine() { return ui("Médecine"); },
  get Politics() { return ui("Politique"); },
  get "Royal Affairs"() { return ui("Affaires royales"); },
  get Workplace() { return ui("Monde du travail"); },
  get Rural() { return ui("Campagne"); },
  get Urban() { return ui("Ville"); },
  Violence: "Violence",
  get Philosophy() { return ui("Philosophie"); },
  get "Love Triangle"() { return ui("Triangle amoureux"); },
  get Parody() { return ui("Parodie"); },
  Satire: "Satire",
  get Samurai() { return ui("Samouraïs"); },
  Ninja: "Ninjas",
  Zombie: "Zombies",
  Robots: "Robots",
  get Mythology() { return ui("Mythologie"); },
  Chuunibyou: "Chūnibyō",
};

/** The themes worth showing: the tags that have a French word, in AniList's order of relevance, at most `max`. */
export function frenchTags(tags: readonly string[], max = 5): string[] {
  const out: string[] = [];
  for (const tag of tags) {
    const fr = TAG_FR[tag];
    if (fr && !out.includes(fr)) out.push(fr);
    if (out.length >= max) break;
  }
  return out;
}
