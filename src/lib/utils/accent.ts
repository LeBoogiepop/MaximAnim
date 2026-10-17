
import { ui } from "@/lib/i18n/translate";
export const ACCENTS = {
  pink: { get label() { return ui("Rose original"); }, color: "#f2768d" },
  blue: { get label() { return ui("Bleu"); }, color: "#81b8f5" },
  violet: { get label() { return ui("Violet"); }, color: "#ba9cf5" },
  turquoise: { label: "Turquoise", color: "#66d6cb" },
  orange: { label: "Orange", color: "#f5ad73" },
  green: { get label() { return ui("Vert"); }, color: "#9bd18a" },
} as const;
export type Accent = keyof typeof ACCENTS;
export function accentOf(value: unknown): Accent {
  return typeof value === "string" && Object.hasOwn(ACCENTS, value) ? value as Accent : "pink";
}
