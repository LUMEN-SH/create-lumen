import { readFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { parseManifest } from "./manifest/schema.js";

/**
 * Parses CLI arguments into structured options.
 * Filters flag arguments out of positional arguments so that project names
 * are not confused with option arguments.
 *
 * Supported flags:
 *   -y, --yes: Non-interactive Quick Setup with defaults
 *   -m, --manifest <path|json>: Scaffold from a manifest file or inline JSON
 *   -t, --template <name>: Use a preset template shortcut
 *   -h, --help: Display usage help
 *   -v, --version: Display version
 *
 * @param {string[]} [rawArgs=process.argv.slice(2)]
 * @returns {{ quickSetup: boolean, manifest: string|null, template: string|null, help: boolean, version: boolean, projectName: string|null, positional: string[] }}
 */
export function parseArgs(rawArgs = process.argv.slice(2)) {
  let quickSetup = false;
  let manifest = null;
  let template = null;
  let help = false;
  let version = false;

  const positional = [];

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];

    if (arg === "-y" || arg === "--yes") {
      quickSetup = true;
    } else if (arg === "-h" || arg === "--help") {
      help = true;
    } else if (arg === "-v" || arg === "--version") {
      version = true;
    } else if (arg === "-m" || arg === "--manifest") {
      if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith("-")) {
        manifest = rawArgs[++i];
      }
    } else if (arg.startsWith("--manifest=")) {
      manifest = arg.slice("--manifest=".length);
    } else if (arg.startsWith("-m=")) {
      manifest = arg.slice("-m=".length);
    } else if (arg === "-t" || arg === "--template") {
      if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith("-")) {
        template = rawArgs[++i];
      }
    } else if (arg.startsWith("--template=")) {
      template = arg.slice("--template=".length);
    } else if (arg.startsWith("-t=")) {
      template = arg.slice("-t=".length);
    } else if (arg.startsWith("-")) {
      // unknown flag - ignore
    } else {
      positional.push(arg);
    }
  }

  const projectName = positional.length > 0 ? positional[0] : null;

  return {
    quickSetup,
    manifest,
    template,
    help,
    version,
    projectName,
    positional,
  };
}

/**
 * Loads and validates a manifest from a file path or an inline JSON string.
 * @param {string} manifestArg - file path or inline JSON
 * @param {string} [cwd=process.cwd()]
 * @returns {Promise<object>} validated manifest v2 object
 */
export async function loadManifestArg(manifestArg, cwd = process.cwd()) {
  if (!manifestArg || typeof manifestArg !== "string") {
    throw new Error("Missing manifest argument value");
  }

  const trimmed = manifestArg.trim();
  let raw;

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      raw = JSON.parse(trimmed);
    } catch (e) {
      throw new Error(`Failed to parse inline manifest JSON: ${e.message}`, { cause: e });
    }
  } else {
    const filePath = path.isAbsolute(trimmed) ? trimmed : path.resolve(cwd, trimmed);
    try {
      const content = await readFile(filePath, "utf8");
      raw = JSON.parse(content);
    } catch (e) {
      throw new Error(`Failed to read manifest file at "${filePath}": ${e.message}`, { cause: e });
    }
  }

  return parseManifest(raw);
}

/**
 * Generates help text describing CLI usage and available flags.
 * @param {string} version
 * @returns {string}
 */
export function getHelpText(version) {
  return [
    chalk.bold.cyan("  ✦ LUMEN") + chalk.gray(` v${version}`),
    chalk.gray("  Scaffold a production-ready React + Vite project with architecture choice\n"),
    chalk.bold("Usage:"),
    "  npm create lumen [project-name] [options]",
    "  create-lumen [project-name] [options]\n",
    chalk.bold("Options:"),
    `  ${chalk.cyan("-y, --yes")}              Quick Setup defaults (TS + Tailwind v4 + Feature-based + ESLint + Prettier + Vitest)`,
    `  ${chalk.cyan("-m, --manifest <file>")}  Scaffold non-interactively using a manifest file or inline JSON`,
    `  ${chalk.cyan("-t, --template <name>")}  Use a preset template (react-ts, react-js)`,
    `  ${chalk.cyan("-h, --help")}             Show this help message`,
    `  ${chalk.cyan("-v, --version")}          Show version number\n`,
    chalk.bold("Examples:"),
    "  npm create lumen my-app --yes",
    "  npm create lumen my-app -m ./lumen.config.json",
    "  npm create lumen my-app -t react-ts",
    "  npm create lumen --help",
  ].join("\n");
}
