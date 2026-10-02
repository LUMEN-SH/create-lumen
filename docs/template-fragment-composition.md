# Template Fragment Composition Model

> **Milestone**: 2 (Engine: capabilities + options)  
> **Tracking Issue**: `create-lumen#27` (supersedes cross-product filtering, addresses `create-lumen#10`, `create-lumen#38`)  
> **Specification**: 5-layer deterministic capability-scoped fragment pipeline

---

## 1. Overview & Objective

Prior to Milestone 2, template generation relied on cross-product directory combinations (e.g. `conditional/router/<arch>/<cssFramework>`, `component-styles/<cssFramework>/<arch>`). This led to exponential directory duplication, fragile file overwriting, and scattered `if (framework === "next")` branching.

The **Template Fragment Composition Model** decomposes templates into capability-scoped, isolated fragments composed through a single deterministic pipeline:

$$\mathbf{Base} \xrightarrow{(1)} \mathbf{Framework} \xrightarrow{(2)} \mathbf{Architecture} \xrightarrow{(3)} \mathbf{Styling} \xrightarrow{(4)} \mathbf{Tooling}$$

This architecture provides:
1. **Deterministic Precedence**: Documented, guaranteed overlay order where higher layers cleanly supersede lower layers.
2. **Zero Framework Special-Casing**: Next.js composes via capability declarations (`CLIENT_ROUTING` vs `FILESYSTEM_ROUTING`, `BaseProvider`) rather than ad-hoc framework string checks.
3. **Byte-Identical Determinism**: Consecutive generation runs produce binary buffer equality (`diffTrees` passes with 0 findings).

---

## 2. Capability Scopes & Precedence Order

Fragments are evaluated in ascending order according to `FRAGMENT_PRECEDENCE`:

```
┌────────────────────────────────────────────────────────┐
│  Layer 1: Base (base provider file plan)               │
│  - package.json, tsconfig.json, vite/next config       │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│  Layer 2: Framework (entry point container & cleanup)  │
│  - Vite default removal / framework-idiomatic root     │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│  Layer 3: Architecture (domain structure & primitives) │
│  - feature-based, type-based, hybrid, none             │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│  Layer 4: Styling (component styles & design tokens)   │
│  - Tailwind v4, Bootstrap, CSS reset                   │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│  Layer 5: Tooling (additive capability overlays)       │
│  - State, Router, Icons, API, Testing, Linter, Formatter│
└────────────────────────────────────────────────────────┘
```

### Precedence Table

| Layer | Scope (`scope`) | Source / Responsibility | Precedence Rule |
| :--- | :--- | :--- | :--- |
| **1. Base** | `base` | `templates/bases/<fw>/<variant>/<lang>` via `BaseProvider` | Foundation baseline; sets up configs, deps, and entry points. |
| **2. Framework** | `framework` | Framework lifecycle actions (`App.tsx`/`App.css` clean-up) | Prepares root directory for architecture overlays. |
| **3. Architecture** | `arch` | `templates/architectures/<arch>/src` + `main.<ext>` | Lays down layout, pages, and base components. |
| **4. Styling** | `styling` | `templates/css/component-styles/<css>/<arch>/src` + global CSS | Overwrites unstyled architecture primitives with styled markup. |
| **5. Tooling** | `tooling` | `templates/conditional/<category>/...` | Additive overlays; merges scripts and features. |

### Tooling Sub-Category Deterministic Order

Within Layer 5 (`tooling`), categories are applied in the following deterministic sequence:
1. `state`: State management (Redux, Zustand) + provider wrapping
2. `router`: Client routing (gated by `CLIENT_ROUTING` capability)
3. `icons`: Icon library components and showcases
4. `api`: API clients (Axios, Fetch)
5. `testing`: Test frameworks (Vitest, Jest) + architecture-scoped tests
6. `linter`: Code linters (ESLint, Oxlint) + configuration files
7. `feature-script`: Architecture-specific tooling (`create-feature.mjs`)
8. `formatter`: Code formatters (Prettier, Oxfmt) + ESLint config wiring

---

## 3. Collision Resolution Rules

1. **File Overwrite**: On file path collisions, the higher-precedence fragment overwrites the lower-precedence file.
   - Example: Architecture provides an unstyled `Button.tsx`; Styling provides a Tailwind-styled `Button.tsx`. The Styling variant wins.
   - Example: Architecture provides an unrouted `App.tsx`; Router tooling provides a routed `App.tsx`. The Router variant wins.
2. **Structured Metadata Merging**:
   - `package.json` scripts are merged into a unified map before a single write pass, eliminating file write thrashing.
   - Dependencies and devDependencies are merged from `BaseProvider` package sets.
3. **Language Isolation**:
   - All file operations pass through `langFileFilter(language)`.
   - In TypeScript projects, `.jsx` and `.js` files are strictly excluded.
   - In JavaScript projects, `.tsx` and `.ts` files are strictly excluded.
4. **Placeholder Pruning**:
   - `pruneRedundantGitkeeps()` deletes `.gitkeep` markers only when real sibling files have been populated into the directory.

---

## 4. Next.js Composition Without Special-Casing

Next.js composes cleanly without `if (framework === "next")` branching:
- **Client Routing Gating**: Next.js declares `FILESYSTEM_ROUTING` and lacks `CLIENT_ROUTING`. `resolveFragments` queries `hasCapability(fw, CAPABILITIES.CLIENT_ROUTING)`, which returns `false`. The client router fragment is automatically omitted from the fragment list.
- **Provider-Driven Base**: Bundler configuration is owned by `BaseProvider`. Next.js provides its own base plan without needing Vite configuration rewrites.
- **Linter Selection**: Linter fragments are mapped through provider-scoped fragment IDs, avoiding runtime conditional logic inside the injection loop.

---

## 5. Verification & Determinism Results

- **Unit Test Suite**: 197/197 passing (`npm test`).
- **Determinism Gate**: Validated via `tests/unit/composition.test.mjs` and `tests/smoke/generate.test.mjs`:
  - Successive generations produce identical binary trees (`diffTrees` returns `null`).
  - No dynamic timestamps or non-deterministic dictionary key serialization.
