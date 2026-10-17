import { IMAGE_DELIVERY } from "@/config/app";

/** A narrower subset of the existing optimizer policy, never a playback host.
 * Local curated rasters and public catalogue artwork only; no credentials,
 * query strings, SVG, nested TMDB paths or URL normalization surprises. */
export function canLoadDirectArtwork(src: string): boolean {
  if (/^\/artwork\/(?:title-logos|episodes)\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:png|jpg|jpeg|webp|avif)$/.test(src)) return true;
  try {
    const url = new URL(src);
    if (url.href !== src || url.protocol !== "https:" || url.port || url.username || url.password || url.search || url.hash) return false;
    if (url.hostname === "image.tmdb.org") return /^\/t\/p\/(?:w500|w1280|w1920|original)\/[a-zA-Z0-9]{1,80}\.(?:png|jpg|webp)$/.test(url.pathname);
    if (url.hostname === "s4.anilist.co") return /^\/file\/anilistcdn\/media\/(?:anime|manga)\/(?:cover\/(?:small|medium|large)|banner)\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:png|jpg|jpeg|webp|avif)$/.test(url.pathname);
    if (url.hostname === "img1.ak.crunchyroll.com") return /^\/i\/spire[1-4]-tmb\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9][a-zA-Z0-9_-]*\.(?:png|jpg|jpeg|webp|avif)$/.test(url.pathname);
  } catch { /* Fail closed. */ }
  return false;
}

type Ticket = { enter(): void; cancel(): void; controller: AbortController; critical: boolean };
let active = 0;
const waiting: Ticket[] = [];
const transfers = new Set<Ticket>();
function slot(controller: AbortController, critical: boolean): Promise<() => void> {
  const signal = controller.signal;
  return new Promise((resolve, reject) => {
    const cancel = () => { const at = waiting.indexOf(ticket); if (at >= 0) waiting.splice(at, 1); signal.removeEventListener("abort", cancel); reject(new Error("Artwork cancelled")); };
    const enter = () => {
      signal.removeEventListener("abort", cancel);
      if (signal.aborted) { reject(new Error("Artwork cancelled")); return; }
      active++; transfers.add(ticket);
      resolve(() => {
        active--; transfers.delete(ticket);
        while (active < IMAGE_DELIVERY.concurrency && waiting.length) waiting.shift()!.enter();
      });
    };
    const ticket = { enter, cancel, controller, critical };
    if (signal.aborted) { cancel(); return; }
    if (active < IMAGE_DELIVERY.concurrency) { enter(); return; }
    if (waiting.length >= IMAGE_DELIVERY.maxPending) {
      const disposable = critical ? [...waiting].reverse().find(t => !t.critical) : null;
      if (!disposable) { reject(new Error("Artwork queue full")); return; }
      disposable.cancel();
    }
    const before = critical ? waiting.findIndex(t => !t.critical) : -1;
    if (before < 0) waiting.push(ticket); else waiting.splice(before, 0, ticket);
    signal.addEventListener("abort", cancel, { once: true });
    // Native lazy-loading margins can start an entire franchise rail first.
    // A hero may interrupt one secondary read; never an audio/video request.
    if (critical) [...transfers].find(t => !t.critical)?.controller.abort();
  });
}

/** CORS produces a readable raster, then a local blob URL. redirect:error keeps
 * the optimizer's no-redirect invariant even when its service is unavailable. */
export async function fetchDirectArtwork(src: string, parentSignal: AbortSignal, critical = false): Promise<Blob> {
  if (!canLoadDirectArtwork(src)) throw new Error("Artwork URL rejected");
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (parentSignal.aborted) cancel(); else parentSignal.addEventListener("abort", cancel, { once: true });
  const signal = controller.signal;
  let release: (() => void) | undefined;
  try {
    release = await slot(controller, critical);
    const response = await fetch(src, { signal, mode: "cors", redirect: "error", credentials: "omit", referrerPolicy: "no-referrer" });
    const type = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
    if (!response.ok || response.redirected || !type || !["image/png", "image/jpeg", "image/webp", "image/avif"].includes(type) || !response.body) { await response.body?.cancel().catch(() => {}); throw new Error("Artwork unavailable"); }
    const declared = response.headers.get("content-length");
    if (declared && Number(declared) > IMAGE_DELIVERY.maxBytes) { await response.body.cancel(); throw new Error("Artwork too large"); }
    const reader = response.body.getReader();
    const chunks: BlobPart[] = [];
    let size = 0;
    try {
      for (;;) {
        if (signal.aborted) throw new Error("Artwork cancelled");
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > IMAGE_DELIVERY.maxBytes) throw new Error("Artwork too large");
        chunks.push(new Uint8Array(value));
      }
    } catch (error) { await reader.cancel().catch(() => {}); throw error; }
    finally { reader.releaseLock(); }
    if (!size || signal.aborted) throw new Error("Artwork unavailable");
    return new Blob(chunks, { type });
  } finally { parentSignal.removeEventListener("abort", cancel); release?.(); }
}
