import { promises as fsp } from "fs";
import path from "path";
import {
  FRAGMENT_SCOPES,
  resolveFragments,
  applyFragments,
  langFileFilter,
  pruneRedundantGitkeeps,
} from "./engine/composition.js";

export {
  FRAGMENT_SCOPES,
  resolveFragments,
  applyFragments,
  langFileFilter,
  pruneRedundantGitkeeps,
};

/**
 * Inject architecture templates into projectPath from composed fragments.
 * Composes framework entry points, architecture layout, and styling component overlays.
 *
 * @param {string} projectPath
 * @param {string} templatesDir
 * @param {string} architecture
 * @param {string} language
 * @param {string} cssFramework
 */
export async function injectArchitecture(
  projectPath,
  templatesDir,
  architecture,
  language,
  cssFramework
) {
  const responses = { architecture, language, cssFramework };
  const allFragments = resolveFragments(responses, templatesDir);
  const archFragments = allFragments.filter(
    (f) =>
      f.scope === FRAGMENT_SCOPES.FRAMEWORK ||
      f.scope === FRAGMENT_SCOPES.ARCH ||
      f.scope === FRAGMENT_SCOPES.STYLING
  );
  await applyFragments(projectPath, archFragments, {
    language,
    templatesDir,
    responses,
  });
}

/**
 * Inject code formatter configuration and wiring from composed fragments.
 *
 * @param {string} projectPath
 * @param {string} templatesDir
 * @param {object} responses
 */
export async function injectFormatter(projectPath, templatesDir, responses) {
  if (!responses.formatter || responses.formatter === "none") return;
  const allFragments = resolveFragments(responses, templatesDir);
  const formatterFragments = allFragments.filter(
    (f) => f.scope === FRAGMENT_SCOPES.TOOLING && f.category === "formatter"
  );
  await applyFragments(projectPath, formatterFragments, {
    language: responses.language,
    templatesDir,
    responses,
  });
}

/**
 * Inject conditional tooling features (state, router, icons, api client, testing, linter, scripts)
 * using the composed fragment pipeline.
 *
 * @param {string} projectPath
 * @param {string} templatesDir
 * @param {object} responses
 * @param {string} architecture
 * @param {string} language
 */
export async function injectConditionals(
  projectPath,
  templatesDir,
  responses,
  architecture,
  language
) {
  const mergedResponses = { ...responses, architecture, language };
  const allFragments = resolveFragments(mergedResponses, templatesDir);
  const conditionalFragments = allFragments.filter(
    (f) => f.scope === FRAGMENT_SCOPES.TOOLING && f.category !== "formatter"
  );
  await applyFragments(projectPath, conditionalFragments, {
    language,
    templatesDir,
    responses: mergedResponses,
  });
}

/**
 * Inject linter configuration and package scripts using the composed fragment pipeline.
 *
 * @param {string} projectPath
 * @param {string} templatesDir
 * @param {string} linter
 * @param {string} language
 * @param {string|object} framework
 */
export async function injectLinter(
  projectPath,
  templatesDir,
  linter,
  language,
  framework
) {
  const responses = { linter, language, framework };
  const allFragments = resolveFragments(responses, templatesDir);
  const linterFragments = allFragments.filter(
    (f) => f.scope === FRAGMENT_SCOPES.TOOLING && f.category === "linter"
  );
  await applyFragments(projectPath, linterFragments, {
    language,
    templatesDir,
    responses,
  });
}

/**
 * High-level composition API: inject all capability fragments in documented precedence order.
 *
 * @param {string} projectPath
 * @param {string} templatesDir
 * @param {object} responses
 */
export async function injectComposedFragments(projectPath, templatesDir, responses) {
  const fragments = resolveFragments(responses, templatesDir);
  await applyFragments(projectPath, fragments, {
    language: responses.language,
    templatesDir,
    responses,
  });
}
