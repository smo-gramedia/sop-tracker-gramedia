import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import nextVitals from "eslint-config-next/core-web-vitals";
import { importX } from "eslint-plugin-import-x";
export default defineConfig([
  ...nextVitals,
  tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js, "import-x": importX },
    extends: ["js/recommended", "import-x/flat/recommended"],
    languageOptions: { globals: globals.browser },
    settings: {
      react: {
        version: "19",
      },
    },
    rules: {
      "import-x/no-dynamic-require": "warn",
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
