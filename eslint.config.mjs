// @ts-check
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // TS compiler already catches these — no need to duplicate
      "no-unused-vars": "off",
      "no-undef": "off",
      // Basic quality rules
      "no-console": "warn",
      "prefer-const": "error",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "prisma/migrations/**",
      "public/**",
    ],
  },
];

export default config;
