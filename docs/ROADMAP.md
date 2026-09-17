# Roadmap

`create-lumen` is a CLI scaffolder for React + Vite projects with a
multi-framework trajectory: `v1.x` matures React/Vite, `v2.0.0`
brings Next.js, `v3.0.0` brings SvelteKit + a framework-agnostic
generation engine. Released versions are documented in
[`docs/CHANGELOG.md`](./CHANGELOG.md); this file tracks work in
progress, ideas under consideration, and the long-term vision.

This document follows the de facto community-standard structure: a
Current Milestone with checkable items, a Next Milestone placeholder,
a Future Explorations (Icebox) section, a Versioning Philosophy that
explains what justifies a major bump, and a Long-term Vision that
maps out the multi-framework trajectory.

---

## 🧭 Versioning Philosophy

This project follows [Semantic Versioning](https://semver.org/). The
guiding test for whether a change is breaking:

> **Can a user of the previous major version upgrade and keep using
> their existing configuration, CLI flags, and generated project
> without modifying anything?**

- **Yes** → `1.x` bump (current behavior preserved, additive only).
- **No** → `2.x+` bump (breaking change to config schema, CLI surface,
  template contract, or generator engine).

### What fits in `1.x` (additive, non-breaking)

- New optional prompts (a new linter, formatter, icon library,
  state-management option, CSS framework).
- New architectures (alongside the existing ones).
- New templates / overlays for an already-supported framework.
- New providers, hooks, contexts (the `providers/` consolidation
  pattern is stable; new providers are additive).
- New CSS framework support alongside the existing three.
- New API client (fetch, axios, …) as long as the existing two keep
  working unchanged.
- Generator-internal refactors that don't change the CLI surface,
  prompt flow, or file layout contract.

### What would force `2.0.0` or `3.0.0` (breaking)

- **Config schema break** — e.g. moving from a flat config
  (`{ framework: "react", css: "tailwind", architecture: "feature" }`)
  to a nested model
  (`{ framework: { name, variant }, styling: { engine }, … }`) because
  the flat form is no longer expressive enough.
- **CLI surface break** — removing `bin/cli.js create` flags without
  keeping a compatibility layer.
- **Template contract break** — e.g. deleting the
  `templates/architectures/` base trees in favor of
  framework-specific trees, or renaming `shared/` so generated
  projects need migration.
- **Generator engine break** — moving from "all options cross-product"
  to "framework → capabilities → compatible options → template
  composition" because the cross-product no longer covers a new
  framework's concepts (filesystem routing, server/client boundaries,
  adapters).

### Tag note

`v1.2.0` stable was released on 2026-09-17. The beta `v1.2.0-beta.1` (2026-09-07)
has been promoted after passing the full release bar: `npm test`,
`npm run verify` (stratified), `npm run verify:matrix` (full offline matrix),
and `npm run verify:installed` (real install + build) all green.
Status in `CHANGELOG.md` is `[1.2.0]`; status in the current milestone
below is ✅ Released.

---

## 🎯 Current Milestone: v1.2.0 ✅ Released

> **Status:** ✅ Released (`v1.2.0`) · **Released:** 2026-09-17

The release consolidates the API layer, providers, router layout,
and CSS framework naming. Landed in this branch:

- [x] Drop feat `shared/{api,lib}` placeholders (`836f877`)
- [x] Router as a folder with split providers — feat per-area, comp centralized (`c7e729a`)
- [x] `providers/` consolidation + App wiring + CSS variables in components (`a952a74`)
- [x] CSS framework naming: `main.css` for vanilla, `globals.css` for tailwind/bootstrap + `themes.css` (`6f6e46c`)
- [x] Split ROADMAP / CHANGELOG (`docs/CHANGELOG.md` in Keep a Changelog 1.1.0 format)

Pending (work-in-progress commits referenced in `[Unreleased]`):

- [x] Framework-aware component styling + data-router parity (`08f70e4`)
- [x] Catch-up README + readme.js + leftover folder deletes (`4975780`)
- [x] Component-based types parity + generated typecheck script (`09da701`)
- [x] Axios as `api` (`8ec162c`, `be5a709`, `90fc13e`)
- [x] Fetch layer parity (`d229f8f`)
- [x] Feature-based `shared/` grouping + api-vs-lib rule (`6e6eda2`, `c36b616`)
- [x] Public feature barrel + removed unused barrels (`6e6eda2`)

