# create-lumen

A scaffolder that generates production-ready React + Vite projects (feature-based or type-based).

Note: this repository is the CLI scaffolder itself, not a generated app. Generated projects live in the target folder you create.

## Quick usage

From npm (recommended):

```bash
npm create lumen my-app
cd my-app
npm run dev
```

### Non-interactive flags

Quick Setup (TypeScript + Tailwind + Feature-based + Router + ESLint + Prettier + Vitest), no prompts:

```bash
npm create lumen my-app -- -y
# or
npm create lumen -- -y my-app
# or
npm create lumen my-app -- --yes
```

Scaffold using a template preset (`react-ts`, `react-js`, `react-type-ts`, `react-type-js`):

```bash
npm create lumen my-app -- --template react-ts
# or
npm create lumen my-app -- -t react-type-js
```

Drive scaffolding directly from a manifest file or inline JSON (manifest v2):

```bash
# From file
npm create lumen my-app -- --manifest ./lumen.config.json

# From inline JSON
npm create lumen my-app -- -m '{"manifestVersion":2,"framework":{"name":"react","variant":"vite"},...}'
```

The CLI parses options cleanly regardless of flag ordering, so flags can appear before or after the project name.

Display help and version:

```bash
npm create lumen -- --help
npm create lumen -- --version
```

Run the scaffolder locally (development / testing the generator):

```bash
node bin/cli.js           # run interactively
npm install
npm link                 # install globally for testing
create-lumen my-app      # after npm link
```

## Features

- Architecture choice: feature-based or type-based
- TypeScript or JavaScript output
- CSS frameworks: Tailwind CSS v4 (CSS-first `@theme`, v3 dropped), Bootstrap 5.3+, or none
- Optional state management: Zustand or Redux Toolkit
- Optional router (React Router)
- Optional testing: Vitest or Jest
- Linting: ESLint (default), Oxlint, or Biome
- Code formatter: Prettier or Oxfmt (chosen after the linter; `eslint-config-prettier` is auto-wired for the ESLint + Prettier combo)
- Manifest v2: Emits a deterministic `lumen.config.json` validated against JSON Schema Draft 2020-12
- Explicit path mapping: Target directories declared for `lumen-cli` code generation
- Optional Axios setup and icon libraries
- Auto `git init`, generated `README` (with a project description reflecting the chosen tooling) and `LICENSE`
- `.env.example` scaffolded, and the generated `.gitignore` excludes env files (`.env`, `.env.*`) while keeping `.env.example`
- `@/` path alias configured (`tsconfig`/`jsconfig` + Vite)

Your selected options are cached and offered as defaults on subsequent runs.

## Developing the scaffolder

- Entry point: `bin/cli.js` → `src/main.js` (ESM-only)
- Templates: `templates/` (architectures + conditional overlays)
- Injector copies architecture, then overlays conditionals based on choices
- Config cache: `~/.lumen-config.json` stores previous choices
- This tool uses Node >= 18 and `execa` for subprocesses

Run locally (interactive):

```bash
node bin/cli.js
```

Install globally for testing:

```bash
npm link
create-lumen my-app
```

## Testing the scaffolder

The CLI repo has no app-level test suite, but `npm test` runs the unit tests under `tests/unit/` plus the offline smoke tests under `tests/smoke/`, and two harnesses in `tests/e2e/` and `tests/smoke/` drive the real generator against generated scaffolds. See `docs/tests/README.md` (and `harness.md`) for details, scope, and what they verify.

```bash
npm test                                    # unit (tests/unit/) + offline smoke (tests/smoke/generate.test.mjs)
node --import ./register.js tests/smoke/install.mjs  # real-install smoke (Quick Setup default; needs network)
node --import ./register.js tests/e2e/exhaustive.mjs # full option matrix (~11,664 combos, local-only; ~13 min). Use LIMIT=n.
```

## Project structure (generated app examples)

Feature-based (example):

