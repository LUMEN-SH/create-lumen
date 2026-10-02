import test from "node:test";
import assert from "node:assert/strict";
import { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildManifest } from "../../src/manifest/emit.js";
import { buildAgentContext, emitAgentContext } from "../../src/agent-context.js";

const baseResponses = {
  projectName: "my-app",
  architecture: "feature-based",
  language: "ts",
  cssFramework: "tailwind",
  testing: "vitest",
  router: true,
  stateManagement: "none",
  iconLibrary: "none",
  apiClient: "none",
  linter: "eslint",
  formatter: "prettier",
  docsLanguage: "en",
  gitInit: false,
  readme: false,
  agentDocs: true,
};

test("buildAgentContext: reflects preset/validation/paths/harness", () => {
  const manifest = buildManifest(baseResponses);
  const { project, architecture, conventionsMd } = buildAgentContext(manifest);

  assert.equal(architecture.preset, "feature-based");
  assert.equal(architecture.validation, "strict");
  assert.deepEqual(architecture.paths, manifest.paths);
  assert.deepEqual(project.harness, manifest.harness);
  assert.deepEqual(project.framework, manifest.framework);
  assert.deepEqual(project.tooling, manifest.tooling);
  assert.deepEqual(project.docs, manifest.docs);
  assert.deepEqual(project.styling, manifest.styling);
  assert.equal(project.manifestVersion, 2);

  // No timestamps anywhere
  assert.ok(!("generatedAt" in project), "project must not contain generatedAt");
  assert.ok(!("generatedAt" in architecture), "architecture must not contain generatedAt");

  // conventions.md mentions the key rules
  assert.ok(conventionsMd.includes("paths.*"), "must reference paths.*");
  assert.ok(conventionsMd.includes("src/features/<feature>/"), "must include barrel rule");
  assert.ok(conventionsMd.includes("`index.ts`"), "must name the barrel file");
  assert.ok(conventionsMd.includes("@/shared"), "must reference @/shared");
  assert.ok(conventionsMd.includes("harness.commands"), "must reference harness.commands");
  assert.ok(conventionsMd.includes("`strict`"), "must mention validation mode");
});

test("buildAgentContext: type-based preset + relaxed validation", () => {
  const manifest = buildManifest({ ...baseResponses, architecture: "type-based", architectureValidation: "relaxed" });
  const { architecture, conventionsMd } = buildAgentContext(manifest);
  assert.equal(architecture.preset, "type-based");
  assert.equal(architecture.validation, "relaxed");
  assert.ok(conventionsMd.includes("`relaxed`"));
  assert.ok(conventionsMd.includes("src/components") || conventionsMd.includes("components"));
});

test("emitAgentContext: writes 3 files and is byte-deterministic", async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "lumen-agent-ctx-"));
  const outDir = await emitAgentContext(dir, baseResponses);

  assert.equal(outDir, path.join(dir, ".lumen"));
  for (const file of ["project.json", "architecture.json", "conventions.md"]) {
    const stat = await fsp.stat(path.join(outDir, file));
    assert.ok(stat.isFile(), `${file} must exist`);
  }

  const files = ["project.json", "architecture.json", "conventions.md"];
  const first = {};
  for (const file of files) {
    const content = await fsp.readFile(path.join(outDir, file), "utf8");
    assert.ok(content.endsWith("\n"), `${file} must end with newline`);
    first[file] = content;
  }

  // JSON files parse and carry no timestamps
  const project = JSON.parse(first["project.json"]);
  assert.equal(project.manifestVersion, 2);
  assert.ok(!("generatedAt" in project));
  const arch = JSON.parse(first["architecture.json"]);
  assert.deepEqual(Object.keys(arch), ["preset", "validation", "paths"]);
  assert.equal(arch.preset, "feature-based");

  // Double emission = byte-identical
  await emitAgentContext(dir, baseResponses);
  for (const file of files) {
    const content = await fsp.readFile(path.join(outDir, file), "utf8");
    assert.equal(content, first[file], `${file} must be byte-identical on re-emit`);
  }
});

test("emitAgentContext: accepts a validated manifest directly", async () => {
  const manifest = buildManifest(baseResponses);
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "lumen-agent-ctx-manifest-"));
  await emitAgentContext(dir, manifest);
  const project = JSON.parse(await fsp.readFile(path.join(dir, ".lumen", "project.json"), "utf8"));
  assert.deepEqual(project.harness, manifest.harness);

  // Same bytes as emitting from responses
  const dir2 = await fsp.mkdtemp(path.join(os.tmpdir(), "lumen-agent-ctx-resp-"));
  await emitAgentContext(dir2, baseResponses);
  for (const file of ["project.json", "architecture.json", "conventions.md"]) {
    const a = await fsp.readFile(path.join(dir, ".lumen", file), "utf8");
    const b = await fsp.readFile(path.join(dir2, ".lumen", file), "utf8");
    assert.equal(a, b, `${file} must match between manifest and responses input`);
  }
});
