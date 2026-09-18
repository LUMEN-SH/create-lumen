# ADR 0002 — Branching strategy with SemVer: feat -> develop -> release/* -> main

- **Status:** Accepted
- **Date:** 2026-09-18
- **Deciders:** maintainers
- **Supersedes:** —
- **Related:** ROADMAP.md (Versioning Philosophy), PLAN.md (M1-M5), ADR 0001

## Context

`create-lumen` is at `v1.2.0` stable (`package.json` `1.2.0`, tag `v1.2.0`). `v1.x` is frozen — no further `1.x` features are planned. `v2.0.0` is a breaking train (`alpha -> alpha.2 -> beta -> rc -> stable`, PLAN.md M1-M5) with 4 parallel developers (PLAN.md Parallel-work matrix, 4 lanes).

Previous flow was ad-hoc: `main` published on every bump (`publish.yml` push to `main` + `tags v*`), `develop` was identical to `main`, `release/1.2.0` was a cut that diverged (missing `publish.yml` OIDC fix, `eslint.config.js`), no `hotfix/*` or prerelease dist-tag handling (publish skipped `*alpha*/*beta*`).

We need a single,SemVer-compliant topology that:
- keeps `main` always releasable (`latest` on npm),
- allows 4 devs to work in parallel without serializing on one `release/*`,
- supports the `v2` prerelease train with proper npm `dist-tags` (`alpha`, `beta`, `rc`, `next`),
- stays compatible with current CI (`publish.yml` OIDC, `eslint.yml` SARIF).

## Decision

### Topology

```
feat/*  --PR-->  develop  --checkout-->  release/2.0.0-*  --PR-->  develop  --PR-->  main
  ^                ^                      ^                         ^
  |                |                      |                         |
from develop  integration v2        freeze + bump            tag v* + publish
(never from                                           (only stable reaches
 release/*)                                            main via develop)
```

| Branch | Role | Lifetime | Who writes |
|--------|------|----------|------------|
| `main` | Stable, `npm@latest`, tags `v*`. | Permanent | Only via PR from `develop` (M5) or `hotfix/*` (emergency) |
| `develop` | Integration for `v2`. 4 devs merge here continuously. | Permanent | `feat/*`, `fix/*`, `release/*` |
| `release/2.0.0-alpha`, `...-beta.1`, `...-rc.1` | Freeze a version: bump `package.json`, `CHANGELOG.md`, only critical `fix/*`. | Ephemeral (days/weeks) | Cut from `develop`, merged back to `develop` |
| `feat/<scope>-<desc>` | Feature work | Ephemeral | Cut from `develop`, PR to `develop` |
| `hotfix/<version>` | Emergency fix for `main` (1.x or v2 stable) | Ephemeral | Cut from `main`, PR to `main` + back-merge to `develop` |

Conventional Commits are required: `feat:`, `fix:`, `chore(release):`, `docs:`, `ci:` (already used in history, e.g. `chore(release): 1.2.0`).

### SemVer rules (ROADMAP.md Versioning Philosophy)

- `patch` (`2.0.1`): `fix/*` only, no schema/CLI/template break.
- `minor` (`2.1.0`): new optional prompts/templates/providers, additive only.
- `major` (`3.0.0`): config schema, CLI surface, template contract, or generator engine break.
- Prereleases: `2.0.0-alpha.N` (M1), `2.0.0-alpha.2` (M2), `2.0.0-beta.N` (M3), `2.0.0-rc.N` (M4). Published with npm dist-tags `alpha`/`beta`/`rc`/`next`; `latest` is reserved for stable.

### CI mapping

- `eslint.yml`: runs on `push` to `main`, `develop`, `release/**`, `hotfix/**` and on `PR` to `main`/`develop`.
- `publish.yml`: triggers on `push` to `main` and `tags v*`. New `Determine publish eligibility` step maps `package.json` version to `dist_tag` (`alpha`/`beta`/`rc`/`next`/`latest`) and publishes with `npm publish --tag <dist_tag>` (prereleases) or without flag (stable). `release` job creates GitHub Release with `--prerelease` when `stable=false`.

## Consequences

- 4 devs can work in parallel on `feat/* -> develop` without blocking on a shared `release/*` (which is only a short freeze).
- `main` history stays clean: one tag per release, linear provenance, OIDC `publish` only from `main`.
- `release/*` branches are cheap, make `CHANGELOG.md` and `package.json` bumps reviewable, and give a single place to gate `npm test` + `verify*` before tagging.
- Cost: `release/*` must be back-merged to `develop` immediately after creation, otherwise `develop` and `release/*` diverge (enforced by branch protection).

## Alternatives considered

- `feat -> release/* -> develop -> main` (user's initial proposal): rejected — serializes 4 devs onto one active `release/*`, `release/*` becomes a second `develop`.
- `feat -> main` (GitHub Flow, no `develop`): rejected for `v2` train length — `main` would receive breaking changes for months before `v2.0.0`.
- `main` + `next` instead of `main` + `develop`: equivalent semantics; kept `develop` to preserve existing remote `origin/develop` and match the user's requested naming.

## References

- Code: `package.json:3`, `.github/workflows/publish.yml:10`, `.github/workflows/eslint.yml:4`
- Docs: `docs/ROADMAP.md:18`, `docs/PLAN.md:5`, `docs/CHANGELOG.md`, `docs/BRANCHING.md`
- Issues: create-lumen#13-#38 (M1-M5)
