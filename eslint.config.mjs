import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "no-eval": "error",
      "react/no-danger": "error",
    },
  },
  // Fixtures and the frozen RC10 research workspace are references, not shipped app code.
  // Keep the application, tests and application scripts under the strict rules above.
  globalIgnores([".next*/**", ".portfolio-export/**", ".postrelease/**", ".claude/worktrees/**", "out/**", "build/**", "public/**", "tests/fixtures/**", "design/rc10/**", "next-env.d.ts", "test-results/**", "playwright-report/**", ".next-first-use/**", "test-results-first-use/**", "playwright-report-first-use/**", "coverage/**"]),
]);

export default eslintConfig;
