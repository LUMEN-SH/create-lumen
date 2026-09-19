#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import chalk from "chalk";
import "../register.js";
import { parseArgs, getHelpText } from "../src/cli-flags.js";

const { version } = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8")
);

const parsed = parseArgs(process.argv.slice(2));

if (parsed.help) {
  console.log("\n" + getHelpText(version) + "\n");
  process.exit(0);
}

if (parsed.version) {
  console.log(version);
  process.exit(0);
}

console.log(
  chalk.bold.cyan("\n  ✦ LUMEN") +
    chalk.gray(` v${version}`) +
    chalk.gray(
      "\n  Scaffold a React + Vite project with architecture choice\n"
    )
);

const { main } = await import("@/main.js");

main({
  quickSetup: parsed.quickSetup,
  projectName: parsed.projectName,
  manifest: parsed.manifest,
  template: parsed.template,
}).catch((e) => {
  console.error(chalk.red("\nError:"), e.message || e);
  process.exit(1);
});
