import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "site/.next/**",
    "site/out/**",
    "site/next-env.d.ts",
    ".ux-planner/**",
    "mcp/*.bundle.*",
    "out/**",
    "packages/core/dist/**",
    "packages/core/dist-test/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
