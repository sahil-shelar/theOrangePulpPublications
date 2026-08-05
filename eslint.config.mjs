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
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated from the live schema — regenerate, don't lint.
    "src/types/database.ts",
  ]),
  {
    // These must stay CommonJS: next.config.js is loaded by Node before any
    // ESM transform, and polyfill.js is passed to --require.
    files: ["*.js", "*.mjs", "*.cjs", "jest.config.js", "polyfill.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]);

export default eslintConfig;
