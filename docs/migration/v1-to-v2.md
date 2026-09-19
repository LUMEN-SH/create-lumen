# Migration Guide: create-lumen v1.x → v2.0.0

> **Target Audience**: Developers with projects scaffolded using `create-lumen` 1.x or maintaining custom `lumen.config.json` files.  
> **Applicable Versions**: `create-lumen` >= 2.0.0, `lumen-cli` >= 1.0.0  
> **Related Issues**: `#17`, `#13`, `#14`, `#15`, `#16`, `#9`, `#28`

---

## 1. Why v2?

`create-lumen` 1.x used a flat configuration format focused exclusively on Vite + React. It lacked support for:
- Multi-framework capabilities (Next.js App Router and Pages Router).
- Framework-specific options (Turbopack, adapters, server/client boundaries).
- Dynamic and explicit generator path mappings consumed by `lumen-cli`.
- Tooling parity across linters (`eslint`, `oxlint`, `biome`) and formatters (`prettier`, `oxfmt`).

v2 introduces a strict, nested manifest (`manifestVersion: 2`) validated by Zod and JSON Schema.

---

## 2. Fast-Track: "I Used the CLI Defaults"

If your project was generated using standard options (React + Vite + TypeScript + Tailwind + feature-based architecture), you can migrate in 30 seconds:

1. Replace your `<projectRoot>/lumen.config.json` with this file:
   ```json
   {
     "$schema": "https://lumen.dev/schema/lumen.config.v2.json",
     "manifestVersion": 2,
     "framework": {
       "name": "react",
       "variant": "vite"
     },
     "styling": {
       "engine": "tailwind"
     },
     "architecture": {
       "type": "feature-based"
     },
     "ui": {
       "kit": "none"
     },
     "docs": {
       "language": "en"
     },
     "paths": {
       "features": "src/features",
       "components": "src/shared/components",
       "services": "src/shared/services",
       "hooks": "src/shared/hooks",
       "pages": "src/app/router",
       "ui": "src/shared/components/ui"
     },
     "tooling": {
       "language": "ts",
       "linter": "eslint",
       "formatter": "prettier"
     }
   }
   ```
2. Run `npx create-lumen --version` or `lumen doctor` to verify configuration integrity.

> [!TIP]
> Alternatively, if you want a completely fresh scaffold, you can run:
> ```bash
> npx create-lumen@alpha my-new-app
> ```
> and copy over your custom feature code into `src/features/`.

---

## 3. What Happens with a v1 Config?

Both `create-lumen` and `lumen-cli` strictly fail on v1 manifests with exit code `1`:

```
Manifest v1 detected (flat config). create-lumen v2 uses a nested manifest (manifestVersion: 2).
Please migrate: delete the old config and re-run create-lumen, or see the migration guide (docs/migration/v1-to-v2.md).
Raw keys: framework, css, architecture, language, router, stateManagement...
```

This fail-fast behavior protects your codebase from accidental file generation in invalid directories.

