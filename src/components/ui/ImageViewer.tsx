"use client";


import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { X } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { IconButton } from "./Button";

/**
 * The artwork, enlarged: a native <dialog> (focus trapping, Escape and the top layer come from the platform). A tap on the
 * backdrop or on « Fermer » leaves it. No gesture library, no zoom: just the picture at a readable size.
 */
export function ImageViewer({ open, onClose, src, alt }: { open: boolean; onClose: () => void; src: string; alt: string }) {
  useInterfaceLanguage();
  const ref = useRef<HTMLDialogElement>(null);
  const openRef = useRef(open);
  const [dimensions, setDimensions] = useState<{ src: string; width: number; height: number } | null>(null);
  const natural = dimensions?.src === src ? dimensions : null;
  // Original AniList JPEGs are already small (460px on measured entries). Do not recompress an enlargement,
  // crop it to a fictional ratio, or request an upscaled variant. Untrusted URLs retain Next's host validation.
  const original = /^https:\/\/s4\.anilist\.co\/file\/anilistcdn\//.test(src);
  useEffect(() => {
    openRef.current = open;
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={alt}
      onClose={() => openRef.current && onClose()}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click on the dialog box itself (not on the picture) is a tap on the backdrop.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto max-h-none max-w-none overflow-visible bg-transparent p-0 text-paper backdrop:bg-black/85"
      data-testid="image-viewer"
    >
      {open && (
        <div className="flex flex-col items-center gap-3 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <div className="relative overflow-hidden rounded-[var(--radius-poster)] bg-surface" style={{ width: `min(calc(100vw - 2rem), ${natural?.width ?? 460}px, ${natural ? 78 * natural.width / natural.height : 55}dvh)`, aspectRatio: natural ? `${natural.width}/${natural.height}` : "5/7", maxHeight: "78dvh" }}>
            <Image src={src} alt={alt} fill unoptimized={original} quality={85} sizes="(max-width: 640px) 90vw, 460px" className="object-contain" draggable={false} onLoad={e => setDimensions({ src, width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })} />
          </div>
          <IconButton label={ui("Fermer")} variant="overlay" onClick={onClose} data-testid="image-viewer-close">
            <X size={22} aria-hidden="true" />
          </IconButton>
        </div>
      )}
    </dialog>
  );
}

/** Wraps an artwork so that a tap opens it larger. Without a source the children are shown as they are. */
export function Zoomable({ src, alt, children, className = "" }: { src: string | null | undefined; alt: string; children: ReactNode; className?: string }) {
  useInterfaceLanguage();
  const [open, setOpen] = useState(false);
  if (!src) return <>{children}</>;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={ui("Agrandir : {0}", alt)} aria-haspopup="dialog" className={`tactile block w-full rounded-[inherit] text-left active:opacity-85 ${className}`} data-testid="zoomable">
        {children}
      </button>
      <ImageViewer open={open} onClose={() => setOpen(false)} src={src} alt={alt} />
    </>
  );
}
