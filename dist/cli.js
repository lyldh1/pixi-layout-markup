#!/usr/bin/env node
import { existsSync as k, readFileSync as w, mkdirSync as x, writeFileSync as l } from "node:fs";
import { resolve as f, dirname as D, basename as m } from "node:path";
import { cleanMarkupRefTypes as v, generateMarkupRefTypes as T, compileMarkupFile as h, writeMarkupRefTypes as M } from "./core.js";
import { resolveMarkupConfig as d } from "./config.js";
const [, , p, ...u] = process.argv;
await R();
async function R() {
  p ? p === "generate-refs" ? await $(u) : await F(p, g(u), u) : (S(), process.exitCode = 1);
}
async function $(o) {
  const e = f(s(o, "--root") ?? "."), i = await d({
    configFile: y(o)
  }, { cwd: e }), t = f(i.config.rootDir ?? e), c = s(o, "--source") ?? g(o) ?? i.config.sourceDir ?? "src", n = f(t, c), r = {
    ...i.config,
    rootDir: t,
    refTypesDir: s(o, "--out") ?? i.config.refTypesDir ?? ".pixi-layout-markup/types",
    componentDirs: O(s(o, "--components")) ?? i.config.componentDirs ?? [c]
  };
  if (!k(n))
    throw new Error(`Markup source directory does not exist: ${n}`);
  (o.includes("--clean") || r.cleanRefTypes) && v(r);
  const a = T(n, r);
  console.log(`Generated ${a.length} ref declaration(s) from ${n}.`);
}
async function F(o, e, i) {
  const t = await d({
    configFile: y(i)
  }), c = f(o), n = f(e ?? o.replace(/\.xml$/i, ".markup.js")), r = h(w(c, "utf8"), c, {
    ...t.config,
    rootDir: t.config.rootDir ?? process.cwd(),
    refTypesDir: t.config.refTypesDir ?? ".pixi-layout-markup/types"
  });
  x(D(n), { recursive: !0 });
  const a = `${n}.map`;
  r.map.file = m(n), l(
    n,
    `${r.code}
//# sourceMappingURL=${m(a)}`,
    "utf8"
  ), l(a, JSON.stringify(r.map), "utf8"), M(r), console.log(n);
}
function s(o, e) {
  const i = o.indexOf(e);
  return i >= 0 ? o[i + 1] : void 0;
}
function O(o) {
  return o?.split(",").map((e) => e.trim()).filter(Boolean);
}
function y(o) {
  return o.includes("--no-config") ? !1 : s(o, "--config");
}
function g(o) {
  for (let e = 0; e < o.length; e += 1)
    if (o[e]?.startsWith("--"))
      o[e] !== "--clean" && o[e] !== "--no-config" && (e += 1);
    else
      return o[e];
}
function S() {
  console.error([
    "Usage:",
    "  pixi-layout-markup <view.xml> [output.js] [--config <file>] [--no-config]",
    "  pixi-layout-markup generate-refs [source-dir]",
    "    [--root <dir>] [--source <dir>] [--out <dir>]",
    "    [--components <dir,...>] [--clean] [--config <file>] [--no-config]"
  ].join(`
`));
}
//# sourceMappingURL=cli.js.map
