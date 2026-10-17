import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

// A new revision per commit invalidates the precached offline page on deploy.
const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  (spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() || crypto.randomUUID());

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  swSrc: "src/sw.ts",
  useNativeEsbuild: true,
  // Video is never precached: the dev stream alone would weigh megabytes.
  globIgnores: ["public/dev-media/**", "public/demo-media/**"],
  esbuildOptions: { format: "iife" },
});