## ⏩ Next Milestone: v2.0.0 (breaking)

> **Status:** ⚠️ Planned · **Target:** TBD · **Tracker:** #32

v2 ships as **5 functional milestones**. Each one closes with an
*observable result* — you never wait for a 90%-assembled scaffold to see
something working. They are GitHub milestones on the repo and are
grouped in the *create-lumen workflow* Project (view **Milestones**).
Visual versions (milestone flow, dependency graph, parallel waves,
pipeline, release train) live in [`docs/PLAN.md`](./PLAN.md).
Structural decisions are recorded as ADRs in [`docs/adr/`](./adr/) —
start with [ADR 0001: scaffolder base strategy](./adr/0001-scaffolder-base-strategy.md).

### 🧱 M1 · `v2.0.0-alpha` — Core: React/Vite + manifest v2

> **DoD:** `npm create lumen@alpha my-app` scaffolds a functional
> React/Vite project and emits a Zod-validated `lumen.config.json` v2,
> with Tailwind v4 and tooling parity; published as a pre-release.

- [ ] #13 Manifest v2: nested config schema
- [ ] #14 Manifest v2: Zod validator + strict v1 rejection
- [ ] #15 Manifest v2: explicit path mapping
- [ ] #16 Manifest v2: emit `lumen.config.json`
- [ ] #4 Manifest v2: publish JSON Schema
- [ ] #9 Manifest/template contract shared with lumen-cli
- [ ] #6 Templates: migrate to Tailwind v4
- [ ] #24 Tooling: eslint/prettier/oxlint/oxfmt parity
- [ ] #23 React + Vite: validate bundle under manifest v2
- [ ] #29 create-lumen v2: non-interactive flags
- [ ] #31 CI: publish v2 pre-releases

### ⚙️ M2 · `v2.0.0-alpha.2` — Engine: capabilities + options

> **DoD:** prompts are gated by declared capabilities and templates are
> **composed** (no cross-product); shadcn/ui and `none`/`hybrid`
> architectures land on top.

- [ ] #10 Capabilities-based composition (epic)
- [ ] #25 Engine: capability declaration model
- [ ] #38 Base: vendor framework bases + `BaseProvider` seam
- [ ] #26 Engine: gate prompts by declared capabilities
- [ ] #27 Engine: template composition
- [ ] #33 UI: shadcn/ui support (Tailwind v4)
- [ ] #34 Architecture: `none` + `hybrid`
- [ ] #11 Scaffolder: back navigation in the v2 prompt flow

### ▲ M3 · `v2.0.0-beta` — Next.js support

> **DoD:** Next.js scaffolds and runs: App/Pages Router, filesystem
> routing, route handlers, server/client boundaries, `next/font` +
> `next/image`, adapters.

- [ ] #8 Next.js support (epic)
- [ ] #18 App Router base scaffold
- [ ] #19 Pages Router variant
- [ ] #20 filesystem routing + route handlers
- [ ] #21 server/client boundaries + `next/font` + `next/image`
- [ ] #22 adapter configuration

> **Base strategy:** Next.js bases are repository-owned snapshots refreshed
> from a pinned `create-next-app` (dev-time only) — see
> [ADR 0001](./adr/0001-scaffolder-base-strategy.md). The axes that CLI
> exposes become first-class v2.0.0 options, implemented as overlays (not
> flag translation): `bundler` (Turbopack/Webpack), `reactCompiler`,
> `linter: "biome"`, `agentDocs` (AGENTS.md/CLAUDE.md).

### 🧪 M4 · `v2.0.0-rc` — Testing & quality

> **DoD:** the cartesian matrix is replaced by a scalable strategy
> (pairwise/t-way + per-overlay contract tests) and a real headless e2e.

- [ ] #35 Testing strategy (epic) — supersedes #7
- [ ] #36 pairwise/t-way generator + capability-scoped matrix
- [ ] #37 per-overlay contract tests
- [ ] #28 Manifest v2 contract tests (schema fixtures)
- [ ] #5 True headless e2e
- [ ] #7 *close as superseded by #35*

### 📦 M5 · `v2.0.0` — Docs & release

> **DoD:** migration guide + README/ROADMAP/CHANGELOG updated;
> `v2.0.0` stable published.

- [ ] #17 Docs: v1.x → v2 migration guide
- [ ] #30 Docs: README + ROADMAP/CHANGELOG for v2

---

## 🔗 Dependency matrix

