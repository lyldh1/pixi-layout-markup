import { existsSync as $, readFileSync as _, mkdirSync as V, writeFileSync as j, readdirSync as C, statSync as q, unlinkSync as G } from "node:fs";
import { resolve as p, isAbsolute as W, sep as z, basename as k, dirname as L, join as D, relative as X } from "node:path";
import { compileMarkupModule as Z, compileMarkupRefsDeclaration as J, compileMarkupClassModule as B } from "./compiler.js";
import { SourceMapGenerator as H } from "source-map-js";
function I(t, e, n) {
  const r = n.replace(/\\/g, "/"), a = K(t), c = a.flatMap(O), f = a.flatMap((s) => s.children.flatMap((i) => x(i))), l = /* @__PURE__ */ new Map();
  for (const s of f) {
    const i = l.get(s.name) ?? [];
    i.push(s), l.set(s.name, i);
  }
  const u = /* @__PURE__ */ new Map();
  for (const s of e.matchAll(/import \{\s*([\w$]+)\s+as\s+([\w$]+)\s*\}/g))
    u.set(s[2], s[1]);
  const y = new H({ file: `${r}.js` });
  y.setSourceContent(r, t);
  const M = /* @__PURE__ */ new Map(), h = /* @__PURE__ */ new Map(), b = c[0], m = e.split(`
`);
  for (let s = 0; s < m.length; s += 1) {
    const i = m[s];
    let o;
    const v = i.match(/^const (__MarkupGraphicsContext\d+) = new __MarkupGraphicsContext/);
    v && (o = l.get("Graphics")?.shift() ?? l.get("LayoutGraphics")?.shift(), o && h.set(v[1], o));
    const g = i.match(/const (node\d+) = new ([\w$]+)\((.*)\);/);
    if (g) {
      const d = g[3].match(/context:\s*(__MarkupGraphicsContext\d+)/)?.[1], P = u.get(g[2]);
      o = d ? h.get(d) : P ? l.get(P)?.shift() : void 0, o && M.set(g[1], o);
    }
    if (!o) {
      const d = i.match(/\b(node\d+|__MarkupGraphicsContext\d+)\b/)?.[1];
      o = d ? M.get(d) ?? h.get(d) : void 0;
    }
    if (!o && /\btarget\b/.test(i) && !i.startsWith("export default") && (o = b), !o) continue;
    const w = i.match(/\["([^"]+)"\]/)?.[1], S = w ? o.attributes[w] ?? o.attributes[`prop.${w}`] ?? o.attributes[`set.${w}`] ?? o : o;
    y.addMapping({
      generated: { line: s + 1, column: Math.max(0, i.search(/\S/)) },
      original: { line: S.line, column: S.column },
      source: r
    });
  }
  return y.toJSON();
}
function K(t) {
  const e = [], n = [];
  for (let r = 0; r < t.length; ) {
    const a = t.indexOf("<", r);
    if (a < 0) break;
    const c = t[a + 1];
    if (c === "/") {
      n.pop(), r = t.indexOf(">", a + 2) + 1 || t.length;
      continue;
    }
    if (c === "?" || c === "!") {
      r = a + 2;
      continue;
    }
    const f = t.slice(a + 1).match(/^([A-Za-z_$][\w$:.-]*)/);
    if (!f) {
      r = a + 1;
      continue;
    }
    let l = a + 1 + f[0].length, u = "";
    for (; l < t.length; ) {
      const i = t[l];
      if (u)
        i === u && (u = "");
      else if (i === '"' || i === "'") u = i;
      else if (i === ">") break;
      l += 1;
    }
    const y = R(t, a + 1), M = {}, h = a + 1 + f[0].length, b = t.slice(h, l);
    for (const i of b.matchAll(/([A-Za-z_$][\w$:.-]*)\s*=\s*["']/g))
      M[i[1]] = R(t, h + (i.index ?? 0));
    const m = { name: f[1], ...y, attributes: M, children: [] }, s = n.at(-1);
    s ? s.children.push(m) : e.push(m), t.slice(a, l).trimEnd().endsWith("/") || n.push(m), r = l + 1;
  }
  return e;
}
function O(t) {
  return [t, ...t.children.flatMap(O)];
}
function x(t) {
  const e = [], n = [];
  for (const r of t.children)
    if (r.name.startsWith(`${t.name}.`))
      for (const a of r.children) e.push(...T(a));
    else Q(t, r) || n.push(r);
  return [
    ...e,
    ...t.name === "LayoutView" ? n.flatMap(x) : [t],
    ...t.name === "LayoutView" ? [t] : n.flatMap(x)
  ];
}
function T(t) {
  return t.name === "Value" ? [] : t.name === "Array" ? t.children.flatMap(T) : t.name === "Object" ? t.children.flatMap((e) => e.children.flatMap(T)) : x(t);
}
function Q(t, e) {
  return t.name !== "Graphics" && t.name !== "LayoutGraphics" ? !1 : !e.name.startsWith(`${t.name}.`);
}
function R(t, e) {
  const r = t.slice(0, e).split(/\r?\n/);
  return { line: r.length, column: r.at(-1)?.length ?? 0 };
}
function U(t, e, n = {}) {
  const r = p(n.rootDir ?? process.cwd()), a = n.generateRefTypes === !1 ? void 0 : F(e, { ...n, rootDir: r }), c = {
    ...n,
    rootDir: r,
    fileName: e,
    declarationFileName: a
  }, f = Z(t, c);
  return {
    code: f,
    map: I(t, f, e),
    declaration: a ? J(t, k(e, ".xml"), c) : void 0,
    declarationPath: a
  };
}
function rt(t, e) {
  return B(t, e);
}
function Y(t) {
  !t.declaration || !t.declarationPath || ($(t.declarationPath) ? _(t.declarationPath, "utf8") : null) === t.declaration || (V(L(t.declarationPath), { recursive: !0 }), j(t.declarationPath, t.declaration, "utf8"));
}
function at(t, e = {}) {
  const n = [];
  return A(p(t), e, n), n;
}
function A(t, e, n) {
  for (const r of C(t, { withFileTypes: !0 })) {
    const a = D(t, r.name);
    if (r.isDirectory())
      A(a, e, n);
    else if (r.isFile() && r.name.toLowerCase().endsWith(".xml")) {
      const c = U(_(a, "utf8"), a, e);
      Y(c), c.declarationPath && n.push(c.declarationPath);
    }
  }
}
function F(t, e = {}) {
  if (!e.refTypesDir)
    return D(L(t), `${k(t, ".xml")}.refs.d.ts`);
  const n = p(e.rootDir ?? process.cwd()), r = W(e.refTypesDir) ? e.refTypesDir : p(n, e.refTypesDir), a = X(n, t), c = a.startsWith("..") ? k(t) : a;
  return D(r, c.replace(/\.xml$/i, ".refs.d.ts"));
}
function it(t, e = {}) {
  const n = F(t, e);
  $(n) && G(n);
}
function st(t) {
  if (!t.refTypesDir) return;
  const e = p(t.rootDir ?? process.cwd()), n = W(t.refTypesDir) ? p(t.refTypesDir) : p(e, t.refTypesDir);
  if (n === e || !n.startsWith(`${e}${z}`))
    throw new Error(`refTypesDir must stay inside rootDir: ${n}`);
  $(n) && E(n);
}
function E(t) {
  for (const e of C(t)) {
    const n = D(t, e);
    q(n).isDirectory() ? E(n) : e.endsWith(".refs.d.ts") && G(n);
  }
}
export {
  st as cleanMarkupRefTypes,
  rt as compileMarkupClass,
  U as compileMarkupFile,
  at as generateMarkupRefTypes,
  F as getRefTypesPath,
  it as removeMarkupRefTypes,
  Y as writeMarkupRefTypes
};
//# sourceMappingURL=core.js.map
