import { confirm, isCancel, note, select } from "@clack/prompts";
import chalk from "chalk";
import { configExists, loadConfig, saveConfig } from "@/config-cache.js";
import {
  isPromptVisible,
  filterCompatibleChoices,
  getDefaultResponses,
  sanitizeResponsesForFramework,
  normalizeFramework,
} from "./engine/capabilities.js";

export function onCancel() {
  console.log(chalk.gray("\n\nOperation cancelled.\n"));
  process.exit(1);
}

function formatConfig(responses) {
  const lang = responses.language === "ts" ? "TypeScript" : "JavaScript";
  const arch =
    responses.architecture === "feature-based"
      ? "Feature-based"
      : responses.architecture === "type-based" || responses.architecture === "component-based"
      ? "Type-based"
      : responses.architecture === "hybrid"
      ? "Hybrid"
      : responses.architecture === "none"
      ? "None"
      : responses.architecture;
  const css = responses.cssFramework === "tailwind" ? "Tailwind CSS" : "None";
  const testing =
    responses.testing === "none"
      ? "None"
      : responses.testing === "vitest"
      ? "Vitest"
      : "Jest";
  const state =
    responses.stateManagement === "none"
      ? "None"
      : responses.stateManagement === "redux"
      ? "Redux Toolkit"
      : "Zustand";

  const docsLang = responses.docsLanguage === "es" ? "ES" : responses.docsLanguage === "en" ? "EN" : "—";
  const lines = [
    `• ${chalk.bold("Architecture:")} ${chalk.green(arch)}`,
    `• ${chalk.bold("Language:")} ${chalk.green(lang)}`,
    `• ${chalk.bold("CSS:")} ${chalk.yellow(css)}`,
    `• ${chalk.bold("Testing:")} ${chalk.magenta(testing)}`,
  ];

  if (responses.router !== undefined) {
    lines.push(`• ${chalk.bold("Router:")} ${responses.router ? chalk.green("Yes") : chalk.red("No")}`);
  }
  if (responses.bundler) {
    lines.push(`• ${chalk.bold("Bundler:")} ${chalk.cyan(responses.bundler)}`);
  }
  if (responses.adapter && responses.adapter !== "none") {
    lines.push(`• ${chalk.bold("Adapter:")} ${chalk.cyan(responses.adapter)}`);
  }
  lines.push(
    `• ${chalk.bold("State:")} ${chalk.blue(state)}`,
    `• ${chalk.bold("Icons:")} ${chalk.blue(responses.iconLibrary === "none" ? "None" : responses.iconLibrary === "lucide" ? "Lucide" : "Huge")}`,
    `• ${chalk.bold("API Client:")} ${responses.apiClient === "axios" ? chalk.green("Axios") : responses.apiClient === "fetch" ? chalk.yellow("Fetch") : chalk.red("None")}`,
    `• ${chalk.bold("Linter:")} ${responses.linter === "oxlint" ? chalk.green("Oxlint") : responses.linter === "biome" ? chalk.cyan("Biome") : responses.linter === "eslint" ? chalk.yellow("ESLint") : chalk.red("None")}`,
    `• ${chalk.bold("Formatter:")} ${responses.formatter === "oxfmt" ? chalk.green("Oxfmt") : responses.formatter === "prettier" ? chalk.yellow("Prettier") : chalk.red("None")}`,
    `• ${chalk.bold("Docs:")} ${chalk.cyan(docsLang)}`,
    `• ${chalk.bold("Git:")} ${responses.gitInit ? chalk.green("Yes") : chalk.red("No")}`,
    `• ${chalk.bold("README:")} ${responses.readme ? chalk.green("Yes") : chalk.red("No")}`
  );
  return lines.join("\n");
}

