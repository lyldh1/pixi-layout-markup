import { Container as i } from "pixi.js";
import { LayoutContainer as e } from "@pixi/layout/components";
class f extends i {
  refs;
  constructor(s, o) {
    const t = typeof s == "function" ? s : void 0, r = t ? o : s;
    super(r), this.refs = {}, t?.(this, this.refs);
  }
  /** Applies generated markup after derived class fields have been initialized. */
  applyMarkup(s) {
    s(this, this.refs);
  }
}
class u extends e {
  refs;
  constructor(s, o) {
    const t = typeof s == "function" ? s : void 0, r = t ? o : s;
    super(r), this.refs = {}, t?.(this, this.refs);
  }
  /** Applies generated markup after derived class fields have been initialized. */
  applyMarkup(s) {
    s(this, this.refs);
  }
}
export {
  f as MarkupContainer,
  u as MarkupLayoutContainer
};
//# sourceMappingURL=index.js.map
