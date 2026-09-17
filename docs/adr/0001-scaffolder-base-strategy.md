# ADR 0001 — Scaffolder base strategy: vendored bases, external CLIs are dev-time only

- **Status:** Proposed
- **Date:** 2026-09-17
- **Deciders:** maintainers
- **Supersedes:** —

## Context

`create-lumen` currently shells out to `npm create vite@latest --template
react[-ts]` at generation time (`src/scaffold.js`), then installs, mutates and
mostly overwrites the result (≈11 of the ~18 emitted files are deleted or
replaced — `src/cleanup.js`, `src/configure.js`, `src/css.js`).

v2 adds Next.js, whose equivalent would be `create-next-app`. That CLI is
fully flag-drivable, but hostile to hermetic generation:

- `--yes` uses **persisted user preferences** ("previous preferences or
  defaults"), so output depends on the machine.
- It self-installs and self-`git init`s unless `--skip-install --disable-git`.
- It ships defaults we do not want (`--agents-md` writes `AGENTS.md` **and**
  `CLAUDE.md`; `--tailwind` is on by default).
- It exposes axes `create-lumen` already owns (language, linter, Tailwind,
  `src/` dir, App vs Pages Router, import alias), plus new ones we do not model
  (Bundler, React Compiler, Biome).
- Its flag surface churns (biome, turbopack, react-compiler and agents-md are
  all recent additions).

Separately, verification (v2 M4) requires **offline, deterministic** generation.
Today the harnesses generate from bases cached once at `verify:vendor` time
(`tests/.cache/base-{js,ts}`), which means CI verifies a *different* Vite than
users receive (`vite@latest`). Any runtime-only strategy would have to be
snapshotted for tests anyway — i.e. vendored, but without review.

## Decision

1. **No external scaffolder CLI runs at generation time (runtime).** Generated
   projects are composed from repository-owned bases plus npm installs.
   - Bases live in `templates/bases/<provider>/<variant>/<lang>/`.
   - External CLIs are **dev-time only**: pinned, run manually to refresh a
     snapshot, which is committed and reviewed by diff, with a
     `.provenance.json` recording source CLI + version + flags + date.
   - `create-vite` is retained as a dev-time printer because one pinned version
     yields many framework bases (react, vue, svelte, solid, preact, lit, qwik),
     leveraged for the v3 multi-framework work.
   - `create-next-app` is dev-time only; its snapshot covers **both** App Router
     (`--app`) and Pages Router (`--no-app`).
2. **A `BaseProvider` seam abstracts per-framework generation** — declared
   capabilities, file plan, package set, post-write hooks. Introduced with the
   capability model (create-lumen#25); consumed by the Next.js epic (#8).
3. **Package versions are owned in one place** — the base templates'
   `package.json` — and generation performs a **single install**.
4. **Axes exposed by `create-next-app` that we do not yet model become
   first-class v2.0.0 options**, implemented as overlays rather than flag
   translation: `bundler` (Turbopack/Webpack), `reactCompiler`,
   `linter: "biome"`, `agentDocs` (AGENTS.md/CLAUDE.md). Remote template
   bootstrapping (`--example <url>`) is out of scope for v2.0.0.

## Consequences

- Deterministic, reproducible, offline-capable generation; CI verifies exactly
  what users get.
- `tests/.cache/base-*` seeding (`tests/verify/install-vendor.mjs`) is removed;
  harnesses read `templates/bases/`.
- `create-lumen` owns Vite/React/Next **version currency** and must refresh
  snapshots on upstream majors. This is deliberate: our overlays diverge from
  upstream output anyway, so the currency cost exists either way.
- The option matrix grows (e.g. `+bundler×2`, `+reactCompiler×2`, `+biome`).
  Cartesian coverage is therefore off the table: capabilities plus
  pairwise/t-way testing (create-lumen#35, #36, #37) become mandatory.
- Upstream contract breaks (e.g. `create-vite` gaining a default or changing
  its templates) can no longer break user-facing generation.

## Alternatives considered

- **Shell out to external CLIs at runtime (pinned).** Rejected: duplicates the
  prompt surface, couples us to their flag churn, `--yes` is non-hermetic, and
  the output would still need stripping and overwriting.
- **Shell out at runtime + cache downloaded bases.** Rejected: same issues plus
  cache invalidation — and it is vendoring without review.
- **Vendor Vite only, shell out to `create-next-app`.** Rejected: two mental
  models and two failure modes for the same job.
- **Keep `create-vite` in the runtime path.** Rejected: `@latest` drift and a
  poor flag contract (no `--version`; scaffolds silently on unknown flags;
  Oxlint-by-default for React).

## References

- Code: `src/scaffold.js`, `src/main.js`, `src/configure.js`, `src/cleanup.js`,
  `src/css.js`, `src/dependencies.js`, `tests/verify/install-vendor.mjs`
- Docs: `docs/ROADMAP.md`, `docs/PLAN.md`, `AGENTS.md`
- Issues: create-lumen#8, #13, #18, #19, #25, #34, #35, #36, #37
