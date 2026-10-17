/**
 * Small synchronous hash (cyrb53) for deterministic ids. Synchronous on
 * purpose: Dexie upgrade transactions auto-commit if they await anything that
 * is not IndexedDB (e.g. crypto.subtle). Not a security primitive — script
 * integrity uses SHA-256 (`sha256Hex`).
 */
export function cyrb53(input: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** Same catalogue URL ⇒ same repository id, on every device. */
export function repositoryIdFor(normalizedIndexUrl: string): string {
  return `repo-${cyrb53(normalizedIndexUrl)}`;
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Logical clock for a record modification: never goes backwards relative to
 * the version being replaced, so an edit made after seeing a (possibly
 * clock-skewed) remote version always wins last-writer-wins.
 */
export function nextClock(previous?: number | null, now = Date.now()): number {
  return previous != null && previous >= now ? previous + 1 : now;
}
