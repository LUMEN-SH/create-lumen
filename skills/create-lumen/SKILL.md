---
name: create-lumen
description: Scaffold and extend a lumen v2 project (manifestVersion 2). Read lumen.config.json, resolve generator paths via manifest.paths, respect feature barrels, @/* alias, harness commands, and validation modes.
---

# create-lumen

## When to use

Use this skill when the working directory contains (or should contain) a
`lumen.config.json` with `manifestVersion: 2`: scaffolding follow-ups,
`lumen g` generation, `lumen doctor` / `lumen harness` diagnostics.

Do NOT guess layout. Every target directory comes from the manifest.

## 1. Read `lumen.config.json`

```bash
cat lumen.config.json
```

Required top-level keys: `manifestVersion: 2`, `framework`, `styling`,
`architecture`, `ui`, `docs`, `paths`, `tooling`, `harness`.
Source of truth: `src/manifest/schema.js` (`parseManifest`, Zod strict).
Full spec: `docs/contracts/manifest-v2-contract.md`, `docs/manifest-v2.md`.

If `manifestVersion` is missing / `framework` is a string → **v1 manifest**:
fail fast (exit 1), generate nothing, point to
`docs/migration/v1-to-v2.md`.

## 2. Resolve paths via `manifest.paths` (never hardcode)

Generators MUST do `<root>/<manifest.paths.<key>>`. POSIX `/` separators.

| Framework | Preset | features | components | services | hooks | pages | ui |
|---|---|---|---|---|---|---|---|
| React+Vite | `feature-based` | `src/features` | `src/shared/components` | `src/shared/services` | `src/shared/hooks` | `src/app/router` | `src/shared/components/ui` |
| React+Vite | `type-based` | `src/features` | `src/components` | `src/services` | `src/hooks` | `src/pages` | `src/ui` |
| Next App | `feature-based`/`hybrid` | `src/features` | `src/shared/components` | `src/shared/services` | `src/shared/hooks` | `app` | `src/shared/components/ui` |
| Next Pages | `feature-based` | `src/features` | `src/shared/components` | `src/shared/services` | `src/shared/hooks` | `pages` | `src/shared/components/ui` |
| Any | `none` | `src` | `src` (`components/` for Next) | `src/services` | `src/hooks` | per framework | `src…/ui` |

Resolver: `src/manifest/paths.js` (`resolvePaths`). Fixtures:
`schema/fixtures/v2/valid/react-vite-feature-based.json`,
`full-kitchen-sink.json`.

## 3. Feature structure + barrels

New feature at `<paths.features>/<name>/` (e.g. `src/features/billing`):

```bash
lumen g feature billing
lumen g component billing/InvoiceCard --feature billing
lumen g hook useBilling --feature billing
lumen g service billing-api --feature billing
```

Rules:

- Private subfolders: `components/ hooks/ layouts/ pages/ services/ store/ types/`.
- Public barrel required: `<feature>/index.ts` (or `.js` when
  `tooling.language === "js"`). External code imports only the barrel:
  `import { InvoiceCard } from "@/features/billing"`.
- Extensions: `.tsx`/`.jsx` for JSX components, `.ts`/`.js` for pure logic,
  per `tooling.language`.

## 4. Path alias `@/*`

`@/*` → `<root>/src/*` (guaranteed by `tsconfig` + Vite/Next config).
Feature-based: shared imports via `@/shared/...`.
Type-based: `@/components/...`, `@/hooks/...`, `@/services/...`.

```ts
import { Button } from "@/shared/components/ui/button";
import { useBilling } from "@/features/billing";
```

## 5. `harness.commands` execution

`lumen harness` runs each entry in order; `required: true` (default) fails
the run on error, `required: false` warns and continues.

```json
{ "name": "lint", "command": "oxlint .", "required": true }
```

Defaults: `lint (oxlint .)`, `format (oxfmt --check .)`, `types (tsc -b)`,
`test (vitest run)`, `build (npm run build)`.

## 6. `architecture.validation` modes

| Mode | Behavior |
|---|---|
| `strict` | Enforce barrels, encapsulation, path rules; fail on violation. |
| `relaxed` | Warn on violation, still generate. |
| `none` | Skip architecture checks. |

Note: `architecture.preset` is canonical; legacy `type` is accepted as an
alias (`parseManifest` normalizes both). Valid presets: React →
`feature-based|type-based|none`; Next → `feature-based|hybrid|none`.

## 7. Common errors — reject, don't patch around

- **v1 rejection:** flat config (`css`, string `framework`/`architecture`) →
  exit 1 + migration pointer. Never partially generate.
- **`shadcn` → `tailwind`:** `ui.kit: "shadcn"` requires
  `styling.engine: "tailwind"` (v4 CSS-first, no `tailwind.config.js`).
- **`bundler`/`adapter` Next-only:** `framework.bundler` (`turbopack|webpack`)
  and `adapter` (`node|vercel|cloudflare|static`) are prohibited on `react`.
  `react` variant MUST be `vite`; `next` MUST be `app-router|pages-router`.
