import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

const base = {
  "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  "no-undef": "error",
};

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  {
    // Frontend : globals navigateur uniquement (pas de globals Node).
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest", sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: { ...base, "react-hooks/rules-of-hooks": "error", "react-hooks/exhaustive-deps": "off" },
  },
  {
    // Serveur / API / scripts : globals Node.
    files: ["server/**/*.js", "api/**/*.js", "scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest", sourceType: "module",
      globals: { ...globals.node },
    },
    rules: base,
  },
];
