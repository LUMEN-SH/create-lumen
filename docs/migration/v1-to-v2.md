# Migration Guide: create-lumen v1.x â†’ v2.0.0

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

---

## 3. What Happens with a v1 Config?

Both `create-lumen` and `lumen-cli` strictly fail on v1 manifests with exit code `1`:

```
Manifest v1 detected (flat config). create-lumen v2 uses a nested manifest (manifestVersion: 2).
Please migrate: delete the old config and re-run create-lumen, or see the migration guide (docs/migration/v1-to-v2.md).
Raw keys: framework, css, architecture, language, router, stateManagement...
```

This fail-fast behavior protects your codebase from accidental file generation in invalid directories.

---

## 4. Field-by-Field Mapping Reference

| v1 Field (Flat) | v2 Target Path | Notes & Migration Details |
|---|---|---|
| *(none)* | `"$schema"` | Required in canonical output: `"https://lumen.dev/schema/lumen.config.v2.json"`. |
| *(none)* | `"manifestVersion"` | Must be integer `2`. |
| `"framework": "react"` | `"framework": { "name": "react", "variant": "vite" }` | In v2, `framework` is an object. `name` is `"react"` or `"next"`. For React, `variant` is always `"vite"`. |
| *(none)* | `"framework.bundler"` | Optional, Next.js only (`"turbopack"` or `"webpack"`). Omit for React. |
| *(none)* | `"framework.adapter"` | Optional, Next.js only (`"node"`, `"vercel"`, `"cloudflare"`, `"static"`). Omit for React. |
| `"css": "tailwind"` or `"cssFramework"` | `"styling": { "engine": "tailwind" }` | Engines: `"tailwind"`, `"bootstrap"`, `"none"`. Tailwind is always v4. |
| `"architecture": "feature-based"` | `"architecture": { "type": "feature-based" }` | React supports: `"feature-based"`, `"type-based"`, `"none"`. Next.js supports: `"feature-based"`, `"hybrid"`, `"none"`. |
| *(none)* | `"ui": { "kit": "none" }` | Options: `"none"` or `"shadcn"`. If `"shadcn"`, `styling.engine` must be `"tailwind"`. |
| *(none)* | `"docs": { "language": "en" }` | Single documentation language chosen at init: `"en"` or `"es"`. |
| *(hardcoded in v1)* | `"paths": { ... }` | Explicit object containing 6 required POSIX directory paths: `features`, `components`, `services`, `hooks`, `pages`, `ui`. See table below. |
| `"language": "ts"` | `"tooling.language"` | `"ts"` or `"js"`. |
| `"linter": "eslint"` | `"tooling.linter"` | `"eslint"`, `"oxlint"`, `"biome"`, or `"none"`. |
| `"formatter": "prettier"` | `"tooling.formatter"` | `"prettier"`, `"oxfmt"`, or `"none"`. |
| *(none)* | `"reactCompiler"` | Optional boolean flag (`true` to enable React 19 Compiler). |
| *(none)* | `"agentDocs"` | Optional boolean flag (`true` to generate AI-agent developer docs). |
| `"router"`, `"stateManagement"`, `"iconLibrary"`, `"apiClient"`, `"testing"` | *Removed from manifest* | Runtime dependencies remain configured in `package.json`. These are no longer stored in the manifest. |

---

## 5. Path Resolution Reference

In v1, paths were hardcoded in generator routines. In v2, `paths` explicitly instructs `lumen-cli` where code belongs:

### React + Vite Feature-Based:
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

### React + Vite type-based:
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
