"use client";

import { artworkImageUrl } from "./image-loader";

/** Registered as `images.loaderFile`: every <Image>/getImageProps resolves through the catalogue-CDN policy. */
export default function loader({ src, width }: { src: string; width: number; quality?: number }): string {
  return artworkImageUrl(src, width);
}
