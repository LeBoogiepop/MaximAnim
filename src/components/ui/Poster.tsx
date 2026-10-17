"use client";

import { StableImage } from "./StableImage";
import { useState } from "react";
import type { CoverImage } from "@/types/anime";
import { hasSeenArtwork, isPainted, rememberArtwork } from "@/lib/artwork/reveal";

/**
 * A cover that arrives late fades in over the colour that held its place; one already in cache (or painted before
 * hydration) is never touched. No React state: nothing re-renders, nothing can stay invisible.
 */
function fadeIn(img: HTMLImageElement | null, src: string) {
  if (!img) return;
  if (hasSeenArtwork(src) || isPainted(img)) {
    // A new DOM node may not be `complete` yet, even with a warm HTTP cache.
    // Do not add another period of invisibility or replay the CSS fade.
    img.style.transitionDuration = "0ms";
    img.style.opacity = "1";
    return;
  }
  img.style.opacity = "0";
  img.addEventListener(
    "load",
    () => {
      img.style.opacity = "1";
    },
    { once: true },
  );
  img.addEventListener("error", () => (img.style.opacity = "1"), { once: true });
}

/**
 * Anime cover at the AniList 2:3-ish ratio. The dominant colour paints the
 * frame while the image loads, so rails never flash empty grey boxes.
 */
export function Poster({
  cover,
  alt,
  sizes,
  priority = false,
  className = "",
  rounded = "rounded-[var(--radius-poster)]",
  onArtworkLoad,
}: {
  cover: CoverImage;
  alt: string;
  /** `sizes` attribute for responsive loading, e.g. "128px". */
  sizes: string;
  priority?: boolean;
  className?: string;
  rounded?: string;
  onArtworkLoad?: (image: HTMLImageElement) => void;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const src = [cover.extraLarge, cover.large, cover.medium].find((url): url is string => !!url && !failed.includes(url));
  return (
    <div
      className={`relative aspect-[5/7] overflow-hidden border border-line bg-surface ${rounded} ${className}`}
      style={cover.color ? { backgroundColor: cover.color } : undefined}
    >
      {src ? (
        <StableImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={85}
          loading={priority ? "eager" : "lazy"}
          className="poster-fade object-cover"
          draggable={false}
          // A cover that is sampled for its palette is loaded in CORS mode (the CDN allows it): in no-cors mode the canvas is tainted and the sample always throws.
          crossOrigin={onArtworkLoad ? "anonymous" : undefined}
          ref={image => fadeIn(image, src)}
          onLoad={e => { rememberArtwork(src); onArtworkLoad?.(e.currentTarget); }}
          onError={() => setFailed(previous => previous.includes(src) ? previous : [...previous, src])}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/90 p-2 text-center text-xs font-semibold text-soft">{alt}</div>
      )}
    </div>
  );
}
