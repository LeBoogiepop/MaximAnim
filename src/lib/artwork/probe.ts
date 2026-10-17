import type { PixelGrid } from "@/lib/artwork/focal";
import { artworkImageUrl } from "@/lib/artwork/image-loader";

/**
 * What the hero needs to know about a catalogue picture before it is shown: its real pixel size and a small grid of its pixels.
 *
 * `HTMLImageElement.naturalWidth` of an `<img srcset sizes>` is corrected by the density of the candidate the browser picked, and the
 * catalogue loader returns the same file for every width (AniList has no resizer), so it reports a fraction of the file. A plain
 * `Image` with no `srcset` reports the file. The probe loads in CORS mode (both catalogue CDNs allow it) so the pixels can be read; the
 * `<img>` then loads the very same URL in the same mode and finds it in the HTTP cache — the picture is downloaded once. If CORS
 * fails the probe falls back to a plain load: the size is still known, only the grid is missing (the frame then crops around a default
 * point). The URL goes through the same exact-pattern allowlist as every catalogue image (`artworkImageUrl`): a blocked URL is never
 * fetched. Answers are remembered and in-flight probes shared, so a picture is probed once.
 */
export interface ArtworkProbe {
  width: number;
  height: number;
  /** A downscaled copy of the picture, or null when its pixels could not be read. */
  grid: PixelGrid | null;
  /** The picture can be loaded in CORS mode (the `<img>` should then ask for it that way, to share the cache). */
  cors: boolean;
}

const known = new Map<string, ArtworkProbe>();
const pending = new Map<string, Promise<ArtworkProbe>>();
/** Large enough to ask for the best rendition the loader can serve (TMDB picks a tier from it; AniList ignores it). */
const PROBE_WIDTH = 1080;
/** The grid is 64 cells wide: enough to find a face, cheap enough to scan. */
const GRID_WIDTH = 64;

function load(url: string, cors: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    if (cors) image.crossOrigin = "anonymous";
    image.onload = () => (image.naturalWidth && image.naturalHeight ? resolve(image) : reject(new Error("empty")));
    image.onerror = () => reject(new Error("unavailable"));
    image.src = url;
  });
}

function readGrid(image: HTMLImageElement): PixelGrid | null {
  try {
    const width = GRID_WIDTH, height = Math.max(8, Math.round(GRID_WIDTH * image.naturalHeight / image.naturalWidth));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, width, height);
    return { width, height, data: context.getImageData(0, 0, width, height).data };
  } catch { return null; /* A tainted canvas never breaks the page: the frame crops around its default point. */ }
}

export function knownArtworkProbe(src: string): ArtworkProbe | undefined {
  return known.get(src);
}

export function probeArtwork(src: string): Promise<ArtworkProbe> {
  const cached = known.get(src);
  if (cached) return Promise.resolve(cached);
  const inflight = pending.get(src);
  if (inflight) return inflight;
  const url = artworkImageUrl(src, PROBE_WIDTH);
  const run = url.startsWith("data:")
    ? Promise.reject<ArtworkProbe>(new Error("blocked"))
    : load(url, true).then(image => ({ width: image.naturalWidth, height: image.naturalHeight, grid: readGrid(image), cors: true }))
      .catch(() => load(url, false).then(image => ({ width: image.naturalWidth, height: image.naturalHeight, grid: null, cors: false })));
  const probe = run.then(result => { known.set(src, result); pending.delete(src); return result; }, error => { pending.delete(src); throw error; });
  pending.set(src, probe);
  return probe;
}

/** For tests. */
export function resetArtworkProbes(): void {
  known.clear();
  pending.clear();
}
