import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";
const config: NextConfig = {
  turbopack: { root: import.meta.dirname },
  output: "standalone", poweredByHeader: false, devIndicators: false,
  env: { NEXT_PUBLIC_APP_VERSION: "portfolio", NEXT_PUBLIC_BUILD_SHA: process.env.VERCEL_GIT_COMMIT_SHA || "portfolio-local", NEXT_PUBLIC_BUILD_TIME: new Date().toISOString() },
  images: { loader: "custom", loaderFile: "./src/lib/artwork/next-image-loader.ts", qualities: [75, 85, 95] },
  async headers() { return [{ source: "/:path*", headers: [
    { key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" }, { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ] }, { source: "/serwist/:path*", headers: [{ key: "Cache-Control", value: "no-cache" }] }]; },
};
export default withSerwist(config);
