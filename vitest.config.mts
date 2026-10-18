import path from "node:path";
import { defineConfig } from "vitest/config";
// "@" lets tests import application modules exactly as the application does.
export default defineConfig({ resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } }, test: { environment: "jsdom", include: ["tests/**/*.test.ts"] } });
