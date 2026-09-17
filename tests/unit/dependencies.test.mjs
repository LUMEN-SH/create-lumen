import test from "node:test";
import assert from "node:assert/strict";
import { computeDeps } from "../../src/dependencies.js";

// Baseline cell: nothing selected — only react/react-dom are always present.
const BASE = {
  cssFramework: "none",
  stateManagement: "none",
  router: false,
  iconLibrary: "none",
  apiClient: "none",
  testing: "none",
  linter: "none",
  formatter: "none",
  language: "ts",
};

function cellDeps(cell) {
  const { deps, devDeps } = computeDeps({ ...BASE, ...cell });
  return { deps, devDeps };
}

function has(list, ...pkgs) {
  for (const p of pkgs) assert.ok(list.includes(p), `${p} missing from ${JSON.stringify(list)}`);
}

function lacks(list, ...pkgs) {
  for (const p of pkgs) assert.ok(!list.includes(p), `${p} unexpectedly present in ${JSON.stringify(list)}`);
}

test("baseline scaffolds react + react-dom only", () => {
  const { deps, devDeps } = cellDeps({});
  assert.equal(deps.length, 2);
  assert.deepEqual(deps.sort(), ["react", "react-dom"]);
  assert.equal(devDeps.length, 0);
});

test("tailwind: tailwindcss/@tailwindcss/vite as devDeps, clsx + tailwind-merge as deps", () => {
  const { deps, devDeps } = cellDeps({ cssFramework: "tailwind" });
  has(devDeps, "tailwindcss", "@tailwindcss/vite");
  has(deps, "clsx", "tailwind-merge");
});

test("bootstrap: bootstrap + react-bootstrap as deps, no tailwind tooling", () => {
  const { deps, devDeps } = cellDeps({ cssFramework: "bootstrap" });
  has(deps, "bootstrap", "react-bootstrap");
  lacks(deps, "tailwindcss", "@tailwindcss/vite");
  lacks(devDeps, "tailwindcss");
});

test("redux vs zustand vs none are mutually exclusive", () => {
  const redux = cellDeps({ stateManagement: "redux" });
  has(redux.deps, "@reduxjs/toolkit", "react-redux");
  const zustand = cellDeps({ stateManagement: "zustand" });
  has(zustand.deps, "zustand");
  lacks(zustand.deps, "@reduxjs/toolkit", "react-redux");
  const none = cellDeps({ stateManagement: "none" });
  lacks(none.deps, "zustand", "@reduxjs/toolkit", "react-redux");
});

test("router adds react-router-dom", () => {
  const { deps } = cellDeps({ router: true });
  has(deps, "react-router-dom");
});

test("icons: lucide vs huge", () => {
  const lucide = cellDeps({ iconLibrary: "lucide" });
  has(lucide.deps, "lucide-react");
  lacks(lucide.deps, "@hugeicons/react");
  const huge = cellDeps({ iconLibrary: "huge" });
  has(huge.deps, "@hugeicons/react", "@hugeicons/core-free-icons");
});

test("api client: axios only", () => {
  const { deps } = cellDeps({ apiClient: "axios" });
  has(deps, "axios");
});

test("vitest installs the vitest runtime + jsdom test stack", () => {
  const { devDeps } = cellDeps({ testing: "vitest" });
  has(devDeps, "vitest", "@testing-library/react", "@testing-library/jest-dom", "jsdom");
  lacks(devDeps, "jest", "jest-environment-jsdom", "babel-jest");
});

test("jest installs jest-environment-jsdom + babel presets", () => {
  const { devDeps } = cellDeps({ testing: "jest" });
  has(devDeps, "jest", "jest-environment-jsdom", "@testing-library/react", "@testing-library/jest-dom", "jsdom", "babel-jest", "@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript");
  lacks(devDeps, "vitest");
});

test("eslint + ts declares jiti and typescript-eslint (ESLint >= 10 TS config loader)", () => {
  const { devDeps } = cellDeps({ linter: "eslint", language: "ts" });
  has(devDeps, "eslint", "@eslint/js", "eslint-plugin-react-hooks", "eslint-plugin-react-refresh", "globals", "jiti", "typescript-eslint");
});

test("eslint + js never declares jiti / typescript-eslint", () => {
  const { devDeps } = cellDeps({ linter: "eslint", language: "js" });
  has(devDeps, "eslint");
  lacks(devDeps, "jiti", "typescript-eslint");
});

test("oxlint installs oxlint only", () => {
  const { devDeps } = cellDeps({ linter: "oxlint" });
  has(devDeps, "oxlint");
  lacks(devDeps, "eslint", "@eslint/js", "jiti");
});

test("prettier + eslint wires eslint-config-prettier", () => {
  const { devDeps } = cellDeps({ linter: "eslint", formatter: "prettier" });
  has(devDeps, "prettier", "eslint-config-prettier");
});

test("prettier + oxlint does not wire eslint-config-prettier", () => {
  const { devDeps } = cellDeps({ linter: "oxlint", formatter: "prettier" });
  has(devDeps, "prettier");
  lacks(devDeps, "eslint-config-prettier");
});

test("oxfmt installs oxfmt", () => {
  const { devDeps } = cellDeps({ linter: "oxlint", formatter: "oxfmt" });
  has(devDeps, "oxfmt");
});

test("no formatter = no format deps", () => {
  const { devDeps } = cellDeps({ linter: "eslint", formatter: "none" });
  lacks(devDeps, "prettier", "oxfmt", "eslint-config-prettier");
});