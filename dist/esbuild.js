import { readFile as n } from "node:fs/promises";
import { resolveMarkupConfig as p } from "./config.js";
import { compileMarkupFile as u, writeMarkupRefTypes as l, compileMarkupClass as f } from "./core.js";
function M(i = {}) {
  return {
    name: "pixi-layout-markup",
    setup(r) {
      const s = r.initialOptions.absWorkingDir ?? process.cwd(), a = p(i, { cwd: s });
      r.onLoad({ filter: /\.xml$/ }, async ({ path: o }) => {
        const { config: e } = await a, t = u(await n(o, "utf8"), o, e);
        l(t);
        const c = Buffer.from(JSON.stringify(t.map), "utf8").toString("base64");
        return {
          contents: `${t.code}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,${c}`,
          loader: "js"
        };
      }), r.onLoad({ filter: /\.tsx?$/ }, async ({ path: o }) => {
        if (o.endsWith(".d.ts")) return null;
        const e = await n(o, "utf8"), t = f(e, o);
        return t ? { contents: t, loader: "ts" } : null;
      });
    }
  };
}
export {
  M as pixiLayoutMarkupEsbuild
};
//# sourceMappingURL=esbuild.js.map
