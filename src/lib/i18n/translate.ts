import { messages, type MessageKey } from "./messages";
import { interfaceLanguage, type InterfaceLanguage } from "./language";

/** Typed application messages. Values are inserted once and are never translated as external content. */
export function translate(key: MessageKey, values: readonly unknown[] = [], language: InterfaceLanguage = interfaceLanguage()): string {
  const text = messages[key][language];
  return text.replace(/\{(\d+)\}/g, (_, index: string) => String(values[Number(index)] ?? ""));
}
export function ui(key: MessageKey, ...values: unknown[]) { return translate(key, values); }

/** Only use at application-owned error/label boundaries, never on anime titles, names, summaries or track metadata. */
export function localizeOwnedText(text: string): string {
  if (Object.hasOwn(messages, text)) return translate(text as MessageKey);
  const exact = ownedEnglish.get(text);
  if (exact) return translate(exact);
  if (text.length <= 4096) for (const entry of ownedTemplates) {
    const match = entry.pattern.exec(text);
    if (!match) continue;
    const values: unknown[] = [];
    entry.indices.forEach((index, position) => { values[index] = match[position + 1]; });
    return translate(entry.key, values);
  }
  return text;
}
// Only used at explicit application label/error boundaries, never for external content.
const ownedEnglish = new Map<string, MessageKey>(Object.entries(messages).map(([key, message]) => [message.en, key as MessageKey]));
const ownedTemplates = Object.entries(messages).flatMap(([key, message]) => [message.fr, message.en].flatMap(text => {
  const indices: number[] = [];
  const fragments = text.split(/(\{\d+\})/);
  const literalSize = fragments.filter(part => !/^\{\d+\}$/.test(part)).join("").length;
  if (fragments.length === 1 || literalSize < 5) return [];
  const source = fragments.map(part => {
    const slot = /^\{(\d+)\}$/.exec(part);
    if (slot) { indices.push(Number(slot[1])); return "([\\s\\S]*?)"; }
    return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("");
  return [{ key: key as MessageKey, indices, literalSize, pattern: new RegExp(`^${source}$`) }];
})).sort((a, b) => b.literalSize - a.literalSize);
export function plural(language: InterfaceLanguage, count: number, one: string, other: string) {
  return new Intl.PluralRules(language).select(count) === "one" ? one : other;
}
