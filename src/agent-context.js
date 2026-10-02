import { promises as fsp } from "node:fs";
import path from "node:path";
import { buildManifest } from "./manifest/emit.js";

const VALIDATION_NOTES = {
  strict: "strict: architecture boundaries are enforced — do not import across features except via barrels or shared paths; violations must be fixed.",
  relaxed: "relaxed: architecture boundaries are advisory — prefer barrels and shared paths, but cross-imports only warn.",
  none: "none: no architecture validation — paths are still the canonical locations.",
};

function resolveManifest(manifestOrResponses) {
  if (manifestOrResponses && typeof manifestOrResponses.manifestVersion !== "undefined") {
    return manifestOrResponses;
  }
  if (manifestOrResponses && manifestOrResponses._manifestSource) {
    return manifestOrResponses._manifestSource;
  }
  return buildManifest(manifestOrResponses);
}

/**
 * Render the short agent conventions markdown from a manifest.
 * Deterministic: derived only from stable manifest fields.
 * @param {object} manifest - validated manifest v2
 * @returns {string}
 */
export function renderConventions(manifest) {
  const preset = manifest.architecture?.preset ?? manifest.architecture?.type ?? "feature-based";
  const validation = manifest.architecture?.validation ?? "strict";
  const paths = manifest.paths ?? {};
  const harness = manifest.harness ?? { commands: [] };
  const barrelFile = manifest.tooling?.language === "js" ? "index.js" : "index.ts";

  const pathLines = Object.entries(paths)
    .map(([key, value]) => `- ${key}: \`${value}\``)
    .join("\n");

  const harnessLines = (harness.commands ?? [])
    .map((c) => `- \`${c.name}\`: \`${c.command}\` (${c.required === false ? "optional" : "required"})`)
    .join("\n");

  const harnessSummary = (harness.commands ?? []).map((c) => `\`${c.command}\``).join(", ");

  return (
    `# Lumen Agent Conventions\n` +
    `\n` +
    `Generated from \`lumen.config.json\`. Resolve every file location via \`paths.*\` in \`.lumen/architecture.json\` (preset: \`${preset}\`, validation: \`${validation}\`).\n` +
    `\n` +
    `## Rules\n` +
    `\n` +
    `- Resolve all paths via \`paths.*\` — never hardcode alternative \`src/...\` locations.\n` +
    `- Feature barrel: every \`src/features/<feature>/\` must re-export its public API via \`${barrelFile}\`.\n` +
    `- Shared code: import shared utilities via \`@/shared\` (plus the \`@/...\` aliases from tsconfig/jsconfig).\n` +
    `- Harness: before finishing, run each command in \`.lumen/project.json\` \`harness.commands\` in order (${harnessSummary}).\n` +
    `- Validation mode \`${validation}\`: ${VALIDATION_NOTES[validation] ?? VALIDATION_NOTES.strict}\n` +
    `\n` +
    `## Paths\n` +
    `\n` +
    `${pathLines}\n` +
    `\n` +
    `## Harness\n` +
    `\n` +
    `${harnessLines}\n`
  );
}

/**
 * Build the deterministic agent-context payload from a validated manifest v2.
 * No timestamps — output must be byte-stable.
 * @param {object} manifest - validated manifest v2
 * @returns {{ project: object, architecture: object, conventionsMd: string }}
 */
export function buildAgentContext(manifest) {
  const project = {
    manifestVersion: manifest.manifestVersion,
    framework: manifest.framework,
    styling: manifest.styling,
    tooling: manifest.tooling,
    harness: manifest.harness,
    docs: manifest.docs,
  };
  const architecture = {
    preset: manifest.architecture?.preset ?? manifest.architecture?.type,
    validation: manifest.architecture?.validation ?? "strict",
    paths: manifest.paths,
  };
  const conventionsMd = renderConventions(manifest);
  return { project, architecture, conventionsMd };
}

function writeJson(filePath, value) {
  return fsp.writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

/**
 * Emit the .lumen agent context dir into a scaffolded project.
 * Accepts either a validated manifest v2 or scaffolder responses
 * (uses responses._manifestSource when present, else buildManifest).
 * Writes .lumen/project.json, .lumen/architecture.json, .lumen/conventions.md
 * with 2-space indent + trailing newline. Byte-deterministic (no timestamps).
 * @param {string} projectPath - absolute path to scaffolded project
 * @param {object} manifestOrResponses
 * @returns {Promise<string>} absolute path to the .lumen dir
 */
export async function emitAgentContext(projectPath, manifestOrResponses) {
  const manifest = resolveManifest(manifestOrResponses);
  const { project, architecture, conventionsMd } = buildAgentContext(manifest);
  const dir = path.join(projectPath, ".lumen");
  await fsp.mkdir(dir, { recursive: true });
  await writeJson(path.join(dir, "project.json"), project);
  await writeJson(path.join(dir, "architecture.json"), architecture);
  await fsp.writeFile(path.join(dir, "conventions.md"), conventionsMd, "utf8");
  return dir;
}