export async function getUserInputs(
  projectName,
  { quickSetup = false, framework: rawFramework } = {}
) {
  const framework = normalizeFramework(rawFramework);
  let oldConfig;
  let useOldConfig;

  // Non-interactive quick setup: apply defaults without prompting.
  if (quickSetup) {
    const responses = getDefaultResponses(framework, { projectName });
    await saveConfig(responses);
    return responses;
  }

  if (await configExists()) {
    oldConfig = await loadConfig();
    oldConfig.projectName = projectName;
    // Sanitize cached setup against current framework capabilities
    oldConfig = sanitizeResponsesForFramework(framework, oldConfig);

    note(
      `Previous setup found:\n\n${formatConfig(oldConfig)}\n`,
      "Previous Configuration"
    );

    const useExisting = await select({
      message: "How would you like to proceed?",
      options: [
        { value: true, label: "Continue with previous setup" },
        { value: false, label: "Start fresh (new setup)" },
      ],
      initialValue: true,
    });

    if (isCancel(useExisting)) onCancel();
    useOldConfig = useExisting;

    if (useOldConfig) {
      if (oldConfig.apiClient === undefined) {
        oldConfig.apiClient = oldConfig.axios ? "axios" : "none";
      }
      if (oldConfig.formatter === undefined) {
        oldConfig.formatter = "none";
      }
      if (oldConfig.docsLanguage === undefined) {
        oldConfig.docsLanguage = "en";
      }
      return { ...oldConfig, projectName };
    }
  }

  // Quick Setup
  const isRouterSupported = isPromptVisible(framework, "router");
  const quickSetupMessage = isRouterSupported
    ? "Quick Setup? (TypeScript + Tailwind + Feature-based + Router + ESLint + Vitest)"
    : "Quick Setup? (TypeScript + Tailwind + Feature-based + ESLint + Vitest)";

  const quickSetupChoice = await confirm({
    message: quickSetupMessage,
    initialValue: true,
  });
  if (isCancel(quickSetupChoice)) onCancel();

  if (quickSetupChoice) {
    const responses = getDefaultResponses(framework, { projectName });
    await saveConfig(responses);
    return responses;
  }

  // Custom setup
  const rawArchOptions = [
    {
      label: "Feature-based",
      value: "feature-based",
      hint: "Scales to large apps — code grouped by business domain",
    },
    {
      label: "Type-based",
      value: "type-based",
      hint: "Small apps / component libraries — code grouped by UI type",
    },
    {
      label: "Hybrid",
      value: "hybrid",
      hint: "Feature slices with centralized shared UI",
    },
    {
      label: "None",
      value: "none",
      hint: "Flat structure without architectural layers",
    },
  ];
  const architectureOptions = filterCompatibleChoices(framework, "architecture", rawArchOptions);

  const architecture = await select({
    message: "Which project architecture do you want?",
    options: architectureOptions,
    initialValue: architectureOptions[0]?.value || "feature-based",
  });
  if (isCancel(architecture)) onCancel();

  const rawLangOptions = [
    { label: "TypeScript", value: "ts" },
    { label: "JavaScript", value: "js" },
  ];
  const languageOptions = filterCompatibleChoices(framework, "language", rawLangOptions);

  const language = await select({
    message: "Which language do you want to use?",
    options: languageOptions,
    initialValue: "ts",
  });
  if (isCancel(language)) onCancel();

  const rawCssOptions = [
    { label: "Tailwind CSS", value: "tailwind" },
    { label: "None", value: "none" },
  ];
  const cssOptions = filterCompatibleChoices(framework, "styling", rawCssOptions);

  const cssFramework = await select({
    message: "Which CSS framework do you want to use?",
    options: cssOptions,
    initialValue: cssOptions[0]?.value || "tailwind",
  });
  if (isCancel(cssFramework)) onCancel();

  const testing = await select({
    message: "Which testing framework do you want to set up?",
    options: [
      { label: "Vitest", value: "vitest" },
      { label: "Jest", value: "jest" },
      { label: "None", value: "none" },
    ],
    initialValue: "vitest",
  });
  if (isCancel(testing)) onCancel();

  // Router: gated by CLIENT_ROUTING capability
  let router = false;
  if (isPromptVisible(framework, "router")) {
    const routerChoice = await confirm({
      message: "Would you like to install React Router?",
      initialValue: true,
    });
    if (isCancel(routerChoice)) onCancel();
    router = routerChoice;
  }

  // Bundler: gated by BUNDLER_SELECTION capability
  let bundler;
  if (isPromptVisible(framework, "bundler")) {
    const rawBundlerOptions = [
      { label: "Turbopack", value: "turbopack" },
      { label: "Webpack", value: "webpack" },
    ];
    const bundlerOptions = filterCompatibleChoices(framework, "bundler", rawBundlerOptions);
    bundler = await select({
      message: "Which bundler do you want to use?",
      options: bundlerOptions,
      initialValue: bundlerOptions[0]?.value || "turbopack",
    });
    if (isCancel(bundler)) onCancel();
  }

  // Adapter: gated by ADAPTERS capability
  let adapter;
  if (isPromptVisible(framework, "adapter")) {
    const rawAdapterOptions = [
      { label: "None (default)", value: "none" },
      { label: "Node", value: "node" },
      { label: "Vercel", value: "vercel" },
      { label: "Cloudflare", value: "cloudflare" },
      { label: "Static", value: "static" },
    ];
    const adapterOptions = filterCompatibleChoices(framework, "adapter", rawAdapterOptions);
    adapter = await select({
      message: "Which deployment adapter do you want to use?",
      options: adapterOptions,
      initialValue: "none",
    });
    if (isCancel(adapter)) onCancel();
  }

  const stateManagement = await select({
    message: "Which state management library do you want to use?",
    options: [
      { label: "None", value: "none" },
      { label: "Redux Toolkit", value: "redux" },
      { label: "Zustand", value: "zustand" },
    ],
    initialValue: "none",
  });
  if (isCancel(stateManagement)) onCancel();

  const iconLibrary = await select({
    message: "Which icon library would you like to use?",
    options: [
      { label: "None", value: "none" },
      { label: "Lucide Icons", value: "lucide" },
      { label: "Huge Icons", value: "huge" },
    ],
    initialValue: "none",
  });
  if (isCancel(iconLibrary)) onCancel();

  const apiClient = await select({
    message: "Which API client do you want to use?",
    options: [
      { label: "None", value: "none" },
      { label: "Axios", value: "axios" },
      { label: "Fetch (native)", value: "fetch" },
    ],
    initialValue: "none",
  });
  if (isCancel(apiClient)) onCancel();

  const gitInit = await confirm({
    message: "Would you like to initialize a Git repository?",
    initialValue: false,
  });
  if (isCancel(gitInit)) onCancel();

  const rawLinterChoices = [
    { label: "ESLint", value: "eslint", hint: "Industry standard JavaScript linter (Recommended)" },
    { label: "Oxlint", value: "oxlint", hint: "Fast Rust-based linter" },
    { label: "Biome", value: "biome", hint: "Toolchain for web projects" },
    { label: "None", value: "none" },
  ];
  const linterChoices = filterCompatibleChoices(framework, "linter", rawLinterChoices);

  const linter = await select({
    message: "Which linter do you want to use?",
    options: linterChoices,
    initialValue: linterChoices[0]?.value || "eslint",
  });
  if (isCancel(linter)) onCancel();

  let formatter = "none";
  if (linter !== "none") {
    const rawFormatterOptions =
      linter === "eslint"
        ? [
            { label: "None", value: "none" },
            { label: "Prettier", value: "prettier" },
          ]
        : [
            { label: "None", value: "none" },
            { label: "Oxfmt (Recommended)", value: "oxfmt" },
            { label: "Prettier", value: "prettier" },
          ];
    const formatterOptions = filterCompatibleChoices(framework, "formatter", rawFormatterOptions);
    const initialVal = formatterOptions.some(
      (o) => o.value === (linter === "eslint" ? "prettier" : "oxfmt")
    )
      ? linter === "eslint"
        ? "prettier"
        : "oxfmt"
      : formatterOptions[0]?.value || "none";

    formatter = await select({
      message: "Which formatter do you want to use?",
      options: formatterOptions,
      initialValue: initialVal,
    });
    if (isCancel(formatter)) onCancel();
  }

  const docsLanguage = await select({
    message: "Which docs language do you want?",
    options: [
      { label: "English", value: "en" },
      { label: "Español", value: "es" },
    ],
    initialValue: "en",
  });
  if (isCancel(docsLanguage)) onCancel();

  const readme = await confirm({
    message: "Would you like to generate a README.md and LICENSE?",
    initialValue: true,
  });
  if (isCancel(readme)) onCancel();

  const responses = {
    projectName,
    frameworkName: framework.name,
    frameworkVariant: framework.variant,
    architecture,
    language,
    cssFramework,
    testing,
    router,
    stateManagement,
    iconLibrary,
    apiClient,
    linter,
    formatter,
    docsLanguage,
    gitInit,
    readme,
  };

  if (bundler !== undefined) {
    responses.bundler = bundler;
  }
  if (adapter !== undefined && adapter !== "none") {
    responses.adapter = adapter;
  }

  await saveConfig(responses);
  return responses;
}
