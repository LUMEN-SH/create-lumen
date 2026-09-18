import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["**/node_modules/**", "tests/**", "templates/**", "schema/**", "**/.omo/**"],
  },
  js.configs.recommended,
  {
    files: ["bin/**/*.js", "register.js", "src/**/*.js", "scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];