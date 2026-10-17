/** Script detection is a display guard, never a translation or an identity match. */
export function hasJapaneseScript(value: string): boolean {
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(value);
}
