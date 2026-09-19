import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { parseArgs, loadManifestArg, getHelpText } from "../../src/cli-flags.js";
import { resolveProjectName } from "../../src/main.js";

test("cli flags: parses --yes and -y flags", () => {
  const parsed1 = parseArgs(["my-app", "--yes"]);
  assert.equal(parsed1.quickSetup, true);
  assert.equal(parsed1.projectName, "my-app");

  const parsed2 = parseArgs(["-y", "my-app"]);
  assert.equal(parsed2.quickSetup, true);
  assert.equal(parsed2.projectName, "my-app");
});

test("cli flags: parses --manifest and -m flags (path and equals syntax)", () => {
  const parsed1 = parseArgs(["my-app", "--manifest", "./custom-manifest.json"]);
  assert.equal(parsed1.manifest, "./custom-manifest.json");
  assert.equal(parsed1.projectName, "my-app");

  const parsed2 = parseArgs(["-m", "./custom-manifest.json", "other-app"]);
  assert.equal(parsed2.manifest, "./custom-manifest.json");
  assert.equal(parsed2.projectName, "other-app");

  const parsed3 = parseArgs(["--manifest=./lumen.config.json"]);
  assert.equal(parsed3.manifest, "./lumen.config.json");
  assert.equal(parsed3.projectName, null);
});

test("cli flags: parses --template and -t flags", () => {
  const parsed1 = parseArgs(["my-app", "--template", "react-ts"]);
  assert.equal(parsed1.template, "react-ts");
  assert.equal(parsed1.projectName, "my-app");

  const parsed2 = parseArgs(["-t", "react-js", "app-js"]);
  assert.equal(parsed2.template, "react-js");
  assert.equal(parsed2.projectName, "app-js");
});

test("cli flags: parses --help and -h flags", () => {
  assert.equal(parseArgs(["--help"]).help, true);
  assert.equal(parseArgs(["-h"]).help, true);
  const helpText = getHelpText("2.0.0");
  assert.ok(helpText.includes("--manifest"));
  assert.ok(helpText.includes("--yes"));
  assert.ok(helpText.includes("--template"));
});

test("cli flags: resolveProjectName filters out flag arguments and values (#29)", () => {
  assert.equal(
    resolveProjectName({ rawArgs: ["--yes", "my-target-app"] }),
    "my-target-app"
  );
  assert.equal(
    resolveProjectName({ rawArgs: ["my-target-app", "--yes"] }),
    "my-target-app"
  );
  assert.equal(
    resolveProjectName({ rawArgs: ["-m", "./lumen.config.json", "my-manifest-app"] }),
    "my-manifest-app"
  );
  assert.equal(
    resolveProjectName({ rawArgs: ["my-manifest-app", "--manifest", "./lumen.config.json"] }),
    "my-manifest-app"
  );
  assert.equal(
    resolveProjectName({ rawArgs: ["-t", "react-ts", "my-template-app"] }),
    "my-template-app"
  );
});

test("cli flags: loadManifestArg loads and validates from file and inline JSON", async () => {
  const fixturePath = path.resolve("schema/fixtures/v2/valid/react-vite-feature-based.json");
  const manifestFromFile = await loadManifestArg(fixturePath);
  assert.equal(manifestFromFile.manifestVersion, 2);
  assert.equal(manifestFromFile.framework.name, "react");

  const inlineJson = JSON.stringify(manifestFromFile);
  const manifestFromInline = await loadManifestArg(inlineJson);
  assert.equal(manifestFromInline.manifestVersion, 2);
  assert.equal(manifestFromInline.architecture.type, "feature-based");
});

test("cli flags: loadManifestArg throws on invalid or v1 manifest", async () => {
  const v1Json = JSON.stringify({ framework: "react", css: "tailwind", architecture: "feature-based" });
  await assert.rejects(
    () => loadManifestArg(v1Json),
    /Manifest v1 detected/
  );

  await assert.rejects(
    () => loadManifestArg("non-existent-path-12345.json"),
    /Failed to read manifest file/
  );
});