References use `repo#issue` — e.g. `create-lumen#13`, `lumen-cli#3`.
A bare `#N` means the same repo as the row. "Enables" lists the issues
that cannot start until the row lands.

| Issue | Depends on | Enables |
|-------|------------|---------|
| create-lumen#13 | — | create-lumen#14, #15, #16, #4, #9, #25 |
| create-lumen#14 | create-lumen#13 | create-lumen#16, #28 |
| create-lumen#15 | create-lumen#13 | create-lumen#16 |
| create-lumen#16 | create-lumen#13, #14, #15 | create-lumen#23, #29, #31, #5 |
| create-lumen#4  | create-lumen#13 | — |
| create-lumen#6  | — | create-lumen#23, #33 |
| create-lumen#24 | — | create-lumen#23 |
| create-lumen#23 | create-lumen#16, #6, #24 | create-lumen#31 |
| create-lumen#9  | create-lumen#13 | lumen-cli#3 |
| create-lumen#29 | create-lumen#16 | create-lumen#5 |
| create-lumen#31 | create-lumen#16, #23 | `v2.0.0-alpha` |
| create-lumen#25 | create-lumen#13 | create-lumen#26, #27 |
| create-lumen#38 | create-lumen#13, create-lumen#25 | create-lumen#18, #19 |
| create-lumen#26 | create-lumen#25 | create-lumen#27 |
| create-lumen#27 | create-lumen#25, #26 | create-lumen#33, #34, #8 |
| create-lumen#33 | create-lumen#6, create-lumen#27 | lumen-cli#9 |
| create-lumen#34 | create-lumen#27 | — |
| create-lumen#8  | create-lumen#27 | create-lumen#18–#22 |
| create-lumen#18–#22 | create-lumen#8, create-lumen#27 | — |
| create-lumen#35 | — | create-lumen#36, #37 |
| create-lumen#36 | create-lumen#35 | — |
| create-lumen#37 | create-lumen#35, create-lumen#9 | — |
| create-lumen#28 | create-lumen#14 | — |
| create-lumen#5  | create-lumen#29, create-lumen#16 | — |
| create-lumen#17 | create-lumen#16 | — |
| create-lumen#30 | M1–M4 | `v2.0.0` |
| lumen-cli#3  | create-lumen#9, create-lumen#13 | lumen-cli#4, #5, #7, #20 |
| lumen-cli#5  | lumen-cli#2, lumen-cli#3, create-lumen M1 | lumen-cli#6 |
| lumen-cli#6  | lumen-cli#5 | — |
| lumen-cli#7  | lumen-cli#3 | lumen-cli#8, #11–#14, #17, #20, #21 |
| lumen-cli#9  | lumen-cli#7, create-lumen#33 | lumen-cli#10 |
| lumen-cli#10 | lumen-cli#9 | — |
| lumen-cli#16 | lumen-cli#24 | lumen-cli#15, #17, #18, #19, #25 |
| lumen-cli#20 | lumen-cli#3, lumen-cli#7 | — |
| lumen-cli#21 | lumen-cli#7 | — |
| lumen-cli#22 | lumen-cli#1–#21 | `v1.0.0` |

---

## 🧵 Parallel-work matrix

Four developers, cross-project. A lane starts as soon as its
prerequisite lands; lanes on the same row can run simultaneously.

| Lane | Workstream | Issues | Starts after | Parallel with |
|------|------------|--------|--------------|---------------|
| A | create-lumen manifest core | create-lumen#13,#14,#15,#16,#4 | now | B, C, D, G |
| B | create-lumen templates/tooling | create-lumen#6,#24 | now | A, C, D, G |
| C | lumen-cli core skeleton | lumen-cli#1,#2 | now | A, B, D, G |
| D | docs-engine base (port `documentador`) | lumen-cli#24,#16 | now | A, B, C, G |
| G | testing strategy (both repos) | create-lumen#35,#36,#37,#28,#5 | now (create-lumen#28→#14) | A, B, C, D |
| E | create-lumen engine + options | create-lumen#25,#26,#27,#33,#34,#38,#11 | after A | F |
| H | lumen-cli generators | lumen-cli#7,#8,#11–#14 | after C + create-lumen#9 | F, I, J, K |
| F | create-lumen Next.js | create-lumen#8,#18–#22 | after E | H, I, J, K |
| I | lumen-cli UI registry | lumen-cli#9,#10 | after H + create-lumen#33 | F, J, K |
| J | lumen-cli docs engine | lumen-cli#15,#17,#18,#19,#25 | after D | F, H, K |
| K | lumen-cli doctor / barrels | lumen-cli#20,#21 | after H | F, J |
| L | release & docs | create-lumen#17,#30 · lumen-cli#22 | at close | — |