```
src/
├── app               # App shell and global providers
│   ├── App.tsx
│   ├── contexts
│   │   └── themecontext.ts   # createContext + ThemeContextValue
│   ├── providers
│   │   └── ThemeProvider.tsx # Provider component
│   ├── hooks
│   │   └── useTheme.ts       # Hook that reads ThemeContext
│   └── router        # Data router (per feature area)
│       ├── guards    # AuthGuard, RoleGuard
│       ├── routes    # home.routes, auth.routes
│       └── index.tsx # createBrowserRouter init
├── features           # Feature modules (business logic owned per feature)
│   └── home
│       ├── components
│       ├── hooks
│       ├── index.ts    # public feature barrel
│       ├── layouts
│       ├── pages
│       ├── services
│       ├── store
│       └── types
└── shared             # Reusable, business-agnostic resources
    ├── api/lib        # fetch client → api/; axios init → lib/axios/ (per choice)
    ├── components
    │   └── ui
    ├── hooks
    ├── layouts
    ├── stores
    ├── styles
    │   ├── globals.css      # Tailwind/Bootstrap directives (or main.css for vanilla)
    │   └── themes.css       # Theme tokens (Tailwind @theme / Bootstrap data-bs-theme / CSS vars)
    ├── types
    └── utils
```

Type-based (example):

```
src/
├── App.tsx
├── components
│   ├── common
│   └── form
├── config             # API config (when an axios/fetch client is chosen)
├── layouts
├── main.tsx
├── pages
├── providers          # Provider components (createContext + Provider in separate files inside providers/)
│   ├── appcontext.ts      # createContext + AppContextValue
│   └── AppProvider.tsx    # Provider component
├── hooks
│   └── useApp.ts           # Hook that reads AppContext
├── router             # Centralized data router
│   ├── guards         # AuthGuard, GuestGuard
│   └── index.tsx      # Single source of truth for all routes
├── services
├── store
├── styles
│   ├── globals.css      # Tailwind/Bootstrap directives (or main.css for vanilla)
│   └── themes.css       # Theme tokens (Tailwind @theme / Bootstrap data-bs-theme / CSS vars)
├── test
└── utils
```

## Manifest v2 & Ecosystem Architecture

`create-lumen` is part of the Lumen ecosystem alongside **`lumen-cli`**:

- **`create-lumen` (this repo):** The bootstrap scaffolder that initializes project repositories and writes an explicit, strictly validated `lumen.config.json` manifest (`manifestVersion: 2`) into the project root.
- **`lumen-cli`:** The companion developer CLI that reads `lumen.config.json` to generate components, features, hooks, and services at the paths declared in `manifest.paths`.

### Ecosystem Documentation & Contracts

- **[Manifest v2 Overview](./docs/manifest-v2.md):** Specification of the nested schema and validation behavior.
- **[Shared Contract: `create-lumen` ↔ `lumen-cli`](./docs/contracts/manifest-v2-contract.md):** The agreed contract for path mapping, barrel conventions, and version negotiation.
- **[v1 to v2 Migration Guide](./docs/migration/v1-to-v2.md):** Complete guide for migrating generated projects and legacy flat configs to v2.

## Roadmap & Planning

- **Changelog:** Notable changes are documented in [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) (Keep a Changelog format).
- **Roadmap:** Milestones (M1 through M5) are tracked in [`docs/ROADMAP.md`](./docs/ROADMAP.md).
- **Visual Plan:** Dependency graphs and parallel wave execution plans live in [`docs/PLAN.md`](./docs/PLAN.md).
- **Branching Workflow:** Human guide for branch conventions and PR checklist in [`docs/BRANCHING.md`](./docs/BRANCHING.md).

## Requirements

- Node.js >= 18

## Acknowledgements

This project is based on [create-vrtw](https://github.com/Avijit07x/create-vrtw) by [@Avijit07x](https://github.com/Avijit07x). Thank you for the original work that inspired this scaffolder.

## License

MIT
