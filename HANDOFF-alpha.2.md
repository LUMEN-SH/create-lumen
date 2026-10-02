# Handoff — alpha.2 hasta tag + push

Fecha: 2026-10-02. Rama: `release/2.0.0-alpha.2` (worktree `jiaolong`).
Run de orquestación: `run_9515429d881b` (6/6 workers `worker_done`).

## Estado actual

Merges ya aplicados sobre `aeae7b2` (= `origin/develop`):

- `ea47ab9` feat #26 (A gating) + merge
- `f02fb3e` feat! #51 (C2 drop Bootstrap) + merge `7fc5bbb`→`d6a2fd4`
  (conflicto `prompts.js` resuelto: gating + sin bootstrap;
  2 tests de A actualizados a expectativa post-#51)
- `cd63e6a` feat #27 (B composition) + merge `d1f09fa`
  (conflictos `capabilities.js` trivial + `injector.js` tomados lado B)
- `d0cd48a` feat #33 (C1 shadcn) + merge `0d0a6a5`
  (`injectUiKit`/`getComponentsJson` + hook en `injectConditionals`)
- `7295bef` feat #34+#11 (D arch + back-nav) + merge `eccf3e2`
  (`prompts.js` reescrito: pasos de D + gating de A; `cli-args.js` unión
  `--framework` + `--arch`; `main.js` pasa `initialArch`)
- `1e94a0e` feat #10/#48 + fix #57 (E) + merge `8a2dcb4`
  (tests `dependencies` y `composition-epic` actualizados post-#51)
- `069c526` `chore(release): 2.0.0-alpha.2` (bump + CHANGELOG)

Verificado: `npm test` **231/231** en árbol fusionado.
Verificado en árbol E (pre-merge): `verify:installed` **4/4** (fix #57).

## Cambios SIN commitear (hacer primero)

1. `templates/architectures/none/src/types/index.{ts,js}` (nuevo —
   `none` no traía types y el audit lo exige).
2. `tests/verify/verify-offline.mjs` (audit `typesRel` arch-aware:
   `none` → `src/types/…`).

## Para seguir (en `jiaolong`)

```powershell
git status --short
git log --oneline -9
npm test
# esperado: 231 pass, 0 fail
npm run verify:offline
# esperado: 0 failures (antes: 11 celdas, 1 fallo en none+vitest, ya corregido)
npm run verify:installed
# esperado: 4 cells, 0 gate failures (lento: installs reales; ~10+ min).
# Si falla SOLO por red/timeout, reintentar una vez antes de tocar código.
```

Si todo verde:

```powershell
git add -A
git commit -m 'fix(verify): none arch types + arch-aware audit'
git tag v2.0.0-alpha.2
git push origin release/2.0.0-alpha.2
git push origin v2.0.0-alpha.2
```

El push del tag dispara `.github/workflows/publish.yml`:
`npm publish --tag alpha` + prerelease en GitHub. Confirmar con:

```powershell
gh release view v2.0.0-alpha.2 --repo LUMEN-SH/create-lumen
```

## Notas / riesgos

- NO pushear a `develop` ni `main` directo (ver `docs/BRANCHING.md`).
  El back-merge `release/2.0.0-alpha.2 → develop` va por PR después.
- `verify:offline` necesita toolchain vendoreado: si falla con
  "Missing vendored toolchain", correr `npm run verify:vendor` primero.
- Ramas hijas commiteadas y listas para borrar tras el tag:
  `alpha2-a-gating`, `alpha2-b-composition`, `alpha2-c1-shadcn`,
  `alpha2-c2-bootstrap`, `alpha2-d-archflow`, `alpha2-e-integration`.
- Terminales de workers 6/6 idle con prompts vivos; sus worktrees quedan
  como referencia hasta el back-merge.
- `package-lock.json` fue tocado por C2 y D: quedó resuelto en los merges,
  pero si `npm install` lo vuelve a modificar, revisar el diff antes del tag.
- Inconsistencia latente (no bloquea): `filterCompatibleChoices` incluye
  `component-based` para react, pero el provider declara
  `[feature-based, type-based, none]`. `type-based` es el alias vigente.
