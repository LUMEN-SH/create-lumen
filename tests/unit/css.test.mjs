import test from "node:test";
import assert from "node:assert/strict";
import { promises as fsp } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { setupCssFramework } from "../../src/css.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../../templates");

async function exists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

// Mirror the main.* that the architecture templates ship: the CSS import the
// injector must re-point at the framework's actual stylesheet name.
function fakeMain(architecture, ext) {
  const stylesImport =
    architecture === "feature-based"
      ? "./shared/styles/globals.css"
      : "./styles/globals.css";
  return `import React from "react";\nimport "${stylesImport}";\n\nexport default function App() { return null; }\n`;
}

async function scaffoldArk({ architecture, language, cssFramework, framework }) {
  // A minimal fake Vite project: main entry + leftover CSS that must be removed.
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "lumen-css-"));
  const stylesRel =
    architecture === "feature-based" ? "src/shared/styles" : "src/styles";
  const mainExt = language === "ts" ? "tsx" : "jsx";
  await fsp.mkdir(path.join(dir, stylesRel), { recursive: true });
  await fsp.writeFile(path.join(dir, "src", `main.${mainExt}`), fakeMain(architecture, mainExt), "utf8");
  // Vite leftover files the generator must delete.
  await fsp.writeFile(path.join(dir, "src", "index.css"), "/* leftover */", "utf8");
  await fsp.writeFile(path.join(dir, "src", "App.css"), "/* leftover */", "utf8");
  // Tailwind overwrites the vite config from templates; keep the base per-language.
  const viteConfig = `vite.config.${language === "ts" ? "ts" : "js"}`;
  await fsp.writeFile(path.join(dir, viteConfig), "export default {}", "utf8");

  const prevCwd = process.cwd();
  try {
    await setupCssFramework({
      projectPath: dir,
      templatesDir: TEMPLATES_DIR,
      language,
      cssFramework,
      architecture,
      ext: mainExt,
      pkg: "npm",
      framework,
    });
  } finally {
    process.chdir(prevCwd);
  }
  return { dir, mainExt, stylesRel };
}

const CELLS = [];
for (const architecture of ["feature-based", "type-based"]) {
  for (const language of ["ts", "js"]) {
    for (const cssFramework of ["tailwind", "bootstrap", "none"]) {
      CELLS.push({ architecture, language, cssFramework });
    }
  }
}

for (const { architecture, language, cssFramework } of CELLS) {
  test(`setupCssFramework: ${architecture}/${language}/${cssFramework} writes the right stylesheet + themes.css`, async () => {
    const { dir, mainExt, stylesRel } = await scaffoldArk({ architecture, language, cssFramework });

    const expectedMain = cssFramework === "none" ? "main.css" : "globals.css";
    const mainRel = path.join(stylesRel, expectedMain);
    assert.ok(await exists(path.join(dir, mainRel)), `${expectedMain} missing at ${stylesRel}`);
    assert.ok(await exists(path.join(dir, stylesRel, "themes.css")), "themes.css missing");
    assert.ok(
      !(await exists(path.join(dir, stylesRel, cssFramework === "none" ? "globals.css" : "main.css"))),
      "opposite stylesheet name leaked"
    );

    const mainCss = await fsp.readFile(path.join(dir, mainRel), "utf8");
    const themesCss = await fsp.readFile(path.join(dir, stylesRel, "themes.css"), "utf8");
    if (cssFramework === "tailwind") {
      assert.match(mainCss, /@import[^;]*tailwindcss/, "tailwind import missing");
    } else if (cssFramework === "bootstrap") {
      assert.match(themesCss, /data-bs-theme/, "bootstrap theme tokens missing");
    } else {
      assert.match(mainCss, /box-sizing/, "vanilla reset missing");
      assert.match(mainCss, /var\(--color-/, "vanilla stylesheet should consume CSS variables");
    }

    await fsp.rm(dir, { recursive: true, force: true });
  });

  test(`setupCssFramework: ${architecture}/${language}/${cssFramework} re-points main.${language === "ts" ? "tsx" : "jsx"} at the framework's stylesheet`, async () => {
    const { dir, mainExt } = await scaffoldArk({ architecture, language, cssFramework });
    const main = await fsp.readFile(path.join(dir, "src", `main.${mainExt}`), "utf8");
    const expected = cssFramework === "none" ? "main.css" : "globals.css";
    const expectedImport =
      architecture === "feature-based"
        ? `'./shared/styles/${expected}'`
        : `'./styles/${expected}'`;
    assert.ok(main.includes(expectedImport), `main.${mainExt} does not import ${expectedImport}: ${main}`);

    // Vite's leftover root CSS is always removed.
    assert.ok(!(await exists(path.join(dir, "src", "index.css"))), "src/index.css still present");
    assert.ok(!(await exists(path.join(dir, "src", "App.css"))), "src/App.css still present");

    await fsp.rm(dir, { recursive: true, force: true });
  });
}

test("setupCssFramework: tailwind swaps in the tailwind vite config", async () => {
  const { dir } = await scaffoldArk({ architecture: "feature-based", language: "ts", cssFramework: "tailwind" });
  const vite = await fsp.readFile(path.join(dir, "vite.config.ts"), "utf8");
  assert.match(vite, /@tailwindcss\/vite/, "tailwind vite plugin missing");
  await fsp.rm(dir, { recursive: true, force: true });
});

test("setupCssFramework: tailwind next.js writes postcss.config.mjs with @tailwindcss/postcss", async () => {
  const { dir } = await scaffoldArk({ architecture: "feature-based", language: "ts", cssFramework: "tailwind", framework: "next" });
  const postcss = await fsp.readFile(path.join(dir, "postcss.config.mjs"), "utf8");
  assert.match(postcss, /@tailwindcss\/postcss/, "postcss plugin missing");
  await fsp.rm(dir, { recursive: true, force: true });
});

test("setupCssFramework: bootstrap prepends the bootstrap css import into main", async () => {
  const { dir, mainExt } = await scaffoldArk({ architecture: "type-based", language: "js", cssFramework: "bootstrap" });
  const main = await fsp.readFile(path.join(dir, "src", `main.${mainExt}`), "utf8");
  assert.match(main, /bootstrap\.min\.css/, "bootstrap css import missing in main");
  await fsp.rm(dir, { recursive: true, force: true });
});