// @ts-check
import js from "@eslint/js";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-unused-vars": "off",           // handled by TypeScript
      "no-undef": "off",                 // handled by TypeScript
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
