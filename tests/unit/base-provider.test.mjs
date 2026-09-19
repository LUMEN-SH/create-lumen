import test from "node:test";
import assert from "node:assert/strict";
import {
  BaseProvider,
  ViteReactProvider,
  NextAppRouterProvider,
  NextPagesRouterProvider,
  getProvider,
  listProviders,
} from "../../src/engine/providers/base-provider.js";

test("base-provider: BaseProvider cannot be instantiated directly", () => {
  assert.throws(
    () => new BaseProvider({ name: "foo", variant: "bar" }),
    /Cannot instantiate abstract BaseProvider directly/
  );
});

test("base-provider: ViteReactProvider returns correct file plan and package set", () => {
  const provider = getProvider("react", "vite");
  assert.ok(provider instanceof ViteReactProvider);
  assert.equal(provider.getFilePlan({ lang: "ts" }), "templates/bases/react/vite/ts");
  assert.equal(provider.getFilePlan({ lang: "js" }), "templates/bases/react/vite/js");

  const pkgSetTs = provider.getPackageSet({ options: { language: "ts" } });
  assert.ok(pkgSetTs.dependencies.react);
  assert.ok(pkgSetTs.devDependencies.vite);
  assert.ok(pkgSetTs.devDependencies.typescript);

  const pkgSetJs = provider.getPackageSet({ options: { language: "js" } });
  assert.ok(pkgSetJs.dependencies.react);
  assert.equal(pkgSetJs.devDependencies.typescript, undefined);
});

test("base-provider: NextAppRouterProvider returns correct file plan and dependencies", () => {
  const provider = getProvider("next", "app-router");
  assert.ok(provider instanceof NextAppRouterProvider);
  assert.equal(provider.getFilePlan({ lang: "ts" }), "templates/bases/next/app-router/ts");

  const pkgSet = provider.getPackageSet({ options: { language: "ts" } });
  assert.ok(pkgSet.dependencies.next);
  assert.ok(pkgSet.dependencies.react);
  assert.ok(pkgSet.devDependencies.typescript);
});

test("base-provider: NextPagesRouterProvider returns correct file plan and dependencies", () => {
  const provider = getProvider("next", "pages-router");
  assert.ok(provider instanceof NextPagesRouterProvider);
  assert.equal(provider.getFilePlan({ lang: "ts" }), "templates/bases/next/pages-router/ts");

  const pkgSet = provider.getPackageSet({ options: { language: "ts" } });
  assert.ok(pkgSet.dependencies.next);
});

test("base-provider: registry contains all three default providers", () => {
  const providers = listProviders();
  assert.equal(providers.length >= 3, true);
  assert.ok(getProvider("react", "vite"));
  assert.ok(getProvider("next", "app-router"));
  assert.ok(getProvider("next", "pages-router"));
  assert.equal(getProvider("unknown", "none"), null);
});
