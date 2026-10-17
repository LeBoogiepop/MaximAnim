"use client";

import { SourceImage as Image } from "./SourceImage";
import { useState, type ComponentProps } from "react";

/** Same-entry replacements crossfade only after decode. Callers key by anime
 * identity so a previous work is never retained for a different one. */
export function StableImage({ src, alt, onLoad, onError, className = "", ...props }: ComponentProps<typeof Image>) {
  const [shown, setShown] = useState(src);
  const [ready, setReady] = useState<typeof src | null>(null);
  const [failed, setFailed] = useState<typeof src | null>(null);
  const replacing = shown !== src;
  return <>
    <Image key={String(shown)} {...props} src={shown} alt={alt} className={className} style={{ ...props.style, visibility: failed === shown ? "hidden" : props.style?.visibility }} onLoad={!replacing ? onLoad : undefined} onError={e => { setFailed(shown); if (!replacing) onError?.(e); }} />
    {replacing && <Image key={String(src)} {...props} src={src} alt="" aria-hidden="true" className={`${className} poster-fade motion-reduce:transition-none`} ref={undefined} style={{ ...props.style, opacity: ready === src && failed !== src ? 1 : 0 }} onError={e => { setFailed(src); onError?.(e); }} onLoad={e => {
      onLoad?.(e); setReady(src);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setShown(src);
    }} onTransitionEnd={e => { if (e.propertyName === "opacity" && ready === src) setShown(src); }} />}
  </>;
}
