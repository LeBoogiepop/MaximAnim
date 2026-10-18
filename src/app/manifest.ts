import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, THEME } from "@/config/app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "MaximAnim Demo",
    short_name: "MaximAnim Demo",
    description: APP_DESCRIPTION,
    lang: "fr",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: THEME.ink,
    theme_color: THEME.ink,
    categories: ["entertainment", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/brand/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
