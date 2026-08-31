import { existsSync as f } from "node:fs";
import { readFile as p, writeFile as w, unlink as y } from "node:fs/promises";
import { resolve as s, dirname as l, isAbsolute as x, extname as M } from "node:path";
import { pathToFileURL as m } from "node:url";
import a from "typescript";
const k = [
  "pixi-layout-markup.config.ts",
  "pixi-layout-markup.config.mjs",
  "pixi-layout-markup.config.js",
  "pixi-layout-markup.config.cjs",
  "pixi-layout-markup.config.json"
];
function O(o) {
  return o;
}
function D(o = process.cwd(), t) {
  if (t !== !1) {
    if (typeof t == "string") {
      const n = x(t) ? t : s(o, t);
      if (!f(n)) throw new Error(`Markup config file does not exist: ${n}`);
      return n;
    }
    return k.map((n) => s(o, n)).find(f);
  }
}
async function C(o = {}) {
  const t = s(o.cwd ?? process.cwd()), n = D(t, o.configFile);
  if (!n) return { config: {} };
  const r = await j(n);
  if (!r || typeof r != "object" || Array.isArray(r))
    throw new Error(`Markup config must export an object: ${n}`);
  const c = r, e = l(n);
  return {
    path: n,
    config: {
      ...c,
      rootDir: s(e, c.rootDir ?? "."),
      configFile: n
    }
  };
}
async function A(o = {}, t = {}) {
  const n = s(t.cwd ?? process.cwd()), r = await C({ cwd: n, configFile: o.configFile }), c = d(o), e = $(r.config, c);
  return e.rootDir = s(n, c.rootDir ?? e.rootDir ?? "."), { config: e, path: r.path };
}
function $(o, t) {
  return {
    ...o,
    ...d(t),
    components: u(o.components, t.components),
    namespaces: u(o.namespaces, t.namespaces),
    componentMetadata: u(o.componentMetadata, t.componentMetadata)
  };
}
async function j(o) {
  const t = M(o).toLowerCase();
  if (t === ".json") return JSON.parse(await p(o, "utf8"));
  if (t !== ".ts") {
    const i = await import(`${m(o).href}?t=${Date.now()}`);
    return i.default ?? i;
  }
  const n = await p(o, "utf8"), r = a.transpileModule(n, {
    fileName: o,
    compilerOptions: {
      target: a.ScriptTarget.ES2022,
      module: a.ModuleKind.ESNext,
      moduleResolution: a.ModuleResolutionKind.Bundler
    },
    reportDiagnostics: !0
  }), c = r.diagnostics?.filter((i) => i.category === a.DiagnosticCategory.Error) ?? [];
  if (c.length > 0) {
    const i = a.formatDiagnostics(c, {
      getCanonicalFileName: (g) => g,
      getCurrentDirectory: () => l(o),
      getNewLine: () => `
`
    });
    throw new Error(`Cannot compile markup config ${o}:
${i}`);
  }
  const e = `${o}.${process.pid}-${Date.now()}.mjs`;
  await w(e, r.outputText, "utf8");
  try {
    const i = await import(`${m(e).href}?t=${Date.now()}`);
    return i.default ?? i;
  } finally {
    await y(e).catch(() => {
    });
  }
}
function u(o, t) {
  if (!(!o && !t))
    return { ...o, ...t };
}
function d(o) {
  return Object.fromEntries(
    Object.entries(o).filter(([, t]) => t !== void 0)
  );
}
export {
  O as defineMarkupConfig,
  D as findMarkupConfig,
  C as loadMarkupConfig,
  $ as mergeMarkupConfig,
  A as resolveMarkupConfig
};
//# sourceMappingURL=config.js.map
