# Testing `create-lumen`

This folder documents how the **CLI scaffolder itself** is tested. It does *not*
test generated apps — these tests validate the generator that produces them.

Tests live under `tests/` and are split into three tiers:

| Tier  | Location            | Runner                                  | What it covers                                                              |
| ----- | ------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Unit  | `tests/unit/`       | `node:test` (via `npm test`)            | Isolated functions: `injectFormatter`, `wireEslintPrettier`, `getPkgManager`, `computeDeps`, `setupCssFramework`, and the axios/fetch API-client layer layout |
| Smoke | `tests/smoke/`      | `node:test` + a manual script           | Quick, representative scaffold generation (offline) and a real-install check |
| E2E   | `tests/e2e/`        | manual `node`                           | Exhaustive option-matrix generation across all valid choice combos           |

## Running

```bash
npm test                                    # unit (tests/unit/) + offline smoke (tests/smoke/generate.test.mjs)
node --import ./register.js tests/smoke/install.mjs   # real-install smoke (needs network)
node --import ./register.js tests/e2e/exhaustive.mjs  # full option matrix (~11,664 combos, offline); LIMIT=n for subset
```

`npm test` intentionally runs only the fast, offline `node:test` files
(`*.test.mjs`). The two harness scripts (`install.mjs`, `exhaustive.mjs`)
generate full scaffolds and are run manually.

> The `--import ./register.js` flag loads the `@/` path-alias hook before the
> harnesses (which `import src/` statically). `npm test` already includes it;
> the manual harnesses need it passed on the command line.

## Tier details

### Unit (`tests/unit/`)
Fast and offline — the tests that scaffold fixture projects only use the OS
temp dir (removed after each test) and never touch the network. Asserts that
individual generator functions produce the right config, scripts, and ESLint
wiring. See
`tests/unit/injector.test.mjs`, `tests/unit/pkg-manager.test.mjs`,
`tests/unit/api-client.test.mjs`, `tests/unit/dependencies.test.mjs`, and
`tests/unit/css.test.mjs`:

- `injector.test.mjs` — formatter config + scripts, `eslint-config-prettier`
  wiring (array and `tseslint.config(...)` forms), idempotence, project-name
  resolution.
- `api-client.test.mjs` — the split axios/fetch layer (`config`/`client`/
  `user.service`) and the api-vs-lib exclusivity rule, across both
  architectures and languages.
- `css.test.mjs` — CSS framework naming (`main.css`/`globals.css` +
  `themes.css`), the `main.*` CSS-import rewrite, tailwind vite-config swap,
  bootstrap import prepend, and removal of Vite's leftover `index.css`/`App.css`.
- `dependencies.test.mjs` — the **pure** conditional dependency matrix
  (`computeDeps`, no network): `jiti` for eslint+TS, `jest-environment-jsdom` +
  Babel presets for jest, `eslint-config-prettier` only for eslint+prettier,
  etc.
- `pkg-manager.test.mjs` — package-manager detection from the user agent.

### Smoke (`tests/smoke/`)
- `generate.test.mjs` — offline `node:test` smoke. Builds a cached Vite base
  once, then generates the Quick Setup scaffold for TS and JS and asserts it is
  coherent (scripts, `@/*` alias, `eslint-config-prettier` appended last by
  reference, `README`/`LICENSE`).
- `install.mjs` — manual real-install smoke. Runs the **full** pipeline including
  `npm create vite` + `npm install` for the Quick Setup default; the only guard
  against install-time breakage.

### E2E (`tests/e2e/`)
`exhaustive.mjs` enumerates every valid combination of the choice dimensions
(respecting the `linter → formatter` dependency) and asserts the generated
filesystem for each. Uses a cached Vite base (`tests/.cache/`, git-ignored) so it
stays offline and fast.

> All harnesses call the `src/` generation pipeline **directly**; none spawn
> `bin/cli.js` through the interactive prompts. They are integration tests, not
> true end-to-end runs of the CLI. See [harness.md](./harness.md) for full scope,
> limitations, and what they caught.
