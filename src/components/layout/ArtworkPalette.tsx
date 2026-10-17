"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";
import { RC10 } from "@/config/app";
import { FALLBACK_TONE, toneFromCachedAccent, toneFromMetadata, toneFromPixels, type Tone } from "@/lib/utils/tone";
import type { AnimeSummary } from "@/types/anime";

export const ArtworkPaletteContext = createContext<(tone: Tone) => void>(() => {});
const memory = new Map<string, string>();
// v2: v1 may hold the brand rose cached as the "sample" of a cover that has no readable hue; those entries are never trusted again.
const STORAGE = "maxime-anime:artwork-palette:v2";

function cached(key: string): Tone | null {
  try {
    if (!memory.size && typeof localStorage !== "undefined") {
      const rows: unknown = JSON.parse(localStorage.getItem(STORAGE) ?? "[]");
      if (Array.isArray(rows)) for (const row of rows.slice(-RC10.paletteCacheEntries)) {
        if (Array.isArray(row) && typeof row[0] === "string" && /^#[a-f0-9]{6}$/i.test(row[1])) memory.set(row[0], row[1]);
      }
    }
  } catch { /* Private browsing / invalid cache: artwork metadata remains usable. */ }
  const hex = memory.get(key);
  return hex ? toneFromCachedAccent(hex) : null;
}

/** The element's picture is `source` (the loader keeps the CDN path; only the host or a size query could differ). */
function showsCover(img: HTMLImageElement, source: string): boolean {
  try { return new URL(img.currentSrc || img.src).pathname === new URL(source).pathname; } catch { return false; }
}

export function useArtworkTone(anime: AnimeSummary | null) {
  const source = anime?.coverImage.extraLarge ?? anime?.coverImage.large ?? anime?.coverImage.medium ?? "";
  const color = anime?.coverImage.color ?? null;
  const key = `${anime?.id ?? 0}:${source}`;
  const base = useMemo(() => cached(key) ?? toneFromMetadata(color), [key, color]);
  const [sample, setSample] = useState<{ key: string; tone: Tone } | null>(null);
  const tone = !source ? FALLBACK_TONE : sample?.key === key ? sample.tone : base;
  const publish = useContext(ArtworkPaletteContext);
  useLayoutEffect(() => publish(tone), [publish, tone]);
  const onArtworkLoad = useCallback((img: HTMLImageElement) => {
    if (!source || memory.has(key) || !img.naturalWidth) return;
    // The pixels must be this entry's own cover: an element still showing another season's picture is never sampled for this key.
    if (!showsCover(img, source)) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = RC10.paletteSampleSize;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const next = toneFromPixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data, color);
      memory.set(key, next.accent);
      if (memory.size > RC10.paletteCacheEntries) memory.delete(memory.keys().next().value!);
      try { localStorage.setItem(STORAGE, JSON.stringify([...memory])); } catch { /* Memory cache still works. */ }
      setSample({ key, tone: next });
    } catch { /* A tainted/unavailable image never breaks navigation or changes permissions. */ }
  }, [source, key, color]);
  return { tone, onArtworkLoad };
}
