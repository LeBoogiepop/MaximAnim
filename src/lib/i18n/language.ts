export type InterfaceLanguage = "fr" | "en";
/** Same default as a new profile (`DEFAULT_PREFERENCES`): the server and the first client render must agree with it, or an English visitor sees French until hydration. */
export const DEFAULT_LANGUAGE: InterfaceLanguage = "en";
let clientLanguage: InterfaceLanguage = DEFAULT_LANGUAGE;
const listeners = new Set<() => void>();
/** Server rendering and the initial hydration always use the default language. No request-shared server locale. */
export function interfaceLanguage(): InterfaceLanguage { return typeof window === "undefined" ? DEFAULT_LANGUAGE : clientLanguage; }
export function setInterfaceLanguage(language: InterfaceLanguage) {
  if (typeof window === "undefined" || clientLanguage === language) return;
  clientLanguage = language;
  for (const listener of listeners) listener();
}
export function subscribeLanguage(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function interfaceLocale() { return interfaceLanguage() === "en" ? "en-GB" : "fr-FR"; }
export function shortMonth(month: number) {
  return new Intl.DateTimeFormat(interfaceLocale(), { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2000, month - 1, 1)));
}
/** Module-level formatters stay reactive: dates use the locale at render time. DD/MM remains stable. */
export function localeDateFormat(options: Intl.DateTimeFormatOptions) {
  return { format: (date?: number | Date) => new Intl.DateTimeFormat(interfaceLocale(), options).format(date) };
}
