import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// ---------------------------------------------------------------------------
// Constants - keep in sync with docs/manifest-v2.md and ROADMAP
// ---------------------------------------------------------------------------
export const MANIFEST_VERSION = 2;
export const SCHEMA_URL = "https://lumen-sh.github.io/create-lumen/schema/lumen.config.v2.json";

export const FRAMEWORK_NAMES = ["react", "next"];
export const FRAMEWORK_VARIANTS = ["vite", "app-router", "pages-router"];
export const FRAMEWORK_BUNDLERS = ["turbopack", "webpack"];
export const FRAMEWORK_ADAPTERS = ["node", "vercel", "cloudflare", "static"];

export const STYLING_ENGINES = ["tailwind", "bootstrap", "none"];
export const ARCHITECTURE_TYPES = ["feature-based", "type-based", "hybrid", "none"];
export const UI_KITS = ["shadcn", "none"];
export const DOCS_LANGUAGES = ["en", "es"];
export const TOOLING_LANGUAGES = ["ts", "js"];
export const TOOLING_LINTERS = ["eslint", "oxlint", "biome", "none"];
export const TOOLING_FORMATTERS = ["prettier", "oxfmt", "none"];

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------
const frameworkSchema = z
  .object({
    name: z.enum(FRAMEWORK_NAMES),
    variant: z.enum(FRAMEWORK_VARIANTS),
    bundler: z.enum(FRAMEWORK_BUNDLERS).optional(),
    adapter: z.enum(FRAMEWORK_ADAPTERS).optional(),
  })
  .strict();

const stylingSchema = z
  .object({
    engine: z.enum(STYLING_ENGINES),
  })
  .strict();

const architectureSchema = z
  .object({
    type: z.enum(ARCHITECTURE_TYPES),
  })
  .strict();

const uiSchema = z
  .object({
    kit: z.enum(UI_KITS),
  })
  .strict();

const docsSchema = z
  .object({
    language: z.enum(DOCS_LANGUAGES),
  })
  .strict();

const pathsSchema = z
  .object({
    features: z.string().min(1),
    components: z.string().min(1),
    services: z.string().min(1),
    hooks: z.string().min(1),
    pages: z.string().min(1),
    ui: z.string().min(1),
  })
  .strict();

const toolingSchema = z
  .object({
    language: z.enum(TOOLING_LANGUAGES),
    linter: z.enum(TOOLING_LINTERS),
    formatter: z.enum(TOOLING_FORMATTERS),
  })
  .strict();

// ---------------------------------------------------------------------------
// Top-level manifest v2 - strict, no extra keys except $schema
// ---------------------------------------------------------------------------
export const manifestSchemaV2 = z
  .object({
    $schema: z.string().url().optional().default(SCHEMA_URL),
    manifestVersion: z.literal(MANIFEST_VERSION),
    framework: frameworkSchema,
    styling: stylingSchema,
    architecture: architectureSchema,
    ui: uiSchema,
    docs: docsSchema,
    paths: pathsSchema,
    tooling: toolingSchema,
    reactCompiler: z.boolean().optional(),
    agentDocs: z.boolean().optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    const { framework, architecture, styling, ui } = val;

    // framework.variant must match framework.name
    if (framework.name === "react" && framework.variant !== "vite") {
      ctx.addIssue({
        code: "custom",
        path: ["framework", "variant"],
        message: `framework.variant must be "vite" when framework.name is "react" (got "${framework.variant}")`,
      });
    }
    if (framework.name === "next" && framework.variant === "vite") {
      ctx.addIssue({
        code: "custom",
        path: ["framework", "variant"],
        message: `framework.variant must be "app-router" or "pages-router" when framework.name is "next" (got "vite")`,
      });
    }

    // bundler only for Next.js
    if (framework.bundler !== undefined && framework.name !== "next") {
      ctx.addIssue({
        code: "custom",
        path: ["framework", "bundler"],
        message: `framework.bundler is only valid when framework.name is "next"`,
      });
    }

    // adapter only for Next.js (behavior in #22)
    if (framework.adapter !== undefined && framework.name !== "next") {
      ctx.addIssue({
        code: "custom",
        path: ["framework", "adapter"],
        message: `framework.adapter is only valid when framework.name is "next"`,
      });
    }

    // architecture scoping per framework (#34)
    const allowedByFramework =
      framework.name === "react"
        ? ["feature-based", "type-based", "none"]
        : ["feature-based", "hybrid", "none"];
    if (!allowedByFramework.includes(architecture.type)) {
      ctx.addIssue({
        code: "custom",
        path: ["architecture", "type"],
        message: `architecture.type "${architecture.type}" is not valid for framework "${framework.name}" (allowed: ${allowedByFramework.join(", ")})`,
      });
    }

    // shadcn requires tailwind (#33)
    if (ui.kit === "shadcn" && styling.engine !== "tailwind") {
      ctx.addIssue({
        code: "custom",
        path: ["ui", "kit"],
        message: `ui.kit "shadcn" requires styling.engine "tailwind" (got "${styling.engine}")`,
      });
    }
  });

// ---------------------------------------------------------------------------
// v1 detection - flat shape from create-lumen 1.x
// ---------------------------------------------------------------------------
const V1_FLAT_KEYS = ["css", "cssFramework", "architecture", "language", "router", "stateManagement", "iconLibrary", "apiClient", "testing"];

export function isV1Manifest(raw) {
  if (!raw || typeof raw !== "object") return false;
  // v1 had framework as string or missing manifestVersion
  if (raw.manifestVersion === 1) return true;
  if (typeof raw.framework === "string") return true;
  if (raw.framework === undefined && V1_FLAT_KEYS.some((k) => k in raw)) return true;
  // flat config without nested framework object but with css/architecture as string
  if (typeof raw.architecture === "string" && typeof raw.framework !== "object") return true;
  return false;
}

export function formatZodError(error) {
  try {
    const ve = fromZodError(error, {
      prefix: "Manifest validation failed",
      prefixSeparator: ": ",
      issueSeparator: "; ",
    });
    return ve.message;
  } catch {
    return error.message;
  }
}

/**
 * Parse and validate a manifest v2 object.
 * - Throws with migration-oriented message for v1 manifests (#14 AC)
 * - Throws with human-friendly field path + expected shape for malformed v2
 * @param {unknown} raw
 * @returns {import("zod").infer<typeof manifestSchemaV2>}
 */
export function parseManifest(raw) {
  if (isV1Manifest(raw)) {
    throw new Error(
      `Manifest v1 detected (flat config). create-lumen v2 uses a nested manifest (manifestVersion: 2).\n` +
        `Please migrate: delete the old config and re-run create-lumen, or see the migration guide (docs/migration/v1-to-v2.md).\n` +
        `Raw keys: ${Object.keys(raw || {}).join(", ")}`
    );
  }

  const result = manifestSchemaV2.safeParse(raw);
  if (!result.success) {
    const msg = formatZodError(result.error);
    const err = new Error(msg);
    err.cause = result.error;
    throw err;
  }
  return result.data;
}

// Re-export type helper for JSDoc (z.infer)
// /** @typedef {z.infer<typeof manifestSchemaV2>} ManifestV2 */
