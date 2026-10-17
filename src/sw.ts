/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import { CacheableResponsePlugin, CacheFirst, ExpirationPlugin, NetworkOnly, type PrecacheEntry, Serwist, type SerwistGlobalConfig } from "serwist";
import { isPrivateRequest } from "@/lib/pwa/cache-policy";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Caching policy:
 * - app shell & static assets: precached (Serwist manifest) + Next.js defaults;
 * - AniList artwork: cache-first with expiry, so the library looks right offline;
 * - video (HLS playlists/segments, MP4/WebM), the playback relay, the
 *   extension network broker and every other API route: never cached.
 * User data lives in IndexedDB, which service-worker cache invalidation never touches.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Supabase and authenticated extension APIs otherwise reach defaultCache's
      // generic cross-origin NetworkFirst cache. Never store/replay private GETs.
      matcher: ({ request, url }) => isPrivateRequest(request, url, self.location.origin),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url, request }) =>
        request.destination === "video" ||
        url.pathname.startsWith("/dev-media/") ||
        /\.(m3u8|ts|m4s|mp4|webm)$/i.test(url.pathname),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    {
      // Catalogue rasters now load straight from their CDNs (no same-origin /_next/image hop): an <img> read is an opaque
      // (status 0) response, which a strategy only stores when asked, so offline covers and logos keep working.
      matcher: ({ url }) => url.hostname === "s4.anilist.co" || url.hostname === "image.tmdb.org",
      handler: new CacheFirst({
        cacheName: "anilist-images",
        plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 60, purgeOnQuotaError: true })],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
