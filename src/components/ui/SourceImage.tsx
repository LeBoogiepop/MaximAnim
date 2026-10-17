"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { IMAGE_DELIVERY } from "@/config/app";
import { canLoadDirectArtwork, fetchDirectArtwork } from "@/lib/artwork/image-delivery";

type Attempt = { controller: AbortController; phase: "fetching" | "direct" | "failed"; url?: string };

/** Keep responsive optimization normally. If that service fails, one bounded
 * attempt decodes the very same approved raster; never choose another work. */
export function SourceImage(props: ComponentProps<typeof Image>) {
  // The attempt owns its Blob lifetime. Changing resource identity disposes
  // that attempt and its state together, including an A → B → A round trip.
  const identity = typeof props.src === "string" ? props.src : "default" in props.src ? props.src.default.src : props.src.src;
  return <SourceImageAttempt key={identity} {...props} />;
}

function SourceImageAttempt({ src, alt, onError, ...props }: ComponentProps<typeof Image>) {
  const attempts = useRef(new Map<string, Attempt>());
  const [direct, setDirect] = useState<{ source: string; url: string } | null>(null);
  useEffect(() => {
    const records = attempts.current;
    return () => {
      if (typeof src !== "string") return;
      const attempt = records.get(src);
      attempt?.controller.abort();
      if (attempt?.url) URL.revokeObjectURL(attempt.url);
      records.delete(src);
    };
  }, [src]);
  const blob = typeof src === "string" && direct?.source === src ? direct.url : null;
  return <Image {...props} alt={alt} key={blob ?? String(src)} src={blob ?? src} unoptimized={props.unoptimized || !!blob} onError={event => {
    if (typeof src !== "string" || props.unoptimized || !canLoadDirectArtwork(src)) { onError?.(event); return; }
    const previous = attempts.current.get(src);
    if (previous?.phase === "fetching") return;
    if (previous) { onError?.(event); return; }
    const element = event.currentTarget;
    const attempt: Attempt = { controller: new AbortController(), phase: "fetching" };
    attempts.current.set(src, attempt);
    const critical = props.fetchPriority === "high";
    const timer = setTimeout(() => attempt.controller.abort(), critical ? IMAGE_DELIVERY.priorityTimeoutMs : IMAGE_DELIVERY.directTimeoutMs);
    void fetchDirectArtwork(src, attempt.controller.signal, critical).then(body => {
      if (attempt.controller.signal.aborted || attempts.current.get(src) !== attempt || !element.isConnected) return;
      attempt.url = URL.createObjectURL(body); attempt.phase = "direct";
      setDirect({ source: src, url: attempt.url });
    }).catch(() => {
      if (attempts.current.get(src) !== attempt || !element.isConnected) return;
      attempt.phase = "failed";
      // Dispatch the terminal error on the mounted element so React supplies
      // the usual currentTarget, rather than an expired async synthetic event.
      element.dispatchEvent(new Event("error"));
    }).finally(() => clearTimeout(timer));
  }} />;
}