Suggested 4-dev split:

- **Dev 1** — A → E → F (manifest core → engine → Next.js)
- **Dev 2** — B → G → L (templates → tests → release)
- **Dev 3** — C → H → I → K (lumen-cli core → generators → registry → doctor)
- **Dev 4** — D → J (docs engine)

## 🔮 Future Explorations (Icebox)

> Items under consideration. No committed dates.

- [ ] **True headless e2e** — drive `bin/cli.js` through the prompts
  (current harnesses call `src/` directly, so they are integration
  tests, not CLI e2e).
- [ ] **Generated API resource services** — today `user.service` (per
  API client) is a hand-written example; add a generator that
  scaffolds a full CRUD service (`get`, `getById`, `create`,
  `update`, `delete`, …) for an API resource, wiring it to the
  shared `api` client with types from `shared/types`.
- [ ] **Expanded test coverage** — additional option combinations not
  yet covered by the offline matrix.
- [ ] **Next.js template bundle** — approach decided in
  [ADR 0001](./adr/0001-scaffolder-base-strategy.md): repository-owned
  bases refreshed from a pinned `create-next-app` (dev-time only), with
  App Router **and** Pages Router snapshots. Option portability and the
  Next.js-specific concepts are tracked under v2.0.0 M3 (#8, #18–#22).
- [ ] **Svelte / SvelteKit template bundle** — SvelteKit's
  filesystem-based routing, `load` functions, server/client
  boundaries, and adapter model do not map onto the current
  cross-product option matrix. Likely target: **v3.0.0** (breaking
  change to the generator engine — see Long-term Vision).
- [ ] **Capabilities-based template composition** — replace the
  current "all options cross-product" matrix with a
  framework → capabilities → compatible options → template
  composition model. Required for v3.0.0; could land as an internal
  refactor under v1.x first.

---

## 🌅 Long-term Vision: Multi-Framework Era

The roadmap past v1.x has three horizons. Each horizon adds a
framework or engine capability; the major bump is reserved for the
moments the contract has to change, not for the framework itself.

### `v1.x` — React/Vite scaffolder (mature)

The scaffolder is a feature-complete React + Vite generator with a
rich option matrix (~11,600 cells). New minor versions add
capabilities without breaking existing configs. Examples of v1.x
work already in motion or planned:

- `v1.3.0` — first post-CSS-naming stable release.
- `v1.4.0` — additional React/Vite templates, providers, test
  runners.
- `v1.5.0` — expanded offline matrix coverage.

### `v2.0.0` — Next.js support (BREAKING)

Adds Next.js as a supported framework alongside React/Vite.

**Breaking**: the flat config
`{ framework: "react", css: "tailwind", architecture: "feature" }`
becomes a nested model
`{ framework: { name: "react" | "next", variant?: "app-router" | "pages-router" }, styling: { engine: "tailwind" }, architecture: { type: "feature" } }`,
because Next.js's App Router vs Pages Router distinction and its
framework-specific concepts (filesystem routing, `next/font`,
`next/image`, route handlers) cannot be expressed by the flat schema
without losing meaning.

### `v3.0.0` — SvelteKit + multi-framework engine (BREAKING)

Adds Svelte (SvelteKit) as a third supported framework and reframes
the generator around a framework-agnostic core.

**Breaking**: the current cross-product option matrix
(framework × language × architecture × CSS × state × API × router ×
testing × linter × formatter × icons ≈ 11,600 cells) becomes a
**framework → capabilities → compatible options → template
composition** model, because SvelteKit has framework-native concepts
that the cross-product cannot encode cleanly (filesystem routing,
`load` functions, server/client boundaries, adapter model, form
actions). Adapters themselves (Node, Vercel, Cloudflare, static)
become first-class options at this level.

### Why not `2.0.0 = Next.js` and `3.0.0 = SvelteKit` standalone?

A framework can land in a `1.x` bump if it doesn't break the contract
(it just adds a new value to an existing option). The major bump is
reserved for the structural shift the new framework forces — not for
the framework itself. If a future framework can be integrated without
breaking the schema, it should land in `1.x` to honor SemVer.
