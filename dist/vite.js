import { resolveMarkupConfig as s } from "./config.js";
import { compileMarkupFile as f, writeMarkupRefTypes as u, compileMarkupClass as d, removeMarkupRefTypes as m, cleanMarkupRefTypes as h } from "./core.js";
function w(p = {}) {
  let a = s(p), n;
  return {
    name: "pixi-layout-markup",
    enforce: "pre",
    async configResolved(e) {
      a = s(p, { cwd: e.root }), n = (await a).path;
    },
    async buildStart() {
      const { config: e, path: t } = await a;
      n ??= t, n && this.addWatchFile(n), e.cleanRefTypes && h(e);
    },
    async configureServer(e) {
      const { config: t, path: r } = await a;
      n ??= r, n && (e.watcher.add(n), e.watcher.on("change", (i) => {
        i === n && e.restart();
      })), e.watcher.on("unlink", (i) => {
        i.endsWith(".xml") && m(i, t);
      });
    },
    async transform(e, t) {
      const { config: r } = await a;
      if (t.indexOf("?") >= 0) return null;
      const o = t;
      if (o.endsWith(".xml")) {
        const c = f(e, o, r);
        return u(c), {
          code: c.code,
          map: c.map
        };
      }
      if (!o.endsWith(".ts") || o.endsWith(".d.ts")) return null;
      const l = d(e, o);
      return l ? { code: l, map: null } : null;
    }
  };
}
export {
  w as pixiLayoutMarkup
};
//# sourceMappingURL=vite.js.map
