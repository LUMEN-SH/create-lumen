# Contributing to create-lumen

## Branch workflow (summary)

Full human guide: [`docs/BRANCHING.md`](./docs/BRANCHING.md) · Formal decision: [`docs/adr/0002-branching-strategy.md`](./docs/adr/0002-branching-strategy.md)

```
feat/*  --PR-->  develop  --checkout-->  release/2.0.0-*  --PR-->  develop  --PR-->  main
```

- `main` — stable (`latest` on npm), tags `v*`. Only via PR from `develop` or `hotfix/*`.
- `develop` — integration for `v2` (4 devs). All `feat/*` land here.
- `release/*` — frozen snapshot for a version (bump `package.json` + `CHANGELOG.md`, only critical `fix/*`).
- `feat/*` / `fix/*` — ephemeral, cut from `develop`, PR to `develop`.

`1.x` (`v1.2.0`) is frozen. See `docs/BRANCHING.md` for step-by-step commands, SemVer rules, and checklists.

## Commit convention

Conventional Commits: `feat:`, `fix:`, `chore(release):`, `docs:`, `ci:`, `test:`, `refactor:`.

## Before opening a PR

```bash
git checkout develop && git pull --rebase origin develop
npm test
npx eslint bin src register.js
# if you touched templates/
npm run verify
```

CI gates: `ESLint` on `push` to `main`/`develop`/`release/**`/`hotfix/**` and `PR` to `main`/`develop` (`.github/workflows/eslint.yml`), publish on `push` to `main` + `tags v*` (`.github/workflows/publish.yml` with OIDC provenance + dist-tags).

## Release process (release manager only)

1. Cut `release/2.0.0-alpha` from `develop`, bump `package.json` (`npm version 2.0.0-alpha.0 --no-git-tag-version`) and `CHANGELOG.md`.
2. Freeze — only `fix/* -> release/*`.
3. When green: PR `release/* -> develop`, tag `v2.0.0-alpha.0`, `publish.yml` does `npm publish --tag alpha` + GitHub prerelease.
4. Stable `v2.0.0` (M5): PR `develop -> main`, tag `v2.0.0`, `npm publish` (`latest`).

## References

- Roadmap & versioning: `docs/ROADMAP.md`, `docs/PLAN.md`
- Changelog: `docs/CHANGELOG.md`
