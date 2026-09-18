import { promises as fsp } from "fs";
import path from "path";
import { parseManifest, SCHEMA_URL, MANIFEST_VERSION } from "./schema.js";
import { resolvePaths } from "./paths.js";

/**
 * Build an ordered manifest v2 object from scaffolder responses.
 * Stable key ordering for byte-determinism.
 * @param {object} responses - result from getUserInputs (includes docsLanguage, cssFramework, etc.)
 * @param {object} [opts]
 * @param {string} [opts.frameworkName] - default "react"
 * @param {string} [opts.frameworkVariant] - default "vite" or derived from framework
 * @returns {object} ordered manifest object ready to JSON.stringify
 */
export function buildManifest(responses, opts = {}) {
  const frameworkName = opts.frameworkName || responses.frameworkName || "react";
  const frameworkVariant =
    opts.frameworkVariant ||
    responses.frameworkVariant ||
    (frameworkName === "next" ? "app-router" : "vite");

  const framework = {
    name: frameworkName,
    variant: frameworkVariant,
  };
  // Include optional axes only if present in responses (future overlays)
  if (responses.bundler) framework.bundler = responses.bundler;
  if (responses.adapter) framework.adapter = responses.adapter;

  const styling = {
    engine: responses.cssFramework || "tailwind",
  };

  const architecture = {
    type: responses.architecture || "feature-based",
  };

  const ui = {
    kit: responses.uiKit || responses.ui || "none",
  };

  const docs = {
    language: responses.docsLanguage || "en",
  };

  const paths = resolvePaths({
    architecture: architecture.type,
    framework,
  });

  const tooling = {
    language: responses.language || "ts",
    linter: responses.linter || "none",
    formatter: responses.formatter || "none",
  };

  const manifest = {
    $schema: SCHEMA_URL,
    manifestVersion: MANIFEST_VERSION,
    framework,
    styling,
    architecture,
    ui,
    docs,
    paths,
    tooling,
  };

  // Optional cross-cutting flags — only include if explicitly set (keeps minimal manifest byte-stable)
  if (typeof responses.reactCompiler === "boolean") manifest.reactCompiler = responses.reactCompiler;
  if (typeof responses.agentDocs === "boolean") manifest.agentDocs = responses.agentDocs;

  // Enforce stable top-level key order for determinism (like formatter pass)
  const ordered = {};
  const topOrder = [
    "$schema",
    "manifestVersion",
    "framework",
    "styling",
    "architecture",
    "ui",
    "docs",
    "paths",
    "tooling",
    "reactCompiler",
    "agentDocs",
  ];
  for (const k of topOrder) {
    if (k in manifest) ordered[k] = manifest[k];
  }
  // Include any extra keys not in order (should be none, but for forward compat)
  for (const k of Object.keys(manifest)) {
    if (!(k in ordered)) ordered[k] = manifest[k];
  }

  // Validate via Zod before returning (throws with human-friendly message on invalid)
  // Use parse to apply defaults ($schema) and ensure strictness
  return parseManifest(ordered);
}

/**
 * Emit lumen.config.json to projectPath.
 * Validates via Zod, writes with 2-space indent + trailing newline.
 * @param {string} projectPath - absolute path to scaffolded project
 * @param {object} responses
 * @param {object} [opts] - same as buildManifest opts
 * @returns {Promise<string>} absolute path to written file
 */
export async function emitManifest(projectPath, responses, opts = {}) {
  const manifest = buildManifest(responses, opts);
  const outPath = path.join(projectPath, "lumen.config.json");
  const content = JSON.stringify(manifest, null, 2) + "\n";
  await fsp.writeFile(outPath, content, "utf8");
  return outPath;
}