### How to Fix
1. Open your `lumen.config.json`.
2. Delete the legacy keys or replace the entire file following the [Field-by-Field Mapping](#4-field-by-field-mapping-reference) below.
3. Validate your manifest against the JSON schema (`https://lumen.dev/schema/lumen.config.v2.json`).

---

## 4. Field-by-Field Mapping Reference

Every key from v1 has a designated equivalent, is scoped into a nested namespace, or has been intentionally removed from the top-level manifest.

| v1 Field (Flat) | v1 Type / Values | v2 Location & Shape | Description & Migration Notes |
| :--- | :--- | :--- | :--- |
| *(none)* | *(absent)* | `"manifestVersion": 2` | **Required integer.** Explicit schema version gate. Must be `2`. |
| *(none)* | *(absent)* | `"$schema": "https://lumen.dev/schema/lumen.config.v2.json"` | **Optional / Defaulted.** Provides IDE autocompletion and hover documentation. |
| `framework` | `"react"` | `"framework": { "name": "react", "variant": "vite" }` | Framework is now an object. In v2, `react` requires `variant: "vite"`. Next.js targets use `name: "next"` with `variant: "app-router"` or `"pages-router"`. |
| *(none)* | *(absent)* | `"framework.bundler": "turbopack" \| "webpack"` | Optional Next.js bundler selector. Invalid on React+Vite. |
| *(none)* | *(absent)* | `"framework.adapter": "node" \| "vercel" \| "cloudflare" \| "static"` | Optional Next.js deployment adapter. Invalid on React+Vite. |
| `css` / `cssFramework` | `"tailwind"`, `"bootstrap"`, `"none"` | `"styling": { "engine": "tailwind" \| "bootstrap" \| "none" }` | Renamed and nested under `styling`. **Important:** Tailwind in v2 is strictly **Tailwind CSS v4** (Tailwind v3 is dropped). |
| `architecture` | `"feature-based"`, `"component-based"` | `"architecture": { "type": "feature-based" \| "type-based" \| "hybrid" \| "none" }` | Scoped per framework: React allows `feature-based`, `type-based`, and `none`. Next.js allows `feature-based`, `hybrid`, and `none` (Next.js supports `hybrid` instead of `type-based`). |
| *(none)* | *(absent)* | `"ui": { "kit": "shadcn" \| "none" }` | UI kit selection. **Constraint:** `shadcn` requires `styling.engine: "tailwind"`. |
| *(none)* | *(absent)* | `"docs": { "language": "en" \| "es" }` | Project documentation language choice for generated readmes and CLI generators. |
| *(none)* | *(hardcoded)* | `"paths": { "features", "components", "services", "hooks", "pages", "ui" }` | **Required object.** Explicit relative paths from project root, resolved deterministically per framework and architecture. See [Path Resolution](#5-path-resolution-reference). |
| `language` | `"ts"`, `"js"` | `"tooling": { "language": "ts" \| "js", ... }` | Moved into the `tooling` object. |
| `linter` | `"eslint"`, `"oxlint"`, `"none"` | `"tooling": { "linter": "eslint" \| "oxlint" \| "biome" \| "none", ... }` | Moved into `tooling`. Added support for `biome`. |
| *(none)* | *(absent)* | `"tooling": { "formatter": "prettier" \| "oxfmt" \| "none" }` | Formatter selection moved into `tooling`. |
| `router` | `"react-router"`, `"none"` | **Removed from manifest** | In React+Vite, router selection is handled at scaffold time via templates/overlays. In Next.js, routing is intrinsic to the framework variant. |
| `stateManagement` | `"zustand"`, `"redux"`, `"none"` | **Removed from manifest** | State management dependencies are scaffolded into `package.json` and store directories; not required in generator manifest. |
| `iconLibrary` | `"lucide"`, `"hugeicons"`, `"none"` | **Removed from manifest** | Overlay dependency handled during project initialization. |
| `apiClient` | `"axios"`, `"fetch"`, `"none"` | **Removed from manifest** | Handled in `src/shared/lib/axios` vs `src/shared/api` by scaffolder templates; path mapping in v2 points to `services`. |
| `testing` | `"vitest"`, `"jest"`, `"none"` | **Removed from manifest** | Test runner scripts and dependencies live directly in `package.json`. |
| *(none)* | *(absent)* | `"reactCompiler": true \| false` | Optional cross-cutting compiler flag (Next.js & future React 19 toolchains). |
| *(none)* | *(absent)* | `"agentDocs": true \| false` | Optional flag indicating inclusion of LLM assistant guidelines (`AGENTS.md`). |

---

## 5. Path Resolution Reference

In v1, paths were hardcoded in generator routines. In v2, `paths` explicitly instructs `lumen-cli` where code belongs:

### 1. React + Vite (Feature-Based):
```json
"paths": {
  "features": "src/features",
  "components": "src/shared/components",
  "services": "src/shared/services",
  "hooks": "src/shared/hooks",
  "pages": "src/app/router",
  "ui": "src/shared/components/ui"
}
```

### 2. React + Vite (Type-Based):
```json
"paths": {
  "features": "src/features",
  "components": "src/components",
  "services": "src/services",
  "hooks": "src/hooks",
  "pages": "src/pages",
  "ui": "src/ui"
}
```

### 3. Next.js (App Router, Feature-Based or Hybrid):
```json
"paths": {
  "features": "src/features",
  "components": "src/shared/components",
  "services": "src/shared/services",
  "hooks": "src/shared/hooks",
  "pages": "app",
  "ui": "src/shared/components/ui"
}
```

---

## 6. Example Before & After

### v1 (Old `lumen.config.json`)
```json
{
  "framework": "react",
  "css": "tailwind",
  "architecture": "feature-based",
  "language": "ts",
  "router": true,
  "stateManagement": "none",
  "iconLibrary": "none",
  "apiClient": "none",
  "testing": "vitest",
  "linter": "eslint",
  "formatter": "prettier"
}
```

### v2 (New `lumen.config.json`)
```json
{
  "$schema": "https://lumen.dev/schema/lumen.config.v2.json",
  "manifestVersion": 2,
  "framework": {
    "name": "react",
    "variant": "vite"
  },
  "styling": {
    "engine": "tailwind"
  },
  "architecture": {
    "type": "feature-based"
  },
  "ui": {
    "kit": "none"
  },
  "docs": {
    "language": "en"
  },
  "paths": {
    "features": "src/features",
    "components": "src/shared/components",
    "services": "src/shared/services",
    "hooks": "src/shared/hooks",
    "pages": "src/app/router",
    "ui": "src/shared/components/ui"
  },
  "tooling": {
    "language": "ts",
    "linter": "eslint",
    "formatter": "prettier"
  }
}
```

---

## 7. Tailwind CSS v4 Notes

If you migrate a project using Tailwind CSS:
- `create-lumen` 2.0 dropped support for Tailwind v3.
- In v2, Tailwind configuration is CSS-first:
  - Global stylesheet: `src/shared/styles/globals.css` (or `src/styles/globals.css`) uses `@import "tailwindcss";`.
  - Color tokens and dark mode styling live in `themes.css` using `@theme` and `@custom-variant dark`.
  - There is no longer a `tailwind.config.js` or `tailwind.config.ts`.
  - The Vite build plugin is `@tailwindcss/vite`.

---

## References

- [Manifest v2 Overview](../manifest-v2.md)
- [Manifest & Template Shared Contract](../manifest-template-contract.md)
- [JSON Schema Specification](../../schema/lumen.config.v2.json)
- [ADR 0001: Scaffolder Base Strategy](../adr/0001-scaffolder-base-strategy.md)
