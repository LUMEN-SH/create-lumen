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

```bash
# Quick Setup defaults (-y, --yes): TS + Tailwind v4 + Feature-based + Router + ESLint + Prettier + Vitest
npm create lumen my-app -- -y
npm create lumen my-app -- --yes

# Scaffold directly from a manifest file or inline JSON (-m, --manifest)
npm create lumen my-app -- --manifest ./lumen.config.json
npm create lumen my-app -- -m ./lumen.config.json

# Use a preset template (-t, --template)
npm create lumen my-app -- --template react-ts

# Display usage and available options (-h, --help)
npm create lumen -- --help
```

The CLI cleanly ignores flag arguments when resolving the project name, so options can appear before or after the app name without ambiguity.

### Documentation & Specifications

- **Migration Guide**: [`docs/migration/v1-to-v2.md`](./docs/migration/v1-to-v2.md) â€” step-by-step instructions for moving from v1 flat configs to v2 nested manifests.
- **Manifest v2**: [`docs/manifest-v2.md`](./docs/manifest-v2.md) â€” complete specification of `lumen.config.json`.
- **Cross-Repo Contract**: [`docs/manifest-template-contract.md`](./docs/manifest-template-contract.md) â€” shared contract between `create-lumen` and `lumen-cli`.

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
- CSS frameworks: Tailwind, Bootstrap, or none
- Optional state management: Zustand or Redux Toolkit
- Optional router (React Router)
- Optional testing: Vitest or Jest
- Linting: ESLint (default) or Oxlint
- Code formatter: Prettier or Oxfmt (chosen after the linter; `eslint-config-prettier` is auto-wired for the ESLint + Prettier combo)
- Optional Axios setup and icon libraries
- Auto `git init`, generated `README` (with a project description reflecting the chosen tooling) and `LICENSE`
- `.env.example` scaffolded, and the generated `.gitignore` excludes env files (`.env`, `.env.*`) while keeping `.env.example`
- `@/` path alias configured (`tsconfig`/`jsconfig` + Vite)

Your selected options are cached and offered as defaults on subsequent runs.

## Developing the scaffolder

- Entry point: `bin/cli.js` â†’ `src/main.js` (ESM-only)
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
â”œâ”€â”€ app               # App shell and global providers
â”‚Â Â  â”œâ”€â”€ App.tsx
â”‚Â Â  â”œâ”€â”€ contexts
â”‚Â Â  â”‚Â Â  â””â”€â”€ themecontext.ts   # createContext + ThemeContextValue
â”‚Â Â  â”œâ”€â”€ providers
â”‚Â Â  â”‚Â Â  â””â”€â”€ ThemeProvider.tsx # Provider component
â”‚Â Â  â”œâ”€â”€ hooks
â”‚Â Â  â”‚Â Â  â””â”€â”€ useTheme.ts       # Hook that reads ThemeContext
â”‚Â Â  â””â”€â”€ router        # Data router (per feature area)
â”‚Â Â      â”œâ”€â”€ guards    # AuthGuard, RoleGuard
â”‚Â Â      â”œâ”€â”€ routes    # home.routes, auth.routes
â”‚Â Â      â””â”€â”€ index.tsx # createBrowserRouter init
â”œâ”€â”€ features           # Feature modules (business logic owned per feature)
â”‚Â Â  â””â”€â”€ home
â”‚Â Â      â”œâ”€â”€ components
â”‚Â Â      â”œâ”€â”€ hooks
â”‚Â Â      â”œâ”€â”€ index.ts    # public feature barrel
â”‚Â Â      â”œâ”€â”€ layouts
â”‚Â Â      â”œâ”€â”€ pages
â”‚Â Â      â”œâ”€â”€ services
â”‚Â Â      â”œâ”€â”€ store
â”‚Â Â      â””â”€â”€ types
â””â”€â”€ shared             # Reusable, business-agnostic resources
    â”œâ”€â”€ api/lib        # fetch client â†’ api/; axios init â†’ lib/axios/ (per choice)
    â”œâ”€â”€ components
    â”‚Â Â  â””â”€â”€ ui
    â”œâ”€â”€ hooks
    â”œâ”€â”€ layouts
    â”œâ”€â”€ stores
    â”œâ”€â”€ styles
    â”‚Â Â  â”œâ”€â”€ globals.css      # Tailwind/Bootstrap directives (or main.css for vanilla)
    â”‚Â Â  â””â”€â”€ themes.css       # Theme tokens (Tailwind @theme / Bootstrap data-bs-theme / CSS vars)
    â”œâ”€â”€ types
    â””â”€â”€ utils
```

type-based (example):

```
src/
â”œâ”€â”€ App.tsx
â”œâ”€â”€ components
â”‚Â Â  â”œâ”€â”€ common
â”‚Â Â  â””â”€â”€ form
â”œâ”€â”€ config             # API config (when an axios/fetch client is chosen)
â”œâ”€â”€ layouts
â”œâ”€â”€ main.tsx
â”œâ”€â”€ pages
â”œâ”€â”€ providers          # Provider components (createContext + Provider in separate files inside providers/)
â”‚Â Â  â”œâ”€â”€ appcontext.ts      # createContext + AppContextValue
â”‚Â Â  â””â”€â”€ AppProvider.tsx    # Provider component
â”œâ”€â”€ hooks
â”‚Â Â  â””â”€â”€ useApp.ts           # Hook that reads AppContext
â”œâ”€â”€ router             # Centralized data router
â”‚Â Â  â”œâ”€â”€ guards         # AuthGuard, GuestGuard
â”‚Â Â  â””â”€â”€ index.tsx      # Single source of truth for all routes
â”œâ”€â”€ services
â”œâ”€â”€ store
â”œâ”€â”€ styles
â”‚Â Â  â”œâ”€â”€ globals.css      # Tailwind/Bootstrap directives (or main.css for vanilla)
â”‚Â Â  â””â”€â”€ themes.css       # Theme tokens (Tailwind @theme / Bootstrap data-bs-theme / CSS vars)
â”œâ”€â”€ test
â””â”€â”€ utils
```

## Roadmap

Released versions live in [`docs/CHANGELOG.md`](./docs/CHANGELOG.md); planned work is tracked in [`docs/ROADMAP.md`](./docs/ROADMAP.md).

## Requirements

- Node.js >= 18

## Acknowledgements

This project is based on [create-vrtw](https://github.com/Avijit07x/create-vrtw) by [@Avijit07x](https://github.com/Avijit07x). Thank you for the original work that inspired this scaffolder.

## License

MIT
