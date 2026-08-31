import * as S from "typescript";
import { readFileSync as qe, existsSync as ae } from "node:fs";
import { dirname as U, resolve as v, isAbsolute as xe, extname as St, relative as Nt, sep as wt } from "node:path";
const Ge = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD", Tt = Ge + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040", At = "[" + Ge + "][" + Tt + "]*", Ct = new RegExp("^" + At + "$");
function Xe(n, e) {
  const t = [];
  let i = e.exec(n);
  for (; i; ) {
    const r = [];
    r.startIndex = e.lastIndex - i[0].length;
    const s = i.length;
    for (let o = 0; o < s; o++)
      r.push(i[o]);
    t.push(r), i = e.exec(n);
  }
  return t;
}
const He = function(n) {
  const e = Ct.exec(n);
  return !(e === null || typeof e > "u");
};
function _t(n) {
  return typeof n < "u";
}
const Ee = [
  // '__proto__',
  // 'constructor',
  // 'prototype',
  "hasOwnProperty",
  "toString",
  "valueOf",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__"
], ze = ["__proto__", "constructor", "prototype"], $t = {
  allowBooleanAttributes: !1,
  //A tag can have attributes without any value
  unpairedTags: []
};
function Ye(n, e) {
  e = Object.assign({}, $t, e);
  const t = [];
  let i = !1, r = !1;
  n[0] === "\uFEFF" && (n = n.substr(1));
  for (let s = 0; s < n.length; s++)
    if (n[s] === "<" && n[s + 1] === "?") {
      if (s += 2, s = Oe(n, s), s.err) return s;
    } else if (n[s] === "<") {
      let o = s;
      if (s++, n[s] === "!") {
        s = Le(n, s);
        continue;
      } else {
        let a = !1;
        n[s] === "/" && (a = !0, s++);
        let c = "";
        for (; s < n.length && n[s] !== ">" && n[s] !== " " && n[s] !== "	" && n[s] !== `
` && n[s] !== "\r"; s++)
          c += n[s];
        if (c = c.trim(), c[c.length - 1] === "/" && (c = c.substring(0, c.length - 1), s--), !kt(c)) {
          let d;
          return c.trim().length === 0 ? d = "Invalid space after '<'." : d = "Tag '" + c + "' is an invalid name.", T("InvalidTag", d, C(n, s));
        }
        const u = Lt(n, s);
        if (u === !1)
          return T("InvalidAttr", "Attributes for '" + c + "' have open quote.", C(n, s));
        let l = u.value;
        if (s = u.index, l[l.length - 1] === "/") {
          const d = s - l.length;
          l = l.substring(0, l.length - 1);
          const h = ve(l, e);
          if (h === !0)
            i = !0;
          else
            return T(h.err.code, h.err.msg, C(n, d + h.err.line));
        } else if (a)
          if (u.tagClosed) {
            if (l.trim().length > 0)
              return T("InvalidTag", "Closing tag '" + c + "' can't have attributes or invalid starting.", C(n, o));
            if (t.length === 0)
              return T("InvalidTag", "Closing tag '" + c + "' has not been opened.", C(n, o));
            {
              const d = t.pop();
              if (c !== d.tagName) {
                let h = C(n, d.tagStartPos);
                return T(
                  "InvalidTag",
                  "Expected closing tag '" + d.tagName + "' (opened in line " + h.line + ", col " + h.col + ") instead of closing tag '" + c + "'.",
                  C(n, o)
                );
              }
              t.length == 0 && (r = !0);
            }
          } else return T("InvalidTag", "Closing tag '" + c + "' doesn't have proper closing.", C(n, s));
        else {
          const d = ve(l, e);
          if (d !== !0)
            return T(d.err.code, d.err.msg, C(n, s - l.length + d.err.line));
          if (r === !0)
            return T("InvalidXml", "Multiple possible root nodes found.", C(n, s));
          e.unpairedTags.indexOf(c) !== -1 || t.push({ tagName: c, tagStartPos: o }), i = !0;
        }
        for (s++; s < n.length; s++)
          if (n[s] === "<")
            if (n[s + 1] === "!") {
              s++, s = Le(n, s);
              continue;
            } else if (n[s + 1] === "?") {
              if (s = Oe(n, ++s), s.err) return s;
            } else
              break;
          else if (n[s] === "&") {
            const d = Rt(n, s);
            if (d == -1)
              return T("InvalidChar", "char '&' is not expected.", C(n, s));
            s = d;
          } else if (r === !0 && !Ie(n[s]))
            return T("InvalidXml", "Extra text at the end", C(n, s));
        n[s] === "<" && s--;
      }
    } else {
      if (Ie(n[s]))
        continue;
      return T("InvalidChar", "char '" + n[s] + "' is not expected.", C(n, s));
    }
  if (i) {
    if (t.length == 1)
      return T("InvalidTag", "Unclosed tag '" + t[0].tagName + "'.", C(n, t[0].tagStartPos));
    if (t.length > 0)
      return T("InvalidXml", "Invalid '" + JSON.stringify(t.map((s) => s.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
  } else return T("InvalidXml", "Start tag expected.", 1);
  return !0;
}
function Ie(n) {
  return n === " " || n === "	" || n === `
` || n === "\r";
}
function Oe(n, e) {
  const t = e;
  for (; e < n.length; e++)
    if (n[e] == "?" || n[e] == " ") {
      const i = n.substr(t, e - t);
      if (e > 5 && i === "xml")
        return T("InvalidXml", "XML declaration allowed only at the start of the document.", C(n, e));
      if (n[e] == "?" && n[e + 1] == ">") {
        e++;
        break;
      } else
        continue;
    }
  return e;
}
function Le(n, e) {
  if (n.length > e + 5 && n[e + 1] === "-" && n[e + 2] === "-") {
    for (e += 3; e < n.length; e++)
      if (n[e] === "-" && n[e + 1] === "-" && n[e + 2] === ">") {
        e += 2;
        break;
      }
  } else if (n.length > e + 8 && n[e + 1] === "D" && n[e + 2] === "O" && n[e + 3] === "C" && n[e + 4] === "T" && n[e + 5] === "Y" && n[e + 6] === "P" && n[e + 7] === "E") {
    let t = 1;
    for (e += 8; e < n.length; e++)
      if (n[e] === "<")
        t++;
      else if (n[e] === ">" && (t--, t === 0))
        break;
  } else if (n.length > e + 9 && n[e + 1] === "[" && n[e + 2] === "C" && n[e + 3] === "D" && n[e + 4] === "A" && n[e + 5] === "T" && n[e + 6] === "A" && n[e + 7] === "[") {
    for (e += 8; e < n.length; e++)
      if (n[e] === "]" && n[e + 1] === "]" && n[e + 2] === ">") {
        e += 2;
        break;
      }
  }
  return e;
}
const It = '"', Ot = "'";
function Lt(n, e) {
  let t = "", i = "", r = !1;
  for (; e < n.length; e++) {
    if (n[e] === It || n[e] === Ot)
      i === "" ? i = n[e] : i !== n[e] || (i = "");
    else if (n[e] === ">" && i === "") {
      r = !0;
      break;
    }
    t += n[e];
  }
  return i !== "" ? !1 : {
    value: t,
    index: e,
    tagClosed: r
  };
}
const vt = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
function ve(n, e) {
  const t = Xe(n, vt), i = {};
  for (let r = 0; r < t.length; r++) {
    if (t[r][1].length === 0)
      return T("InvalidAttr", "Attribute '" + t[r][2] + "' has no space in starting.", W(t[r]));
    if (t[r][3] !== void 0 && t[r][4] === void 0)
      return T("InvalidAttr", "Attribute '" + t[r][2] + "' is without value.", W(t[r]));
    if (t[r][3] === void 0 && !e.allowBooleanAttributes)
      return T("InvalidAttr", "boolean attribute '" + t[r][2] + "' is not allowed.", W(t[r]));
    const s = t[r][2];
    if (!Pt(s))
      return T("InvalidAttr", "Attribute '" + s + "' is an invalid name.", W(t[r]));
    if (!Object.prototype.hasOwnProperty.call(i, s))
      i[s] = 1;
    else
      return T("InvalidAttr", "Attribute '" + s + "' is repeated.", W(t[r]));
  }
  return !0;
}
function Mt(n, e) {
  let t = /\d/;
  for (n[e] === "x" && (e++, t = /[\da-fA-F]/); e < n.length; e++) {
    if (n[e] === ";")
      return e;
    if (!n[e].match(t))
      break;
  }
  return -1;
}
function Rt(n, e) {
  if (e++, n[e] === ";")
    return -1;
  if (n[e] === "#")
    return e++, Mt(n, e);
  let t = 0;
  for (; e < n.length; e++, t++)
    if (!(n[e].match(/\w/) && t < 20)) {
      if (n[e] === ";")
        break;
      return -1;
    }
  return e;
}
function T(n, e, t) {
  return {
    err: {
      code: n,
      msg: e,
      line: t.line || t,
      col: t.col
    }
  };
}
function Pt(n) {
  return He(n);
}
function kt(n) {
  return He(n);
}
function C(n, e) {
  const t = n.substring(0, e).split(/\r?\n/);
  return {
    line: t.length,
    // column number is last line's length + 1, because column numbering starts at 1:
    col: t[t.length - 1].length + 1
  };
}
function W(n) {
  return n.startIndex + n[1].length;
}
const Ft = {
  cent: "¢",
  pound: "£",
  curren: "¤",
  yen: "¥",
  euro: "€",
  dollar: "$",
  fnof: "ƒ",
  inr: "₹",
  af: "؋",
  birr: "ብር",
  peso: "₱",
  rub: "₽",
  won: "₩",
  yuan: "¥",
  cedil: "¸"
}, Je = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  quot: '"'
}, jt = {
  nbsp: " ",
  copy: "©",
  reg: "®",
  trade: "™",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  bull: "•",
  para: "¶",
  sect: "§",
  deg: "°",
  frac12: "½",
  frac14: "¼",
  frac34: "¾"
}, K = Object.freeze({
  /** Resolve and expand the entity normally. */
  ALLOW: "allow",
  /** Silently skip this entity — it will not be registered. */
  BLOCK: "block",
  /** Throw an error, aborting entity registration entirely. */
  THROW: "throw"
}), Bt = new Set("!?\\\\/[]$%{}^&*()<>|+");
function Me(n) {
  if (n[0] === "#")
    throw new Error(`[EntityReplacer] Invalid character '#' in entity name: "${n}"`);
  for (const e of n)
    if (Bt.has(e))
      throw new Error(`[EntityReplacer] Invalid character '${e}' in entity name: "${n}"`);
  return n;
}
function q(...n) {
  const e = /* @__PURE__ */ Object.create(null);
  for (const t of n)
    if (t)
      for (const i of Object.keys(t)) {
        const r = t[i];
        if (typeof r == "string")
          e[i] = r;
        else if (r && typeof r == "object" && r.val !== void 0) {
          const s = r.val;
          typeof s == "string" && (e[i] = s);
        }
      }
  return e;
}
const F = "external", Q = "base", ce = "all";
function Vt(n) {
  return !n || n === F ? /* @__PURE__ */ new Set([F]) : n === ce ? /* @__PURE__ */ new Set([ce]) : n === Q ? /* @__PURE__ */ new Set([Q]) : Array.isArray(n) ? new Set(n) : /* @__PURE__ */ new Set([F]);
}
const $ = Object.freeze({ allow: 0, leave: 1, remove: 2, throw: 3 }), Ut = /* @__PURE__ */ new Set([9, 10, 13]);
function Wt(n) {
  if (!n)
    return { xmlVersion: 1, onLevel: $.allow, nullLevel: $.remove };
  const e = n.xmlVersion === 1.1 ? 1.1 : 1, t = $[n.onNCR] ?? $.allow, i = $[n.nullNCR] ?? $.remove, r = Math.max(i, $.remove);
  return { xmlVersion: e, onLevel: t, nullLevel: r };
}
class qt {
  /**
   * @param {object} [options]
   * @param {object|null}  [options.namedEntities]        — extra named entities merged into base map
   * @param {object}  [options.limit]                 — security limits
   * @param {number}       [options.limit.maxTotalExpansions=0]  — 0 = unlimited
   * @param {number}       [options.limit.maxExpandedLength=0]   — 0 = unlimited
   * @param {'external'|'base'|'all'|string[]} [options.limit.applyLimitsTo='external']
   *   Which entity tiers count against the security limits:
   *   - 'external' (default) — only input/runtime + persistent external entities
   *   - 'base'               — only DEFAULT_XML_ENTITIES + namedEntities
   *   - 'all'                — every entity regardless of tier
   *   - string[]             — explicit combination, e.g. ['external', 'base']
   * @param {((resolved: string, original: string) => string)|null} [options.postCheck=null]
   * @param {string[]} [options.remove=[]] — entity names (e.g. ['nbsp', '#13']) to delete (replace with empty string)
   * @param {string[]} [options.leave=[]]  — entity names to keep as literal (unchanged in output)
   * @param {object}   [options.ncr]       — Numeric Character Reference controls
   * @param {1.0|1.1}  [options.ncr.xmlVersion=1.0]
   *   XML version governing which codepoint ranges are restricted:
   *   - 1.0 — C0 controls U+0001–U+001F (except U+0009/000A/000D) are prohibited
   *   - 1.1 — C0 controls are allowed when written as NCRs; C1 (U+007F–U+009F) decoded as-is
   * @param {'allow'|'leave'|'remove'|'throw'} [options.ncr.onNCR='allow']
   *   Base action for numeric references. Severity order: allow < leave < remove < throw.
   *   For codepoint ranges that carry a minimum level (surrogates → remove, XML 1.0 C0 → remove),
   *   the effective action is max(onNCR, rangeMinimum).
   * @param {'remove'|'throw'} [options.ncr.nullNCR='remove']
   *   Action for U+0000 (null). 'allow' and 'leave' are clamped to 'remove' since null is never safe.
   * @param {((name: string, value: string) => 'allow'|'block'|'throw')|null} [options.onExternalEntity=null]
   *   Hook called when an external entity is registered via `setExternalEntities()` or
   *   `addExternalEntity()`. Return `ENTITY_ACTION.ALLOW` to accept the entity,
   *   `ENTITY_ACTION.BLOCK` to silently skip it, or `ENTITY_ACTION.THROW` to abort with an error.
   * @param {((name: string, value: string) => 'allow'|'block'|'throw')|null} [options.onInputEntity=null]
   *   Hook called when an input entity is registered via `addInputEntities()`. Return
   *   `ENTITY_ACTION.ALLOW` to accept, `ENTITY_ACTION.BLOCK` to silently skip, or
   *   `ENTITY_ACTION.THROW` to abort with an error.
   */
  constructor(e = {}) {
    this._limit = e.limit || {}, this._maxTotalExpansions = this._limit.maxTotalExpansions || 0, this._maxExpandedLength = this._limit.maxExpandedLength || 0, this._postCheck = typeof e.postCheck == "function" ? e.postCheck : (i) => i, this._limitTiers = Vt(this._limit.applyLimitsTo ?? F), this._numericAllowed = e.numericAllowed ?? !0, this._baseMap = q(Je, e.namedEntities || null), this._externalMap = /* @__PURE__ */ Object.create(null), this._inputMap = /* @__PURE__ */ Object.create(null), this._totalExpansions = 0, this._expandedLength = 0, this._removeSet = new Set(e.remove && Array.isArray(e.remove) ? e.remove : []), this._leaveSet = new Set(e.leave && Array.isArray(e.leave) ? e.leave : []);
    const t = Wt(e.ncr);
    this._ncrXmlVersion = t.xmlVersion, this._ncrOnLevel = t.onLevel, this._ncrNullLevel = t.nullLevel, this._onExternalEntity = typeof e.onExternalEntity == "function" ? e.onExternalEntity : null, this._onInputEntity = typeof e.onInputEntity == "function" ? e.onInputEntity : null;
  }
  // -------------------------------------------------------------------------
  // Private: registration hook dispatch
  // -------------------------------------------------------------------------
  /**
   * Invoke a registration hook for a single entity name/value pair.
   * Returns true when the entity should be accepted, false when it should be
   * silently skipped (BLOCK), and throws when the hook returns THROW.
   *
   * @param {((name: string, value: string) => 'allow'|'block'|'throw')|null} hook
   * @param {string} name
   * @param {string} value
   * @param {string} context  — used in error messages ('external' | 'input')
   * @returns {boolean}  true = accept, false = skip
   */
  _applyRegistrationHook(e, t, i, r) {
    if (!e) return !0;
    const s = e(t, i);
    if (s === K.BLOCK) return !1;
    if (s === K.THROW)
      throw new Error(
        `[EntityDecoder] Registration of ${r} entity "&${t};" was rejected by hook`
      );
    return !0;
  }
  // -------------------------------------------------------------------------
  // Persistent external entity registration
  // -------------------------------------------------------------------------
  /**
   * Replace the full set of persistent external entities.
   * All keys are validated — throws on invalid characters.
   * If `onExternalEntity` is set, it is called once per entry; entries that
   * return `ENTITY_ACTION.BLOCK` are silently omitted, `ENTITY_ACTION.THROW`
   * aborts the whole call.
   * @param {Record<string, string | { regex?: RegExp, val: string }>} map
   */
  setExternalEntities(e) {
    if (e)
      for (const r of Object.keys(e))
        Me(r);
    if (!this._onExternalEntity) {
      this._externalMap = q(e);
      return;
    }
    const t = q(e), i = /* @__PURE__ */ Object.create(null);
    for (const [r, s] of Object.entries(t))
      this._applyRegistrationHook(this._onExternalEntity, r, s, "external") && (i[r] = s);
    this._externalMap = i;
  }
  /**
   * Add a single persistent external entity.
   * If `onExternalEntity` is set it is called before the entity is stored;
   * `ENTITY_ACTION.BLOCK` silently skips storage, `ENTITY_ACTION.THROW` raises.
   * @param {string} key
   * @param {string} value
   */
  addExternalEntity(e, t) {
    Me(e), typeof t == "string" && t.indexOf("&") === -1 && this._applyRegistrationHook(this._onExternalEntity, e, t, "external") && (this._externalMap[e] = t);
  }
  // -------------------------------------------------------------------------
  // Input / runtime entity registration (per document)
  // -------------------------------------------------------------------------
  /**
   * Inject DOCTYPE entities for the current document.
   * Also resets per-document expansion counters.
   * If `onInputEntity` is set it is called once per entry; entries returning
   * `ENTITY_ACTION.BLOCK` are silently omitted, `ENTITY_ACTION.THROW` aborts.
   * @param {Record<string, string | { regx?: RegExp, regex?: RegExp, val: string }>} map
   */
  addInputEntities(e) {
    if (this._totalExpansions = 0, this._expandedLength = 0, !this._onInputEntity) {
      this._inputMap = q(e);
      return;
    }
    const t = q(e), i = /* @__PURE__ */ Object.create(null);
    for (const [r, s] of Object.entries(t))
      this._applyRegistrationHook(this._onInputEntity, r, s, "input") && (i[r] = s);
    this._inputMap = i;
  }
  // -------------------------------------------------------------------------
  // Per-document reset
  // -------------------------------------------------------------------------
  /**
   * Wipe input/runtime entities and reset counters.
   * Call this before processing each new document.
   * @returns {this}
   */
  reset() {
    return this._inputMap = /* @__PURE__ */ Object.create(null), this._totalExpansions = 0, this._expandedLength = 0, this;
  }
  // -------------------------------------------------------------------------
  // XML version (can be set after construction, e.g. once parser reads <?xml?>)
  // -------------------------------------------------------------------------
  /**
   * Update the XML version used for NCR classification.
   * Call this as soon as the document's `<?xml version="...">` declaration is parsed.
   * @param {1.0|1.1|number} version
   */
  setXmlVersion(e) {
    this._ncrXmlVersion = e === 1.1 ? 1.1 : 1;
  }
  // -------------------------------------------------------------------------
  // Primary API
  // -------------------------------------------------------------------------
  /**
   * Replace all entity references in `str` in a single pass.
   *
   * @param {string} str
   * @returns {string}
   */
  decode(e) {
    if (typeof e != "string" || e.length === 0 || e.indexOf("&") === -1) return e;
    const t = e, i = [], r = e.length;
    let s = 0, o = 0;
    const a = this._maxTotalExpansions > 0, c = this._maxExpandedLength > 0, u = a || c;
    for (; o < r; ) {
      if (e.charCodeAt(o) !== 38) {
        o++;
        continue;
      }
      let d = o + 1;
      for (; d < r && e.charCodeAt(d) !== 59 && d - o <= 32; ) d++;
      if (d >= r || e.charCodeAt(d) !== 59) {
        o++;
        continue;
      }
      const h = e.slice(o + 1, d);
      if (h.length === 0) {
        o++;
        continue;
      }
      let f, g;
      if (this._removeSet.has(h))
        f = "", g === void 0 && (g = F);
      else if (this._leaveSet.has(h)) {
        o++;
        continue;
      } else if (h.charCodeAt(0) === 35) {
        const m = this._resolveNCR(h);
        if (m === void 0) {
          o++;
          continue;
        }
        f = m, g = Q;
      } else {
        const m = this._resolveName(h);
        f = m?.value, g = m?.tier;
      }
      if (f === void 0) {
        o++;
        continue;
      }
      if (o > s && i.push(e.slice(s, o)), i.push(f), s = d + 1, o = s, u && this._tierCounts(g)) {
        if (a && (this._totalExpansions++, this._totalExpansions > this._maxTotalExpansions))
          throw new Error(
            `[EntityReplacer] Entity expansion count limit exceeded: ${this._totalExpansions} > ${this._maxTotalExpansions}`
          );
        if (c) {
          const m = f.length - (h.length + 2);
          if (m > 0 && (this._expandedLength += m, this._expandedLength > this._maxExpandedLength))
            throw new Error(
              `[EntityReplacer] Expanded content length limit exceeded: ${this._expandedLength} > ${this._maxExpandedLength}`
            );
        }
      }
    }
    s < r && i.push(e.slice(s));
    const l = i.length === 0 ? e : i.join("");
    return this._postCheck(l, t);
  }
  // -------------------------------------------------------------------------
  // Private: limit tier check
  // -------------------------------------------------------------------------
  /**
   * Returns true if a resolved entity of the given tier should count
   * against the expansion/length limits.
   * @param {string} tier  — LIMIT_TIER_EXTERNAL | LIMIT_TIER_BASE
   * @returns {boolean}
   */
  _tierCounts(e) {
    return this._limitTiers.has(ce) ? !0 : this._limitTiers.has(e);
  }
  // -------------------------------------------------------------------------
  // Private: entity resolution
  // -------------------------------------------------------------------------
  /**
   * Resolve a named entity token (without & and ;).
   * Priority: inputMap > externalMap > baseMap
   * Returns the resolved value tagged with its limit tier.
   *
   * @param {string} name
   * @returns {{ value: string, tier: string }|undefined}
   */
  _resolveName(e) {
    if (e in this._inputMap) return { value: this._inputMap[e], tier: F };
    if (e in this._externalMap) return { value: this._externalMap[e], tier: F };
    if (e in this._baseMap) return { value: this._baseMap[e], tier: Q };
  }
  /**
   * Classify a codepoint and return the minimum action level that must be applied.
   * Returns -1 when no minimum is imposed (normal allow path).
   *
   * Ranges checked (in priority order):
   *   1. U+0000            — null, governed by nullNCR (always ≥ remove)
   *   2. U+D800–U+DFFF     — surrogates, always prohibited (min: remove)
   *   3. U+0001–U+001F \ {0x09,0x0A,0x0D}  — XML 1.0 restricted C0 (min: remove)
   *      (skipped in XML 1.1 — C0 controls are allowed when written as NCRs)
   *
   * @param {number} cp  — codepoint
   * @returns {number}   — minimum NCR_LEVEL value, or -1 for no restriction
   */
  _classifyNCR(e) {
    return e === 0 ? this._ncrNullLevel : e >= 55296 && e <= 57343 || this._ncrXmlVersion === 1 && e >= 1 && e <= 31 && !Ut.has(e) ? $.remove : -1;
  }
  /**
   * Execute a resolved NCR action.
   *
   * @param {number} action   — NCR_LEVEL value
   * @param {string} token    — raw token (e.g. '#38') for error messages
   * @param {number} cp       — codepoint, used only for error messages
   * @returns {string|undefined}
   *   - decoded character string  → 'allow'
   *   - ''                        → 'remove'
   *   - undefined                 → 'leave' (caller must skip past '&' only)
   *   - throws Error              → 'throw'
   */
  _applyNCRAction(e, t, i) {
    switch (e) {
      case $.allow:
        return String.fromCodePoint(i);
      case $.remove:
        return "";
      case $.leave:
        return;
      // signal: keep literal
      case $.throw:
        throw new Error(
          `[EntityDecoder] Prohibited numeric character reference &${t}; (U+${i.toString(16).toUpperCase().padStart(4, "0")})`
        );
      default:
        return String.fromCodePoint(i);
    }
  }
  /**
   * Full NCR resolution pipeline for a numeric token.
   *
   * Steps:
   *   1. Parse the codepoint (decimal or hex).
   *   2. Validate the raw codepoint range (NaN, <0, >0x10FFFF).
   *   3. If numericAllowed is false and no minimum restriction applies → leave as-is.
   *   4. Classify the codepoint to find the minimum required action level.
   *   5. Resolve effective action = max(onNCR, minimum).
   *   6. Apply and return.
   *
   * @param {string} token  — e.g. '#38', '#x26', '#X26'
   * @returns {string|undefined}
   *   - string (incl. '')  — replacement ('' = remove)
   *   - undefined          — leave original &token; as-is
   */
  _resolveNCR(e) {
    const t = e.charCodeAt(1);
    let i;
    if (t === 120 || t === 88 ? i = parseInt(e.slice(2), 16) : i = parseInt(e.slice(1), 10), Number.isNaN(i) || i < 0 || i > 1114111) return;
    const r = this._classifyNCR(i);
    if (!this._numericAllowed && r < $.remove) return;
    const s = r === -1 ? this._ncrOnLevel : Math.max(this._ncrOnLevel, r);
    return this._applyNCRAction(s, e, i);
  }
}
const Ze = (n) => Ee.includes(n) ? "__" + n : n, Gt = {
  preserveOrder: !1,
  attributeNamePrefix: "@_",
  attributesGroupName: !1,
  textNodeName: "#text",
  ignoreAttributes: !0,
  removeNSPrefix: !1,
  // remove NS from tag name or attribute name if true
  allowBooleanAttributes: !1,
  //a tag can have attributes without any value
  //ignoreRootElement : false,
  parseTagValue: !0,
  parseAttributeValue: !1,
  trimValues: !0,
  //Trim string values of tag and attributes
  cdataPropName: !1,
  numberParseOptions: {
    hex: !0,
    leadingZeros: !0,
    eNotation: !0,
    unicode: !1
  },
  tagValueProcessor: function(n, e) {
    return e;
  },
  attributeValueProcessor: function(n, e) {
    return e;
  },
  stopNodes: [],
  //nested tags will not be parsed even for errors
  alwaysCreateTextNode: !1,
  isArray: () => !1,
  commentPropName: !1,
  unpairedTags: [],
  processEntities: !0,
  htmlEntities: !1,
  entityDecoder: null,
  ignoreDeclaration: !1,
  ignorePiTags: !1,
  transformTagName: !1,
  transformAttributeName: !1,
  updateTag: function(n, e, t) {
    return n;
  },
  // skipEmptyListItem: false
  captureMetaData: !1,
  maxNestedTags: 100,
  strictReservedNames: !0,
  jPath: !0,
  // if true, pass jPath string to callbacks; if false, pass matcher instance
  onDangerousProperty: Ze
};
function Xt(n, e) {
  if (typeof n != "string")
    return;
  const t = n.toLowerCase();
  if (Ee.some((i) => t === i.toLowerCase()))
    throw new Error(
      `[SECURITY] Invalid ${e}: "${n}" is a reserved JavaScript keyword that could cause prototype pollution`
    );
  if (ze.some((i) => t === i.toLowerCase()))
    throw new Error(
      `[SECURITY] Invalid ${e}: "${n}" is a reserved JavaScript keyword that could cause prototype pollution`
    );
}
function De(n, e) {
  return typeof n == "boolean" ? {
    enabled: n,
    // true or false
    maxEntitySize: 1e4,
    maxExpansionDepth: 1e4,
    maxTotalExpansions: 1 / 0,
    maxExpandedLength: 1e5,
    maxEntityCount: 1e3,
    allowedTags: null,
    tagFilter: null,
    appliesTo: "all"
  } : typeof n == "object" && n !== null ? {
    enabled: n.enabled !== !1,
    maxEntitySize: Math.max(1, n.maxEntitySize ?? 1e4),
    maxExpansionDepth: Math.max(1, n.maxExpansionDepth ?? 1e4),
    maxTotalExpansions: Math.max(1, n.maxTotalExpansions ?? 1 / 0),
    maxExpandedLength: Math.max(1, n.maxExpandedLength ?? 1e5),
    maxEntityCount: Math.max(1, n.maxEntityCount ?? 1e3),
    allowedTags: n.allowedTags ?? null,
    tagFilter: n.tagFilter ?? null,
    appliesTo: n.appliesTo ?? "all"
  } : De(!0);
}
const Ht = function(n) {
  const e = Object.assign({}, Gt, n), t = [
    { value: e.attributeNamePrefix, name: "attributeNamePrefix" },
    { value: e.attributesGroupName, name: "attributesGroupName" },
    { value: e.textNodeName, name: "textNodeName" },
    { value: e.cdataPropName, name: "cdataPropName" },
    { value: e.commentPropName, name: "commentPropName" }
  ];
  for (const { value: i, name: r } of t)
    i && Xt(i, r);
  return e.onDangerousProperty === null && (e.onDangerousProperty = Ze), e.processEntities = De(e.processEntities, e.htmlEntities), e.unpairedTagsSet = new Set(e.unpairedTags), e.stopNodes && Array.isArray(e.stopNodes) && (e.stopNodes = e.stopNodes.map((i) => typeof i == "string" && i.startsWith("*.") ? ".." + i.substring(2) : i)), e;
};
let k;
typeof Symbol != "function" ? k = "@@xmlMetadata" : k = /* @__PURE__ */ Symbol("XML Node Metadata");
class M {
  constructor(e) {
    this.tagname = e, this.child = [], this[":@"] = /* @__PURE__ */ Object.create(null);
  }
  add(e, t) {
    e === "__proto__" && (e = "#__proto__"), this.child.push({ [e]: t });
  }
  addChild(e, t) {
    e.tagname === "__proto__" && (e.tagname = "#__proto__"), e[":@"] && Object.keys(e[":@"]).length > 0 ? this.child.push({ [e.tagname]: e.child, ":@": e[":@"] }) : this.child.push({ [e.tagname]: e.child }), this.addStartIndex(t);
  }
  addStartIndex(e) {
    e !== void 0 && (this.child[this.child.length - 1][k] = { startIndex: e });
  }
  addEndIndex(e) {
    const t = this.child[this.child.length - 1];
    t !== void 0 && t[k] !== void 0 && t[k].endIndex === void 0 && (t[k].endIndex = e);
  }
  /** symbol used for metadata */
  static getMetaDataSymbol() {
    return k;
  }
}
const Ke = ":A-Za-z_À-ÖØ-öø-˿Ͱ-ͽͿ-҆҈-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�", zt = Ke + "\\-\\.\\d·̀-ͯ‿-⁀", Qe = ":A-Za-z_À-˿Ͱ-ͽͿ-҆҈-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�𐀀-󯿿", Yt = Qe + "\\-\\.\\d·̀-ͯ҇‿-⁀", Se = (n, e, t = "") => {
  const i = n.replace(":", ""), r = e.replace(":", ""), s = `[${i}][${r}]*`;
  return {
    name: new RegExp(`^[${n}][${e}]*$`, t),
    ncName: new RegExp(`^${s}$`, t),
    qName: new RegExp(`^${s}(?::${s})?$`, t),
    nmToken: new RegExp(`^[${e}]+$`, t),
    nmTokens: new RegExp(`^[${e}]+(?:\\s+[${e}]+)*$`, t)
  };
}, Jt = Se(Ke, zt), Zt = Se(Qe, Yt, "u"), et = ":A-Za-z_", Dt = et + "\\-\\.\\d", Kt = Se(et, Dt), Qt = (n = "1.0", e = !1) => e ? Kt : n === "1.1" ? Zt : Jt, tt = (n, { xmlVersion: e = "1.0", asciiOnly: t = !1 } = {}) => Qt(e, t).qName.test(n);
class en {
  constructor(e, t) {
    this.suppressValidationErr = !e, this.options = e, this.xmlVersion = t || 1;
  }
  setXmlVersion(e = 1) {
    this.xmlVersion = e;
  }
  readDocType(e, t) {
    const i = /* @__PURE__ */ Object.create(null);
    let r = 0;
    if (e[t + 3] === "O" && e[t + 4] === "C" && e[t + 5] === "T" && e[t + 6] === "Y" && e[t + 7] === "P" && e[t + 8] === "E") {
      t = t + 9;
      let s = 1, o = !1, a = !1, c = null, u = "";
      for (; t < e.length; t++) {
        if (c !== null) {
          e[t] === c && (c = null), u += e[t];
          continue;
        }
        if (!o && !a && (e[t] === '"' || e[t] === "'")) {
          c = e[t], u += e[t];
          continue;
        }
        if (e[t] === "<" && !a) {
          if (o && P(e, "!ENTITY", t)) {
            t += 7;
            let l, d;
            if ([l, d, t] = this.readEntityExp(e, t + 1, this.suppressValidationErr), d.indexOf("&") === -1) {
              if (this.options.enabled !== !1 && this.options.maxEntityCount != null && r >= this.options.maxEntityCount)
                throw new Error(
                  `Entity count (${r + 1}) exceeds maximum allowed (${this.options.maxEntityCount})`
                );
              i[l] = d, r++;
            }
          } else if (o && P(e, "!ELEMENT", t)) {
            t += 8;
            const { index: l } = this.readElementExp(e, t + 1);
            t = l;
          } else if (o && P(e, "!ATTLIST", t))
            t += 8;
          else if (o && P(e, "!NOTATION", t)) {
            t += 9;
            const { index: l } = this.readNotationExp(e, t + 1, this.suppressValidationErr);
            t = l;
          } else if (P(e, "!--", t)) a = !0;
          else throw new Error("Invalid DOCTYPE");
          s++, u = "";
        } else if (e[t] === ">") {
          if (a ? e[t - 1] === "-" && e[t - 2] === "-" && (a = !1, s--) : s--, s === 0)
            break;
        } else e[t] === "[" ? o = !0 : u += e[t];
      }
      if (c !== null || s !== 0)
        throw new Error("Unclosed DOCTYPE");
    } else
      throw new Error("Invalid Tag instead of DOCTYPE");
    return { entities: i, i: t };
  }
  readEntityExp(e, t) {
    t = _(e, t);
    const i = t;
    for (; t < e.length && !/\s/.test(e[t]) && e[t] !== '"' && e[t] !== "'"; )
      t++;
    let r = e.substring(i, t);
    if (G(r, { xmlVersion: this.xmlVersion }), t = _(e, t), !this.suppressValidationErr) {
      if (e.substring(t, t + 6).toUpperCase() === "SYSTEM")
        throw new Error("External entities are not supported");
      if (e[t] === "%")
        throw new Error("Parameter entities are not supported");
    }
    let s = "";
    if ([t, s] = this.readIdentifierVal(e, t, "entity"), this.options.enabled !== !1 && this.options.maxEntitySize != null && s.length > this.options.maxEntitySize)
      throw new Error(
        `Entity "${r}" size (${s.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`
      );
    return t--, [r, s, t];
  }
  readNotationExp(e, t) {
    t = _(e, t);
    const i = t;
    for (; t < e.length && !/\s/.test(e[t]); )
      t++;
    let r = e.substring(i, t);
    !this.suppressValidationErr && G(r, { xmlVersion: this.xmlVersion }), t = _(e, t);
    const s = e.substring(t, t + 6).toUpperCase();
    if (!this.suppressValidationErr && s !== "SYSTEM" && s !== "PUBLIC")
      throw new Error(`Expected SYSTEM or PUBLIC, found "${s}"`);
    t += s.length, t = _(e, t);
    let o = null, a = null;
    if (s === "PUBLIC")
      [t, o] = this.readIdentifierVal(e, t, "publicIdentifier"), t = _(e, t), (e[t] === '"' || e[t] === "'") && ([t, a] = this.readIdentifierVal(e, t, "systemIdentifier"));
    else if (s === "SYSTEM" && ([t, a] = this.readIdentifierVal(e, t, "systemIdentifier"), !this.suppressValidationErr && !a))
      throw new Error("Missing mandatory system identifier for SYSTEM notation");
    return { notationName: r, publicIdentifier: o, systemIdentifier: a, index: --t };
  }
  readIdentifierVal(e, t, i) {
    let r = "";
    const s = e[t];
    if (s !== '"' && s !== "'")
      throw new Error(`Expected quoted string, found "${s}"`);
    t++;
    const o = t;
    for (; t < e.length && e[t] !== s; )
      t++;
    if (r = e.substring(o, t), e[t] !== s)
      throw new Error(`Unterminated ${i} value`);
    return t++, [t, r];
  }
  readElementExp(e, t) {
    t = _(e, t);
    const i = t;
    for (; t < e.length && !/\s/.test(e[t]); )
      t++;
    let r = e.substring(i, t);
    if (!this.suppressValidationErr && !tt(r, { xmlVersion: this.xmlVersion }))
      throw new Error(`Invalid element name: "${r}"`);
    t = _(e, t);
    let s = "";
    if (e[t] === "E" && P(e, "MPTY", t)) t += 4;
    else if (e[t] === "A" && P(e, "NY", t)) t += 2;
    else if (e[t] === "(") {
      t++;
      const o = t;
      for (; t < e.length && e[t] !== ")"; )
        t++;
      if (s = e.substring(o, t), e[t] !== ")")
        throw new Error("Unterminated content model");
    } else if (!this.suppressValidationErr)
      throw new Error(`Invalid Element Expression, found "${e[t]}"`);
    return {
      elementName: r,
      contentModel: s.trim(),
      index: t
    };
  }
  readAttlistExp(e, t) {
    t = _(e, t);
    let i = t;
    for (; t < e.length && !/\s/.test(e[t]); )
      t++;
    let r = e.substring(i, t);
    for (G(r, { xmlVersion: this.xmlVersion }), t = _(e, t), i = t; t < e.length && !/\s/.test(e[t]); )
      t++;
    let s = e.substring(i, t);
    if (!G(s, { xmlVersion: this.xmlVersion }))
      throw new Error(`Invalid attribute name: "${s}"`);
    t = _(e, t);
    let o = "";
    if (e.substring(t, t + 8).toUpperCase() === "NOTATION") {
      if (o = "NOTATION", t += 8, t = _(e, t), e[t] !== "(")
        throw new Error(`Expected '(', found "${e[t]}"`);
      t++;
      let c = [];
      for (; t < e.length && e[t] !== ")"; ) {
        const u = t;
        for (; t < e.length && e[t] !== "|" && e[t] !== ")"; )
          t++;
        let l = e.substring(u, t);
        if (l = l.trim(), !G(l, { xmlVersion: this.xmlVersion }))
          throw new Error(`Invalid notation name: "${l}"`);
        c.push(l), e[t] === "|" && (t++, t = _(e, t));
      }
      if (e[t] !== ")")
        throw new Error("Unterminated list of notations");
      t++, o += " (" + c.join("|") + ")";
    } else {
      const c = t;
      for (; t < e.length && !/\s/.test(e[t]); )
        t++;
      o += e.substring(c, t);
      const u = ["CDATA", "ID", "IDREF", "IDREFS", "ENTITY", "ENTITIES", "NMTOKEN", "NMTOKENS"];
      if (!this.suppressValidationErr && !u.includes(o.toUpperCase()))
        throw new Error(`Invalid attribute type: "${o}"`);
    }
    t = _(e, t);
    let a = "";
    return e.substring(t, t + 8).toUpperCase() === "#REQUIRED" ? (a = "#REQUIRED", t += 8) : e.substring(t, t + 7).toUpperCase() === "#IMPLIED" ? (a = "#IMPLIED", t += 7) : [t, a] = this.readIdentifierVal(e, t, "ATTLIST"), {
      elementName: r,
      attributeName: s,
      attributeType: o,
      defaultValue: a,
      index: t
    };
  }
}
const _ = (n, e) => {
  for (; e < n.length && /\s/.test(n[e]); )
    e++;
  return e;
};
function P(n, e, t) {
  for (let i = 0; i < e.length; i++)
    if (e[i] !== n[t + i + 1]) return !1;
  return !0;
}
function G(n, e) {
  if (tt(n, { xmlVersion: e }))
    return n;
  throw new Error(`Invalid entity name ${n}`);
}
const tn = [
  // Basic Latin (ASCII) — included for completeness / pass-through
  48,
  // 0-9
  // Arabic scripts
  1632,
  // Arabic-Indic ٠١٢٣٤٥٦٧٨٩
  1776,
  // Extended Arabic-Indic (Urdu/Persian/Sindhi) ۰۱۲۳
  // Indic scripts
  2406,
  // Devanagari ०१२३४५६७८९
  2534,
  // Bengali ০১২৩৪৫৬৭৮৯
  2662,
  // Gurmukhi ੦੧੨੩੪੫੬੭੮੯
  2790,
  // Gujarati ૦૧૨૩૪૫૬૭૮૯
  2918,
  // Odia ୦୧୨୩୪୫୬୭୮୯
  3046,
  // Tamil ௦௧௨௩௪௫௬௭௮௯
  3174,
  // Telugu ౦౧౨౩౪౫౬౭౮౯
  3302,
  // Kannada ೦೧೨೩೪೫೬೭೮೯
  3430,
  // Malayalam ൦൧൨൩൪൫൬൭൮൯
  3558,
  // Sinhala Archaic ෦෧෨෩෪෫෬෭෮෯
  // Southeast Asian scripts
  3664,
  // Thai ๐๑๒๓๔๕๖๗๘๙
  3792,
  // Lao ໐໑໒໓໔໕໖໗໘໙
  3872,
  // Tibetan ༠༡༢༣༤༥༦༧༨༩
  4160,
  // Myanmar ၀၁၂၃၄၅၆၇၈၉
  4240,
  // Myanmar Shan ႐႑႒႓႔႕႖႗႘႙
  6112,
  // Khmer ០១២៣៤៥៦៧៨៩
  6160,
  // Mongolian ᠐᠑᠒᠓᠔᠕᠖᠗᠘᠙
  6470,
  // Limbu ᥆᥇᥈᥉᥊᥋᥌᥍᥎᥏
  6608,
  // New Tai Lue ᧐᧑᧒᧓᧔᧕᧖᧗᧘᧙
  6784,
  // Tai Tham Hora ᪀᪁᪂᪃᪄᪅᪆᪇᪈᪉
  6800,
  // Tai Tham Tham ᪐᪑᪒᪓᪔᪕᪖᪗᪘᪙
  6992,
  // Balinese ᭐᭑᭒᭓᭔᭕᭖᭗᭘᭙
  7088,
  // Sundanese ᮰᮱᮲᮳᮴᮵᮶᮷᮸᮹
  7232,
  // Lepcha ᱀᱁᱂᱃᱄᱅᱆᱇᱈᱉
  7248,
  // Ol Chiki ᱐᱑᱒᱓᱔᱕᱖᱗᱘᱙
  // Fullwidth (CJK context)
  65296,
  // Fullwidth ０１２３４５６７８９
  // Mathematical digit variants (Unicode math block)
  120782,
  // Mathematical Bold
  120792,
  // Mathematical Double-Struck
  120802,
  // Mathematical Sans-Serif
  120812,
  // Mathematical Sans-Serif Bold
  120822,
  // Mathematical Monospace
  // Other scripts
  66720,
  // Osmanya 𐒠𐒡𐒢𐒣𐒤𐒥𐒦𐒧𐒨𐒩
  68912,
  // Hanifi Rohingya 𐴰𐴱𐴲𐴳𐴴𐴵𐴶𐴷𐴸𐴹
  69734,
  // Brahmi 𑁦𑁧𑁨𑁩𑁪𑁫𑁬𑁭𑁮𑁯
  69872,
  // Sora Sompeng 𑃰𑃱𑃲𑃳𑃴𑃵𑃶𑃷𑃸𑃹
  69942,
  // Chakma 𑄶𑄷𑄸𑄹𑄺𑄻𑄼𑄽𑄾𑄿
  70096,
  // Sharada 𑇐𑇑𑇒𑇓𑇔𑇕𑇖𑇗𑇘𑇙
  70384,
  // Khudawadi 𑋰𑋱𑋲𑋳𑋴𑋵𑋶𑋷𑋸𑋹
  70736,
  // Newa 𑑐𑑑𑑒𑑓𑑔𑑕𑑖𑑗𑑘𑑙
  70864,
  // Tirhuta 𑓐𑓑𑓒𑓓𑓔𑓕𑓖𑓗𑓘𑓙
  71248,
  // Modi 𑙐𑙑𑙒𑙓𑙔𑙕𑙖𑙗𑙘𑙙
  71360,
  // Takri 𑛀𑛁𑛂𑛃𑛄𑛅𑛆𑛇𑛈𑛉
  71472,
  // Ahom 𑜰𑜱𑜲𑜳𑜴𑜵𑜶𑜷𑜸𑜹
  71904,
  // Warang Citi 𑣠𑣡𑣢𑣣𑣤𑣥𑣦𑣧𑣨𑣩
  72016,
  // Dives Akuru 𑥐𑥑𑥒𑥓𑥔𑥕𑥖𑥗𑥘𑥙
  72688,
  // Khitan Small Script 𑯰𑯱𑯲𑯳𑯴𑯵𑯶𑯷𑯸𑯹
  72784,
  // Bhaiksuki 𑱐𑱑𑱒𑱓𑱔𑱕𑱖𑱗𑱘𑱙
  73040,
  // Masaram Gondi 𑵐𑵑𑵒𑵓𑵔𑵕𑵖𑵗𑵘𑵙
  73120,
  // Gunjala Gondi 𑶠𑶡𑶢𑶣𑶤𑶥𑶦𑶧𑶨𑶩
  73552,
  // Kawi 𑽐𑽑𑽒𑽓𑽔𑽕𑽖𑽗𑽘𑽙
  92768,
  // Mro 𖩠𖩡𖩢𖩣𖩤𖩥𖩦𖩧𖩨𖩩
  92864,
  // Tangsa 𖫀𖫁𖫂𖫃𖫄𖫅𖫆𖫇𖫈𖫉
  93008,
  // Pahawh Hmong 𖭐𖭑𖭒𖭓𖭔𖭕𖭖𖭗𖭘𖭙
  123200,
  // Nyiakeng Puachue Hmong 𞅀𞅁𞅂𞅃𞅄𞅅𞅆𞅇𞅈𞅉
  123632,
  // Wancho 𞋰𞋱𞋲𞋳𞋴𞋵𞋶𞋷𞋸𞋹
  124144,
  // Nag Mundari 𞓰𞓱𞓲𞓳𞓴𞓵𞓶𞓷𞓸𞓹
  125264,
  // Adlam 𞥐𞥑𞥒𞥓𞥔𞥕𞥖𞥗𞥘𞥙
  130032
  // Segmented digit symbols 🯰🯱🯲🯳🯴🯵🯶🯷🯸🯹
], le = 255, ue = /* @__PURE__ */ new Map(), nt = 65535, rt = 1632, X = rt, nn = nt - rt + 1, de = new Uint8Array(nn).fill(le);
for (const n of tn)
  for (let e = 0; e < 10; e++) {
    const t = n + e;
    t <= nt ? de[t - X] = e : ue.set(t, e);
  }
const Re = 48, Pe = 57, ke = 45, D = /* @__PURE__ */ new Set([8722, 65293, 65123]);
function rn(n) {
  if (typeof n != "string") return n;
  const e = n.length;
  if (e === 0) return n;
  let t = -1;
  for (let r = 0; r < e; r++) {
    const s = n.charCodeAt(r);
    if (!(s >= Re && s <= Pe || s === ke)) {
      if (s < X) {
        if (D.has(s)) {
          t = r;
          break;
        }
        continue;
      }
      if (s >= 55296 && s <= 56319) {
        if (r + 1 < e) {
          const o = n.charCodeAt(r + 1);
          if (o >= 56320 && o <= 57343) {
            const a = 65536 + (s - 55296 << 10) + (o - 56320);
            if (ue.has(a)) {
              t = r;
              break;
            }
          }
        }
        continue;
      }
      if (de[s - X] !== le || D.has(s)) {
        t = r;
        break;
      }
    }
  }
  if (t === -1) return n;
  const i = [];
  t > 0 && i.push(n.slice(0, t));
  for (let r = t; r < e; r++) {
    const s = n.charCodeAt(r);
    if (s >= Re && s <= Pe || s === ke) {
      i.push(n[r]);
      continue;
    }
    if (s < X) {
      i.push(D.has(s) ? "-" : n[r]);
      continue;
    }
    if (s >= 55296 && s <= 56319) {
      if (r + 1 < e) {
        const a = n.charCodeAt(r + 1);
        if (a >= 56320 && a <= 57343) {
          const c = 65536 + (s - 55296 << 10) + (a - 56320), u = ue.get(c);
          if (u !== void 0) {
            i.push(String.fromCharCode(u + 48)), r++;
            continue;
          }
        }
      }
      i.push(n[r]);
      continue;
    }
    if (D.has(s)) {
      i.push("-");
      continue;
    }
    const o = de[s - X];
    i.push(o !== le ? String.fromCharCode(o + 48) : n[r]);
  }
  return i.join("");
}
const sn = /^[-+]?0x[a-fA-F0-9]+$/, on = /^0b[01]+$/, an = /^0o[0-7]+$/, cn = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/, ln = {
  hex: !0,
  binary: !1,
  octal: !1,
  leadingZeros: !0,
  decimalPoint: ".",
  eNotation: !0,
  //skipLike: /regex/,
  infinity: "original",
  // "null", "infinity" (Infinity type), "string" ("Infinity" (the string literal))
  unicode: !1
};
function un(n, e = {}) {
  if (e = Object.assign({}, ln, e), !n || typeof n != "string") return n;
  let t = n.trim();
  if (t.length === 0) return n;
  if (e.skipLike !== void 0 && e.skipLike.test(t)) return n;
  if (t === "0" || e.unicode && (t = rn(t), t === "0"))
    return 0;
  if (e.hex && sn.test(t))
    return ne(t, 16);
  if (e.binary && on.test(t))
    return ne(t, 2);
  if (e.octal && an.test(t))
    return ne(t, 8);
  if (isFinite(t)) {
    if (t.includes("e") || t.includes("E"))
      return hn(n, t, e);
    {
      const i = cn.exec(t);
      if (i) {
        const r = i[1] || "", s = i[2];
        let o = pn(i[3]);
        const a = r ? (
          // 0., -00., 000.
          n[s.length + 1] === "."
        ) : n[s.length] === ".";
        if (!e.leadingZeros && (s.length > 1 || s.length === 1 && !a))
          return n;
        {
          const c = Number(t), u = String(c);
          if (c === 0) return c;
          if (u.search(/[eE]/) !== -1)
            return e.eNotation ? c : n;
          if (t.indexOf(".") !== -1)
            return u === "0" || u === o || u === `${r}${o}` ? c : n;
          let l = s ? o : t;
          return s ? l === u || r + l === u ? c : n : l === u || l === r + u ? c : n;
        }
      } else
        return n;
    }
  } else return fn(n, Number(t), e);
}
const dn = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
function hn(n, e, t) {
  if (!t.eNotation) return n;
  const i = e.match(dn);
  if (i) {
    let r = i[1] || "";
    const s = i[3].indexOf("e") === -1 ? "E" : "e", o = i[2], a = r ? (
      // 0E.
      n[o.length + 1] === s
    ) : n[o.length] === s;
    return o.length > 1 && a ? n : o.length === 1 && (i[3].startsWith(`.${s}`) || i[3][0] === s) ? Number(e) : o.length > 0 ? t.leadingZeros && !a ? (e = (i[1] || "") + i[3], Number(e)) : n : Number(e);
  } else
    return n;
}
function pn(n) {
  if (n && n.indexOf(".") !== -1) {
    let e = n.length;
    for (; e > 0 && n.charCodeAt(e - 1) === 48; ) e--;
    return n = n.slice(0, e), n === "." ? n = "0" : n[0] === "." ? n = "0" + n : n[n.length - 1] === "." && (n = n.substring(0, n.length - 1)), n;
  }
  return n;
}
function ne(n, e) {
  const t = n.trim();
  if ((e === 2 || e === 8) && (n = t.substring(2)), parseInt) return parseInt(n, e);
  if (Number.parseInt) return Number.parseInt(n, e);
  if (window && window.parseInt) return window.parseInt(n, e);
  throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
}
function fn(n, e, t) {
  const i = e === 1 / 0;
  switch (t.infinity.toLowerCase()) {
    case "null":
      return null;
    case "infinity":
      return e;
    // Return Infinity or -Infinity
    case "string":
      return i ? "Infinity" : "-Infinity";
    default:
      return n;
  }
}
function gn(n) {
  return typeof n == "function" ? n : Array.isArray(n) ? (e) => {
    for (const t of n)
      if (typeof t == "string" && e === t || t instanceof RegExp && t.test(e))
        return !0;
  } : () => !1;
}
class Fe {
  /**
   * Create a new Expression
   * @param {string} pattern - Pattern string (e.g., "root.users.user", "..user[id]")
   * @param {Object} options - Configuration options
   * @param {string} options.separator - Path separator (default: '.')
   */
  constructor(e, t = {}, i) {
    this.pattern = e, this.separator = t.separator || ".", this.segments = this._parse(e), this.data = i, this._hasDeepWildcard = this.segments.some((r) => r.type === "deep-wildcard"), this._hasAttributeCondition = this.segments.some((r) => r.attrName !== void 0), this._hasPositionSelector = this.segments.some((r) => r.position !== void 0);
  }
  /**
   * Parse pattern string into segments
   * @private
   * @param {string} pattern - Pattern to parse
   * @returns {Array} Array of segment objects
   */
  _parse(e) {
    const t = [];
    let i = 0, r = "";
    for (; i < e.length; )
      e[i] === this.separator ? i + 1 < e.length && e[i + 1] === this.separator ? (r.trim() && (t.push(this._parseSegment(r.trim())), r = ""), t.push({ type: "deep-wildcard" }), i += 2) : (r.trim() && t.push(this._parseSegment(r.trim())), r = "", i++) : (r += e[i], i++);
    return r.trim() && t.push(this._parseSegment(r.trim())), t;
  }
  /**
   * Parse a single segment
   * @private
   * @param {string} part - Segment string (e.g., "user", "ns::user", "user[id]", "ns::user:first")
   * @returns {Object} Segment object
   */
  _parseSegment(e) {
    const t = { type: "tag" };
    let i = null, r = e;
    const s = e.match(/^([^\[]+)(\[[^\]]*\])(.*)$/);
    if (s && (r = s[1] + s[3], s[2])) {
      const l = s[2].slice(1, -1);
      l && (i = l);
    }
    let o, a = r;
    if (r.includes("::")) {
      const l = r.indexOf("::");
      if (o = r.substring(0, l).trim(), a = r.substring(l + 2).trim(), !o)
        throw new Error(`Invalid namespace in pattern: ${e}`);
    }
    let c, u = null;
    if (a.includes(":")) {
      const l = a.lastIndexOf(":"), d = a.substring(0, l).trim(), h = a.substring(l + 1).trim();
      ["first", "last", "odd", "even"].includes(h) || /^nth\(\d+\)$/.test(h) ? (c = d, u = h) : c = a;
    } else
      c = a;
    if (!c)
      throw new Error(`Invalid segment pattern: ${e}`);
    if (t.tag = c, o && (t.namespace = o), i)
      if (i.includes("=")) {
        const l = i.indexOf("=");
        t.attrName = i.substring(0, l).trim(), t.attrValue = i.substring(l + 1).trim();
      } else
        t.attrName = i.trim();
    if (u) {
      const l = u.match(/^nth\((\d+)\)$/);
      l ? (t.position = "nth", t.positionValue = parseInt(l[1], 10)) : t.position = u;
    }
    return t;
  }
  /**
   * Get the number of segments
   * @returns {number}
   */
  get length() {
    return this.segments.length;
  }
  /**
   * Check if expression contains deep wildcard
   * @returns {boolean}
   */
  hasDeepWildcard() {
    return this._hasDeepWildcard;
  }
  /**
   * Check if expression has attribute conditions
   * @returns {boolean}
   */
  hasAttributeCondition() {
    return this._hasAttributeCondition;
  }
  /**
   * Check if expression has position selectors
   * @returns {boolean}
   */
  hasPositionSelector() {
    return this._hasPositionSelector;
  }
  /**
   * Get string representation
   * @returns {string}
   */
  toString() {
    return this.pattern;
  }
}
class mn {
  constructor() {
    this._byDepthAndTag = /* @__PURE__ */ new Map(), this._wildcardByDepth = /* @__PURE__ */ new Map(), this._deepWildcards = [], this._deepByTerminalTag = /* @__PURE__ */ new Map(), this._patterns = /* @__PURE__ */ new Set(), this._sealed = !1;
  }
  /**
   * Add an Expression to the set.
   * Duplicate patterns (same pattern string) are silently ignored.
   *
   * @param {import('./Expression.js').default} expression - A pre-constructed Expression instance
   * @returns {this} for chaining
   * @throws {TypeError} if called after seal()
   *
   * @example
   * set.add(new Expression('root.users.user'));
   * set.add(new Expression('..script'));
   */
  add(e) {
    if (this._sealed)
      throw new TypeError(
        "ExpressionSet is sealed. Create a new ExpressionSet to add more expressions."
      );
    if (this._patterns.has(e.pattern)) return this;
    if (this._patterns.add(e.pattern), e.hasDeepWildcard()) {
      const s = e.segments[e.segments.length - 1];
      if (s && s.type !== "deep-wildcard" && s.tag !== "*") {
        const o = s.tag;
        this._deepByTerminalTag.has(o) || this._deepByTerminalTag.set(o, []), this._deepByTerminalTag.get(o).push(e);
      } else
        this._deepWildcards.push(e);
      return this;
    }
    const t = e.length, r = e.segments[e.segments.length - 1]?.tag;
    if (!r || r === "*")
      this._wildcardByDepth.has(t) || this._wildcardByDepth.set(t, []), this._wildcardByDepth.get(t).push(e);
    else {
      const s = `${t}:${r}`;
      this._byDepthAndTag.has(s) || this._byDepthAndTag.set(s, []), this._byDepthAndTag.get(s).push(e);
    }
    return this;
  }
  /**
   * Add multiple expressions at once.
   *
   * @param {import('./Expression.js').default[]} expressions - Array of Expression instances
   * @returns {this} for chaining
   *
   * @example
   * set.addAll([
   *   new Expression('root.users.user'),
   *   new Expression('root.config.setting'),
   * ]);
   */
  addAll(e) {
    for (const t of e) this.add(t);
    return this;
  }
  /**
   * Check whether a pattern string is already present in the set.
   *
   * @param {import('./Expression.js').default} expression
   * @returns {boolean}
   */
  has(e) {
    return this._patterns.has(e.pattern);
  }
  /**
   * Number of expressions in the set.
   * @type {number}
   */
  get size() {
    return this._patterns.size;
  }
  /**
   * Seal the set against further modifications.
   * Useful to prevent accidental mutations after config is built.
   * Calling add() or addAll() on a sealed set throws a TypeError.
   *
   * @returns {this}
   */
  seal() {
    return this._sealed = !0, this;
  }
  /**
   * Whether the set has been sealed.
   * @type {boolean}
   */
  get isSealed() {
    return this._sealed;
  }
  /**
   * Test whether the matcher's current path matches any expression in the set.
   *
   * Evaluation order (cheapest → most expensive):
   *  1. Exact depth + tag bucket  — O(1) lookup, typically 0–2 expressions
   *  2. Depth-only wildcard bucket — O(1) lookup, rare
   *  3. Deep-wildcard list         — always checked, but usually small
   *
   * @param {import('./Matcher.js').default} matcher - Matcher instance (or readOnly view)
   * @returns {boolean} true if any expression matches the current path
   *
   * @example
   * if (stopNodes.matchesAny(matcher)) {
   *   // handle stop node
   * }
   */
  matchesAny(e) {
    return this.findMatch(e) !== null;
  }
  /**
  * Find and return the first Expression that matches the matcher's current path.
  *
  * Uses the same evaluation order as matchesAny (cheapest → most expensive):
  *  1. Exact depth + tag bucket
  *  2. Depth-only wildcard bucket
  *  3. Deep-wildcard list
  *
  * @param {import('./Matcher.js').default} matcher - Matcher instance (or readOnly view)
  * @returns {import('./Expression.js').default | null} the first matching Expression, or null
  *
  * @example
  * const expr = stopNodes.findMatch(matcher);
  * if (expr) {
  *   // access expr.config, expr.pattern, etc.
  * }
  */
  findMatch(e) {
    const t = e.getDepth(), i = e.getCurrentTag(), r = `${t}:${i}`, s = this._byDepthAndTag.get(r);
    if (s) {
      for (let c = 0; c < s.length; c++)
        if (e.matches(s[c])) return s[c];
    }
    const o = this._wildcardByDepth.get(t);
    if (o) {
      for (let c = 0; c < o.length; c++)
        if (e.matches(o[c])) return o[c];
    }
    const a = this._deepByTerminalTag.get(i);
    if (a) {
      for (let c = 0; c < a.length; c++)
        if (e.matches(a[c])) return a[c];
    }
    for (let c = 0; c < this._deepWildcards.length; c++)
      if (e.matches(this._deepWildcards[c])) return this._deepWildcards[c];
    return null;
  }
}
class yn {
  /**
   * @param {Matcher} matcher - The parent Matcher instance to read from.
   */
  constructor(e) {
    this._matcher = e;
  }
  /**
   * Get the path separator used by the parent matcher.
   * @returns {string}
   */
  get separator() {
    return this._matcher.separator;
  }
  /**
   * Get current tag name.
   * @returns {string|undefined}
   */
  getCurrentTag() {
    const e = this._matcher.path;
    return e.length > 0 ? e[e.length - 1].tag : void 0;
  }
  /**
   * Get current namespace.
   * @returns {string|undefined}
   */
  getCurrentNamespace() {
    const e = this._matcher.path;
    return e.length > 0 ? e[e.length - 1].namespace : void 0;
  }
  /**
   * Get current node's attribute value.
   * @param {string} attrName
   * @returns {*}
   */
  getAttrValue(e) {
    const t = this._matcher.path;
    if (t.length !== 0)
      return t[t.length - 1].values?.[e];
  }
  /**
   * Check if current node has an attribute.
   * @param {string} attrName
   * @returns {boolean}
   */
  hasAttr(e) {
    const t = this._matcher.path;
    if (t.length === 0) return !1;
    const i = t[t.length - 1];
    return i.values !== void 0 && e in i.values;
  }
  /**
   * Get the value of a "kept" attribute from the nearest ancestor (or
   * current node) that declared it via `push(tag, attrs, ns, { keep: [...] })`.
   * @param {string} attrName
   * @returns {*}
   */
  getAnyParentAttr(e) {
    return this._matcher.getAnyParentAttr(e);
  }
  /**
   * Check whether any ancestor (or the current node) kept the given
   * attribute via `push(tag, attrs, ns, { keep: [...] })`.
   * @param {string} attrName
   * @returns {boolean}
   */
  hasAnyParentAttr(e) {
    return this._matcher.hasAnyParentAttr(e);
  }
  /**
   * Get current node's sibling position (child index in parent).
   * @returns {number}
   */
  getPosition() {
    const e = this._matcher.path;
    return e.length === 0 ? -1 : e[e.length - 1].position ?? 0;
  }
  /**
   * Get current node's repeat counter (occurrence count of this tag name).
   * @returns {number}
   */
  getCounter() {
    const e = this._matcher.path;
    return e.length === 0 ? -1 : e[e.length - 1].counter ?? 0;
  }
  /**
   * Get current node's sibling index (alias for getPosition).
   * @returns {number}
   * @deprecated Use getPosition() or getCounter() instead
   */
  getIndex() {
    return this.getPosition();
  }
  /**
   * Get current path depth.
   * @returns {number}
   */
  getDepth() {
    return this._matcher.path.length;
  }
  /**
   * Get path as string.
   * @param {string} [separator] - Optional separator (uses default if not provided)
   * @param {boolean} [includeNamespace=true]
   * @returns {string}
   */
  toString(e, t = !0) {
    return this._matcher.toString(e, t);
  }
  /**
   * Get path as array of tag names.
   * @returns {string[]}
   */
  toArray() {
    return this._matcher.path.map((e) => e.tag);
  }
  /**
   * Match current path against an Expression.
   * @param {Expression} expression
   * @returns {boolean}
   */
  matches(e) {
    return this._matcher.matches(e);
  }
  /**
   * Match any expression in the given set against the current path.
   * @param {ExpressionSet} exprSet
   * @returns {boolean}
   */
  matchesAny(e) {
    return e.matchesAny(this._matcher);
  }
}
class bn {
  /**
   * Create a new Matcher.
   * @param {Object} [options={}]
   * @param {string} [options.separator='.'] - Default path separator
   */
  constructor(e = {}) {
    this.separator = e.separator || ".", this.path = [], this.siblingStacks = [], this._pathStringCache = null, this._view = new yn(this), this._keptAttrs = [];
  }
  /**
   * Push a new tag onto the path.
   * @param {string} tagName
   * @param {Object|null} [attrValues=null]
   * @param {string|null} [namespace=null]
   * @param {Object|null} [options=null]
   * @param {string[]} [options.keep] - Names of attributes (from attrValues)
   */
  push(e, t = null, i = null, r = null) {
    this._pathStringCache = null, this.path.length > 0 && (this.path[this.path.length - 1].values = void 0);
    const s = this.path.length;
    let o = this.siblingStacks[s];
    o || (o = { counts: /* @__PURE__ */ new Map(), total: 0 }, this.siblingStacks[s] = o);
    const a = i ? `${i}:${e}` : e, c = o.counts.get(a) || 0, u = o.total;
    o.counts.set(a, c + 1), o.total++;
    const l = {
      tag: e,
      position: u,
      counter: c
    };
    i != null && (l.namespace = i), t != null && (l.values = t), this.path.push(l);
    const d = this.path.length, h = r !== null ? r.keep : null;
    if (h != null && h.length > 0 && t)
      for (let f = 0; f < h.length; f++) {
        const g = h[f];
        t[g] !== void 0 && this._keptAttrs.push({ depth: d, name: g, value: t[g] });
      }
  }
  /**
   * Pop the last tag from the path.
   * @returns {Object|undefined} The popped node
   */
  pop() {
    if (this.path.length === 0) return;
    this._pathStringCache = null;
    const e = this.path.pop();
    this.siblingStacks.length > this.path.length + 1 && (this.siblingStacks.length = this.path.length + 1);
    const t = this.path.length + 1;
    for (; this._keptAttrs.length > 0 && this._keptAttrs[this._keptAttrs.length - 1].depth >= t; )
      this._keptAttrs.pop();
    return e;
  }
  /**
   * Update current node's attribute values.
   * Useful when attributes are parsed after push.
   * @param {Object} attrValues
   */
  updateCurrent(e) {
    if (this.path.length > 0) {
      const t = this.path[this.path.length - 1];
      e != null && (t.values = e);
    }
  }
  /**
   * Get current tag name.
   * @returns {string|undefined}
   */
  getCurrentTag() {
    return this.path.length > 0 ? this.path[this.path.length - 1].tag : void 0;
  }
  /**
   * Get current namespace.
   * @returns {string|undefined}
   */
  getCurrentNamespace() {
    return this.path.length > 0 ? this.path[this.path.length - 1].namespace : void 0;
  }
  /**
   * Get current node's attribute value.
   * @param {string} attrName
   * @returns {*}
   */
  getAttrValue(e) {
    if (this.path.length !== 0)
      return this.path[this.path.length - 1].values?.[e];
  }
  /**
   * Check if current node has an attribute.
   * @param {string} attrName
   * @returns {boolean}
   */
  hasAttr(e) {
    if (this.path.length === 0) return !1;
    const t = this.path[this.path.length - 1];
    return t.values !== void 0 && e in t.values;
  }
  /**
   * Get the value of a "kept" attribute from the nearest ancestor (or
   * current node) that declared it via `push(tag, attrs, ns, { keep: [...] })`.
   * Unlike getAttrValue(), this works regardless of how deep the path has
   * gone since the attribute was pushed — but only for attribute names that
   * were explicitly marked with `keep` at push time. Cost is proportional to
   * the number of currently-kept attributes (typically 0-3), not path depth.
   * @param {string} attrName
   * @returns {*} the value, or undefined if no ancestor kept this attribute
   */
  getAnyParentAttr(e) {
    const t = this._keptAttrs;
    for (let i = t.length - 1; i >= 0; i--)
      if (t[i].name === e) return t[i].value;
  }
  /**
   * Check whether any ancestor (or the current node) kept the given
   * attribute via `push(tag, attrs, ns, { keep: [...] })`.
   * @param {string} attrName
   * @returns {boolean}
   */
  hasAnyParentAttr(e) {
    const t = this._keptAttrs;
    for (let i = t.length - 1; i >= 0; i--)
      if (t[i].name === e) return !0;
    return !1;
  }
  /**
   * Get current node's sibling position (child index in parent).
   * @returns {number}
   */
  getPosition() {
    return this.path.length === 0 ? -1 : this.path[this.path.length - 1].position ?? 0;
  }
  /**
   * Get current node's repeat counter (occurrence count of this tag name).
   * @returns {number}
   */
  getCounter() {
    return this.path.length === 0 ? -1 : this.path[this.path.length - 1].counter ?? 0;
  }
  /**
   * Get current node's sibling index (alias for getPosition).
   * @returns {number}
   * @deprecated Use getPosition() or getCounter() instead
   */
  getIndex() {
    return this.getPosition();
  }
  /**
   * Get current path depth.
   * @returns {number}
   */
  getDepth() {
    return this.path.length;
  }
  /**
   * Get path as string.
   * @param {string} [separator] - Optional separator (uses default if not provided)
   * @param {boolean} [includeNamespace=true]
   * @returns {string}
   */
  toString(e, t = !0) {
    const i = e || this.separator;
    if (i === this.separator && t === !0) {
      if (this._pathStringCache !== null)
        return this._pathStringCache;
      const s = this.path.map(
        (o) => o.namespace ? `${o.namespace}:${o.tag}` : o.tag
      ).join(i);
      return this._pathStringCache = s, s;
    }
    return this.path.map(
      (s) => t && s.namespace ? `${s.namespace}:${s.tag}` : s.tag
    ).join(i);
  }
  /**
   * Get path as array of tag names.
   * @returns {string[]}
   */
  toArray() {
    return this.path.map((e) => e.tag);
  }
  /**
   * Reset the path to empty.
   */
  reset() {
    this._pathStringCache = null, this.path = [], this.siblingStacks = [], this._keptAttrs = [];
  }
  /**
   * Match current path against an Expression.
   * @param {Expression} expression
   * @returns {boolean}
   */
  matches(e) {
    const t = e.segments;
    return t.length === 0 ? !1 : e.hasDeepWildcard() ? this._matchWithDeepWildcard(t) : this._matchSimple(t);
  }
  /**
   * @private
   */
  _matchSimple(e) {
    if (this.path.length !== e.length)
      return !1;
    for (let t = 0; t < e.length; t++)
      if (!this._matchSegment(e[t], this.path[t], t === this.path.length - 1))
        return !1;
    return !0;
  }
  /**
   * @private
   */
  _matchWithDeepWildcard(e) {
    let t = this.path.length - 1, i = e.length - 1;
    for (; i >= 0 && t >= 0; ) {
      const r = e[i];
      if (r.type === "deep-wildcard") {
        if (i--, i < 0)
          return !0;
        const s = e[i];
        let o = !1;
        for (let a = t; a >= 0; a--)
          if (this._matchSegment(s, this.path[a], a === this.path.length - 1)) {
            t = a - 1, i--, o = !0;
            break;
          }
        if (!o)
          return !1;
      } else {
        if (!this._matchSegment(r, this.path[t], t === this.path.length - 1))
          return !1;
        t--, i--;
      }
    }
    return i < 0;
  }
  /**
   * @private
   */
  _matchSegment(e, t, i) {
    if (e.tag !== "*" && e.tag !== t.tag || e.namespace !== void 0 && e.namespace !== "*" && e.namespace !== t.namespace || e.attrName !== void 0 && (!i || !t.values || !(e.attrName in t.values) || e.attrValue !== void 0 && String(t.values[e.attrName]) !== String(e.attrValue)))
      return !1;
    if (e.position !== void 0) {
      if (!i)
        return !1;
      const r = t.counter ?? 0;
      if (e.position === "first" && r !== 0)
        return !1;
      if (e.position === "odd" && r % 2 !== 1)
        return !1;
      if (e.position === "even" && r % 2 !== 0)
        return !1;
      if (e.position === "nth" && r !== e.positionValue)
        return !1;
    }
    return !0;
  }
  /**
   * Match any expression in the given set against the current path.
   * @param {ExpressionSet} exprSet
   * @returns {boolean}
   */
  matchesAny(e) {
    return e.matchesAny(this);
  }
  /**
   * Create a snapshot of current state.
   * @returns {Object}
   */
  snapshot() {
    return {
      path: this.path.map((e) => ({ ...e })),
      siblingStacks: this.siblingStacks.map((e) => e && { counts: new Map(e.counts), total: e.total }),
      keptAttrs: this._keptAttrs.map((e) => ({ ...e }))
    };
  }
  /**
   * Restore state from snapshot.
   * @param {Object} snapshot
   */
  restore(e) {
    this._pathStringCache = null, this.path = e.path.map((t) => ({ ...t })), this.siblingStacks = e.siblingStacks.map((t) => t && { counts: new Map(t.counts), total: t.total }), this._keptAttrs = (e.keptAttrs || []).map((t) => ({ ...t }));
  }
  /**
   * Return the read-only {@link MatcherView} for this matcher.
   *
   * The same instance is returned on every call — no allocation occurs.
   * It always reflects the current parser state and is safe to pass to
   * user callbacks without risk of accidental mutation.
   *
   * @returns {MatcherView}
   *
   * @example
   * const view = matcher.readOnly();
   * // pass view to callbacks — it stays in sync automatically
   * view.matches(expr);       // ✓
   * view.getCurrentTag();     // ✓
   * // view.push(...)         // ✗ method does not exist — caught by TypeScript
   */
  readOnly() {
    return this._view;
  }
}
const it = [
  {
    id: "html-script-open",
    description: "<script opening tag",
    pattern: /<script[\s>/]/i
  },
  {
    id: "html-script-close",
    description: "<\/script closing tag",
    pattern: /<\/script[\s>]/i
  },
  {
    id: "html-javascript-protocol",
    description: "javascript: URI scheme (with optional whitespace/encoding)",
    // Handles j&#x61;vascript:, j\u0061vascript:, and whitespace variants
    pattern: /j[\t\n\r ]*a[\t\n\r ]*v[\t\n\r ]*a[\t\n\r ]*s[\t\n\r ]*c[\t\n\r ]*r[\t\n\r ]*i[\t\n\r ]*p[\t\n\r ]*t[\t\n\r ]*:/i
  },
  {
    id: "html-vbscript-protocol",
    description: "vbscript: URI scheme",
    pattern: /vbscript[\t\n\r ]*:/i
  },
  {
    id: "html-data-html",
    description: "data:text/html URI — can execute scripts in browsers",
    pattern: /data[\t\n\r ]*:[\t\n\r ]*text\/html/i
  },
  {
    id: "html-data-xhtml",
    description: "data:application/xhtml+xml URI",
    pattern: /data[\t\n\r ]*:[\t\n\r ]*application\/xhtml/i
  },
  {
    id: "html-data-svg",
    description: "data:image/svg+xml URI — can execute scripts",
    pattern: /data[\t\n\r ]*:[\t\n\r ]*image\/svg\+xml/i
  },
  {
    id: "html-inline-event-handler",
    description: "Inline event handler attributes: onclick=, onerror=, onload=, etc.",
    // \bon ensures we match a word boundary so "phonetic=" is not caught
    pattern: /\bon\w{1,30}\s*=/i
  },
  {
    id: "html-entity-obfuscated-script",
    description: "HTML-entity-encoded <script (e.g. &#x3C;script or &lt;script)",
    // Entities include optional trailing semicolon: &#x3C; or &#x3C (both valid in HTML5)
    pattern: /(?:&#x0*3[Cc];?|&#0*60;?|&lt;)\s*script/i
  },
  {
    id: "html-entity-obfuscated-javascript",
    description: 'HTML-entity-encoded javascript: (partial — catches common &#106; or &#x6a; for "j")',
    pattern: /(?:&#x0*6[Aa];?|&#0*106;?)\s*(?:&#x0*61;?|a)[\s\S]{0,80}script\s*:/i
  },
  {
    id: "html-style-expression",
    description: "CSS expression() — IE-era code execution in style attributes",
    pattern: /style[\s\S]{0,20}expression\s*\(/i
  },
  {
    id: "html-object-embed",
    description: "<object or <embed tags that can load active content",
    pattern: /<(?:object|embed)[\s>/]/i
  },
  {
    id: "html-base-tag",
    description: "<base href= — can hijack all relative URLs on a page",
    pattern: /<base[\s>]/i
  },
  {
    id: "html-meta-refresh",
    description: '<meta http-equiv="refresh" — can redirect users',
    pattern: /<meta[\s\S]{0,40}http-equiv[\s\S]{0,20}refresh/i
  },
  {
    id: "html-srcdoc",
    description: "srcdoc= attribute on iframes — embeds HTML that can run scripts",
    pattern: /srcdoc\s*=/i
  },
  {
    id: "html-iframe",
    description: "<iframe tag",
    pattern: /<iframe[\s>/]/i
  },
  {
    id: "html-form",
    description: "<form tag — can be used for phishing / credential harvesting injection",
    pattern: /<form[\s>/]/i
  }
], st = [
  {
    id: "xml-cdata-injection",
    description: "CDATA section injection: <![CDATA[ breaks out of text node context",
    pattern: /<!\[CDATA\[/i
  },
  {
    id: "xml-cdata-close",
    description: "CDATA close sequence: ]]> can terminate an enclosing CDATA section",
    pattern: /\]\]>/
  },
  {
    id: "xml-processing-instruction",
    description: "XML processing instruction: <?xml-stylesheet or <?php etc.",
    pattern: /<\?(?:xml[\- ]|php|asp)/i
  },
  {
    id: "xml-doctype-injection",
    description: "DOCTYPE declaration embedded in content — can define entities",
    // Match <!DOCTYPE followed by end-of-string, whitespace, or [ (internal subset)
    pattern: /<!DOCTYPE(?:[\s[]|$)/i
  },
  {
    id: "xml-entity-system",
    description: "SYSTEM keyword — used in external entity declarations (XXE)",
    pattern: /\bSYSTEM\s+["']/i
  },
  {
    id: "xml-entity-public",
    description: "PUBLIC keyword — used in external entity declarations (XXE)",
    pattern: /\bPUBLIC\s+["']/i
  },
  {
    id: "xml-entity-declaration",
    description: "<!ENTITY declaration — defines entities, potential XXE or entity expansion",
    pattern: /<!ENTITY[\s%]/i
  },
  {
    id: "xml-billion-laughs",
    description: "Entity reference chaining / billion laughs: repeated &eX; style references",
    // Heuristic: 3+ consecutive entity refs suggests expansion attack
    pattern: /(?:&\w{1,20};){3,}/
  },
  {
    id: "xml-namespace-confusion",
    description: "xmlns: attribute injection — can redefine namespaces to confuse parsers",
    pattern: /\bxmlns\s*(?::\w{1,40})?\s*=/i
  },
  {
    id: "xml-comment-injection",
    description: "<!-- comment injection — can hide content from some parsers",
    pattern: /<!--/
  },
  {
    id: "xml-comment-close",
    description: "--> closes an enclosing XML comment",
    pattern: /-->/
  },
  {
    id: "xml-pi-close",
    description: "?> closes an enclosing processing instruction",
    pattern: /\?>/
  }
], xn = [
  {
    id: "svg-script-element",
    description: "<script element inside SVG executes JavaScript",
    pattern: /<script[\s>/]/i
  },
  {
    id: "svg-xlink-href-javascript",
    description: "xlink:href with javascript: — classic SVG XSS via <a> or <use>",
    pattern: /xlink\s*:\s*href\s*=\s*["']?\s*javascript\s*:/i
  },
  {
    id: "svg-href-javascript",
    description: "href= with javascript: in SVG context (<a>, <animate>, etc.)",
    pattern: /href\s*=\s*["']?\s*javascript\s*:/i
  },
  {
    id: "svg-foreignobject",
    description: "<foreignObject embeds HTML inside SVG — can execute scripts",
    pattern: /<foreignObject[\s>/]/i
  },
  {
    id: "svg-use-external",
    description: "<use xlink:href or href pointing to external resource (non-fragment URL)",
    // Match <use with href= where the value starts with a non-# character (external URL)
    // [\"'][^#] catches quoted values not starting with #; [^\"'#\s>] catches unquoted
    pattern: /<use[\s\S]{0,60}(?:xlink\s*:\s*)?href\s*=\s*(?:["'][^#]|[^"'#\s>])/i
  },
  {
    id: "svg-animate-href",
    description: '<animate attributeName="href" — can dynamically change href to javascript:',
    pattern: /<animate[\s\S]{0,80}attributeName\s*=\s*["'][\s]*href["']/i
  },
  {
    id: "svg-animate-xlinkhref",
    description: '<animate attributeName="xlink:href"',
    pattern: /<animate[\s\S]{0,80}attributeName\s*=\s*["'][\s]*xlink\s*:\s*href["']/i
  },
  {
    id: "svg-set-javascript",
    description: '<set to="javascript:..." — sets an attribute to a javascript: URI',
    pattern: /<set[\s\S]{0,80}to\s*=\s*["']?\s*javascript\s*:/i
  },
  {
    id: "svg-event-handler",
    description: "SVG-specific event handler attributes: onload=, onerror=, onactivate=, etc.",
    pattern: /\bon(?:load|error|activate|begin|end|repeat|focus|blur|click|mouse\w{1,20}|key\w{1,20})\s*=/i
  },
  {
    id: "svg-handler-generic",
    description: "Generic on* handler catch-all for SVG attributes",
    pattern: /\bon\w{1,30}\s*=/i
  },
  {
    id: "svg-filter-feimage",
    description: "<feImage href= — filter primitive that can load external resources",
    pattern: /<feImage[\s\S]{0,80}(?:xlink\s*:\s*)?href\s*=/i
  },
  {
    id: "svg-image-external",
    description: "<image xlink:href with http/https or javascript protocol",
    pattern: /<image[\s\S]{0,80}(?:xlink\s*:\s*)?href\s*=\s*["']?\s*(?:https?|javascript)\s*:/i
  },
  {
    id: "svg-style-javascript",
    description: "style= attribute containing javascript: (e.g. background:url(javascript:...))",
    pattern: /style\s*=[\s\S]{0,60}javascript\s*:/i
  }
], ot = [
  {
    id: "sql-block-comment-open",
    description: "SQL block comment open: /* ... */ — unusual in legitimate user text",
    pattern: /\/\*/
  },
  {
    id: "sql-union-select",
    description: "UNION SELECT — most common SQL injection aggregation attack",
    pattern: /\bUNION\s{1,20}(?:ALL\s{1,20})?SELECT\b/i
  },
  {
    id: "sql-drop-table",
    description: "DROP TABLE — destructive DDL injection",
    pattern: /\bDROP\s{1,20}TABLE\b/i
  },
  {
    id: "sql-drop-database",
    description: "DROP DATABASE — destructive DDL injection",
    pattern: /\bDROP\s{1,20}DATABASE\b/i
  },
  {
    id: "sql-insert-into",
    description: "INSERT INTO — data injection",
    pattern: /\bINSERT\s{1,20}INTO\b/i
  },
  {
    id: "sql-delete-from",
    description: "DELETE FROM — data deletion injection",
    pattern: /\bDELETE\s{1,20}FROM\b/i
  },
  {
    id: "sql-update-set",
    description: "UPDATE ... SET — data modification injection",
    // Allows arbitrary content between UPDATE and SET (table name, alias, etc.)
    pattern: /\bUPDATE\b[\s\S]{1,60}\bSET\b/i
  },
  {
    id: "sql-exec-xp",
    description: "EXEC xp_ — MSSQL extended stored procedure execution",
    pattern: /\bEXEC(?:UTE)?\s{1,20}xp_/i
  },
  {
    id: "sql-tautology-string",
    description: `Classic string tautology: ' OR '1'='1 or " OR "1"="1"`,
    // Last quote is optional — injection may truncate it: ' OR '1'='1--
    pattern: /'\s{0,10}OR\s{0,10}'[^']{0,20}'\s*=\s*'[^']{0,20}/i
  },
  {
    id: "sql-tautology-numeric",
    description: "Numeric tautology: OR 1=1",
    pattern: /\bOR\s{1,10}1\s*=\s*1\b/i
  },
  {
    id: "sql-always-true-zero",
    description: "Numeric tautology: OR 0=0",
    pattern: /\bOR\s{1,10}0\s*=\s*0\b/i
  },
  {
    id: "sql-sleep-benchmark",
    description: "Time-based blind injection: SLEEP() or BENCHMARK()",
    pattern: /\b(?:SLEEP|BENCHMARK)\s*\(/i
  },
  {
    id: "sql-waitfor-delay",
    description: "MSSQL time-based blind injection: WAITFOR DELAY",
    pattern: /\bWAITFOR\s{1,20}DELAY\b/i
  },
  {
    id: "sql-char-function",
    description: "CHAR() function — used to obfuscate injected strings",
    pattern: /\bCHAR\s*\(\s*\d{1,3}/i
  },
  {
    id: "sql-information-schema",
    description: "INFORMATION_SCHEMA — reconnaissance query for table/column enumeration",
    pattern: /\bINFORMATION_SCHEMA\b/i
  }
], En = [
  {
    id: "shell-path-traversal-unix",
    description: "Unix path traversal: ../  — climbing the directory tree",
    pattern: /\.\.\//
  },
  {
    id: "shell-path-traversal-windows",
    description: "Windows path traversal: ..\\ — climbing the directory tree",
    pattern: /\.\.\\/
  },
  {
    id: "shell-path-traversal-encoded",
    description: "URL-encoded path traversal: %2e%2e or %2f variants",
    pattern: /%2e%2e|%2f\.\.|\.\.%2f/i
  },
  {
    id: "shell-null-byte",
    description: "Null byte injection: \\x00 or %00 — truncates strings in C-backed functions",
    pattern: /\x00|%00/
  },
  {
    id: "shell-semicolon",
    description: "Semicolon command separator: cmd1; cmd2",
    pattern: /;/
  },
  {
    id: "shell-pipe",
    description: "Pipe operator: cmd1 | cmd2",
    pattern: /\|/
  },
  {
    id: "shell-and-operator",
    description: "AND operator: cmd1 && cmd2",
    pattern: /&&/
  },
  {
    id: "shell-or-operator",
    description: "OR operator: cmd1 || cmd2",
    pattern: /\|\|/
  },
  {
    id: "shell-backtick",
    description: "Backtick command substitution: `cmd`",
    pattern: /`/
  },
  {
    id: "shell-dollar-paren",
    description: "Dollar-paren command substitution: $(cmd)",
    pattern: /\$\(/
  },
  {
    id: "shell-dollar-brace",
    description: "Dollar-brace variable expansion: ${var} — can be abused for injection",
    pattern: /\$\{/
  },
  {
    id: "shell-redirect-out",
    description: "Output redirection: cmd > file or cmd >> file",
    pattern: />{1,2}/
  },
  {
    id: "shell-redirect-in",
    description: "Input redirection: cmd < file",
    pattern: /</
  },
  {
    id: "shell-newline-injection",
    description: "Newline injection: \\n or \\r — can inject new shell commands",
    pattern: /[\n\r]/
  },
  {
    id: "shell-glob-star",
    description: "Glob expansion: * or ? — can expand to unintended files",
    // Only flag when combined with path separators to reduce false positives
    pattern: /[/\\][*?]/
  },
  {
    id: "shell-absolute-root",
    description: "Absolute root path injection: string starting with / or \\ (Windows UNC)",
    pattern: /^(?:\/|\\\\)/
  },
  {
    id: "shell-windows-drive",
    description: "Windows drive letter path injection: C:\\ or D:/",
    pattern: /^[a-zA-Z]:[/\\]/
  },
  {
    id: "shell-curl-wget",
    description: "curl/wget with URL or flags — can exfiltrate data or download payloads",
    // Require a URL scheme (http/https/ftp) or a flag (-) to reduce false positives
    // "curl is a tool" won't match; "curl http://..." or "curl -s ..." will
    pattern: /\b(?:curl|wget)\s+(?:https?:\/\/|ftp:\/\/|-)/i
  }
], Sn = [
  {
    id: "redos-nested-quantifier-plus",
    description: "Nested + quantifier inside a group with outer quantifier: (a+)+, (.+b)*, etc.",
    // Matches any group containing a + quantifier, with an outer * or + — catches (a+)+, (.+b)*, etc.
    pattern: /\([^)]*\+[^)]*\)[+*]/
  },
  {
    id: "redos-nested-quantifier-star",
    description: "Nested * quantifier: (a*)* or (a*)+ — catastrophic backtracking",
    pattern: /\([^)]*\*[^)]*\)[*+]/
  },
  {
    id: "redos-nested-groups",
    description: "Doubly nested quantified groups: ((a+)+) — guaranteed catastrophic",
    pattern: /\(\([^)]{0,40}\)[+*]\)[+*]/
  },
  {
    id: "redos-alternation-overlap",
    description: "Overlapping alternation under quantifier: (a|a)+ — ambiguous NFA paths",
    // Detect repeated identical alternatives under a quantifier
    pattern: /\(([^|()]{1,20})\|(?:\1)(?:\|[^|()]{1,20}){0,5}\)[+*?]{1,2}/
  },
  {
    id: "redos-star-plus-concat",
    description: "(x*x)+ pattern — triggers super-linear backtracking",
    pattern: /\([^)]{0,10}\*[^)]{0,10}\)[+*]/
  },
  {
    id: "redos-dot-star-greedy",
    description: "(.*){n,} or (.+){n,} — repeated greedy dot quantifiers",
    pattern: /\(\.[*+]\)\{?\d/
  },
  {
    id: "redos-large-repetition",
    description: "Very large fixed or range repetition count {1000,} or {1000,n} — denial of service via backtracking",
    // Matches { followed by 4+ digits (≥1000), then optional ,digits }
    pattern: /\{\d{4,}(?:,\d*)?\}/
  },
  {
    id: "redos-catastrophic-alternation",
    description: "Long alternation with many similar branches — polynomial backtracking risk",
    // Heuristic: 10+ pipe-separated alternatives in a single group
    pattern: /\([^)]{0,200}(?:\|[^|)]{0,50}){9,}\)/
  }
], I = `["'\\s]*:`, Nn = [
  // ─── MongoDB $ operator injection ────────────────────────────────────────
  {
    id: "nosql-where-operator",
    description: "$where — executes arbitrary JavaScript server-side in MongoDB",
    pattern: new RegExp(`\\$where${I}`, "i")
  },
  {
    id: "nosql-ne-operator",
    description: '$ne — "not equal" operator used to bypass equality checks',
    pattern: new RegExp(`\\$ne${I}`, "i")
  },
  {
    id: "nosql-gt-operator",
    description: '$gt — "greater than" used to bypass password/value checks',
    pattern: new RegExp(`\\$gte?${I}`, "i")
  },
  {
    id: "nosql-lt-operator",
    description: '$lt / $lte — "less than" bypass variants',
    pattern: new RegExp(`\\$lte?${I}`, "i")
  },
  {
    id: "nosql-regex-operator",
    description: "$regex — can be used to extract data character by character (blind injection)",
    pattern: new RegExp(`\\$regex${I}`, "i")
  },
  {
    id: "nosql-or-operator",
    description: "$or — logical OR; used to create always-true conditions",
    pattern: new RegExp(`\\$or${I}\\s*\\[`, "i")
  },
  {
    id: "nosql-and-operator",
    description: "$and — logical AND operator injection",
    pattern: new RegExp(`\\$and${I}\\s*\\[`, "i")
  },
  {
    id: "nosql-nor-operator",
    description: "$nor — logical NOR operator injection",
    pattern: new RegExp(`\\$nor${I}\\s*\\[`, "i")
  },
  {
    id: "nosql-exists-operator",
    description: "$exists — can enumerate fields to determine schema",
    pattern: new RegExp(`\\$exists${I}`, "i")
  },
  {
    id: "nosql-in-operator",
    description: "$in — matches any value in a list; can enumerate values",
    pattern: new RegExp(`\\$in${I}\\s*\\[`, "i")
  },
  {
    id: "nosql-expr-operator",
    description: "$expr — allows aggregation expressions in queries (MongoDB 3.6+)",
    pattern: new RegExp(`\\$expr${I}`, "i")
  },
  {
    id: "nosql-function-operator",
    description: "$function — executes arbitrary JavaScript in MongoDB 4.4+",
    pattern: new RegExp(`\\$function${I}`, "i")
  },
  {
    id: "nosql-accumulator-operator",
    description: "$accumulator — custom aggregation with arbitrary JS execution",
    pattern: new RegExp(`\\$accumulator${I}`, "i")
  },
  // ─── Prototype pollution ─────────────────────────────────────────────────
  {
    id: "nosql-proto-pollution",
    description: "__proto__ — prototype pollution via object key injection",
    pattern: /__proto__/
  },
  {
    id: "nosql-constructor-prototype",
    description: "constructor.prototype — alternative prototype pollution vector (dot notation or JSON key)",
    // Matches dot-notation (obj.constructor.prototype) and JSON key adjacency
    // ("constructor": {"prototype": ...})
    pattern: /constructor[\s"':.,{\[]*prototype/i
  },
  {
    id: "nosql-proto-bracket",
    description: '["__proto__"] — bracket-notation prototype pollution',
    pattern: /\[["']__proto__["']\]/
  }
], wn = [
  // ─── CRLF / newline injection ─────────────────────────────────────────────
  {
    id: "log-crlf-injection",
    description: "CRLF injection: literal \\r or \\n embeds fake log lines",
    pattern: /[\r\n]/
  },
  {
    id: "log-url-encoded-crlf",
    description: "URL-encoded CRLF: %0d, %0a, %0D, %0A — decoded by some log parsers",
    pattern: /%0[dDaA]/
  },
  {
    id: "log-unicode-newline",
    description: "Unicode newline variants: U+2028 (line separator), U+2029 (paragraph separator)",
    pattern: /[\u2028\u2029]/
  },
  // ─── Log4Shell / JNDI injection (CVE-2021-44228) ─────────────────────────
  {
    id: "log-log4shell-jndi",
    description: "Log4Shell: ${jndi:...} triggers remote code execution in Apache Log4j",
    pattern: /\$\{jndi\s*:/i
  },
  {
    id: "log-log4shell-obfuscated",
    description: "Obfuscated Log4Shell: ${::-j}... lookup-bypass prefix used to evade WAF detection",
    // ${::- is the Log4j lookup-bypass escape sequence; presence alone is suspicious
    pattern: /\$\{::-/
  },
  {
    id: "log-log4j-lookup",
    description: "Log4j lookup syntax: ${env:...}, ${sys:...}, ${ctx:...} — data exfiltration",
    pattern: /\$\{(?:env|sys|ctx|main|map|sd|web|docker|k8s|spring)\s*:/i
  },
  // ─── Server-Side Template Injection (SSTI) in log messages ───────────────
  {
    id: "log-ssti-double-brace",
    description: "SSTI double-brace: {{expression}} — Jinja2, Twig, Handlebars, etc.",
    pattern: /\{\{[\s\S]{0,80}\}\}/
  },
  {
    id: "log-ssti-hash-brace",
    description: "SSTI hash-brace: #{expression} — Thymeleaf, Velocity, Ruby ERB",
    pattern: /#\{[\s\S]{0,80}\}/
  },
  {
    id: "log-ssti-dollar-brace",
    description: "SSTI/EL injection: ${expression with operators or method calls} — JSP EL, Freemarker, SpEL",
    // Require that the ${...} content looks like an expression, not a plain variable name.
    // Flags if the content contains: . ( * + operators, or known SSTI keywords.
    // This avoids flagging ${PATH}, ${HOME} etc. (plain shell variables).
    pattern: /\$\{[^}]*(?:\.|\(|\*|\+|\bclass\b|\bruntime\b|\bprocess\b|\bexec\b)[^}]{0,80}\}/i
  },
  {
    id: "log-ssti-percent-tag",
    description: "SSTI ERB/ASP tag: <%= expression %> — Ruby ERB, ASP",
    pattern: /<%=[\s\S]{0,80}%>/
  },
  // ─── Null byte ────────────────────────────────────────────────────────────
  {
    id: "log-null-byte",
    description: "Null byte: \\x00 or %00 — can truncate log entries in C-backed loggers",
    pattern: /\x00|%00/
  },
  // ─── ANSI escape injection ────────────────────────────────────────────────
  {
    id: "log-ansi-escape",
    description: "ANSI escape sequence: ESC[ — can manipulate terminal output when logs are tailed",
    pattern: /\x1b\[/
  }
], Tn = [
  {
    id: "sql-line-comment",
    description: "SQL line comment: -- followed by whitespace or end of string",
    pattern: /--(?:\s|$)/
  },
  {
    id: "sql-stacked-query",
    description: "Stacked queries: semicolon immediately followed by a SQL keyword",
    pattern: /;\s{0,10}(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b/i
  },
  {
    id: "sql-hex-encoding",
    description: "Hex-encoded string injection: 0x41414141 style (MySQL)",
    pattern: /\b0x[0-9a-f]{4,}/i
  }
], An = [...ot, ...Tn];
it.label = "HTML";
st.label = "XML";
xn.label = "SVG";
ot.label = "SQL";
An.label = "SQL-STRICT";
En.label = "SHELL";
Sn.label = "REDOS";
Nn.label = "NOSQL";
wn.label = "LOG";
function Cn(n) {
  if (typeof n != "string")
    throw new TypeError(
      `is-unsafe: first argument must be a string, got ${typeof n}`
    );
}
function _n(n) {
  if (!(n instanceof RegExp)) {
    if (Array.isArray(n)) {
      if (n.length === 0)
        throw new TypeError("is-unsafe: context must not be an empty array");
      if (Array.isArray(n[0])) {
        for (const e of n)
          if (!Array.isArray(e) || e.length === 0)
            throw new TypeError(
              "is-unsafe: each context in the array must be a non-empty pattern array (PatternList)"
            );
      }
      return;
    }
    throw new TypeError(
      `is-unsafe: second argument must be a PatternList (e.g. HTML), an array of PatternLists (e.g. [HTML, XML]), or a RegExp. Got: ${typeof n}`
    );
  }
}
function $n(n) {
  return n instanceof RegExp ? { lists: null, regex: n } : Array.isArray(n[0]) ? { lists: n, regex: null } : { lists: [n], regex: null };
}
function In(n, e) {
  const t = e.label ?? "CUSTOM";
  for (const i of e)
    if (i.pattern.test(n))
      return { context: t, id: i.id, description: i.description, pattern: i.pattern };
  return null;
}
function On(n, e) {
  Cn(n), _n(e);
  const { lists: t, regex: i } = $n(e);
  if (i) return i.test(n);
  for (const r of t)
    if (In(n, r) !== null) return !0;
  return !1;
}
function Ln(n, e) {
  if (!n) return {};
  const t = e.attributesGroupName ? n[e.attributesGroupName] : n;
  if (!t) return {};
  const i = {};
  for (const r in t)
    if (r.startsWith(e.attributeNamePrefix)) {
      const s = r.substring(e.attributeNamePrefix.length);
      i[s] = t[r];
    } else
      i[r] = t[r];
  return i;
}
function vn(n) {
  if (!n || typeof n != "string") return;
  const e = n.indexOf(":");
  if (e !== -1 && e > 0) {
    const t = n.substring(0, e);
    if (t !== "xmlns")
      return t;
  }
}
class Mn {
  constructor(e, t) {
    this.options = e, this.currentNode = null, this.tagsNodeStack = [], this.parseXml = jn, this.parseTextData = Rn, this.resolveNameSpace = Pn, this.buildAttributesMap = Fn, this.isItStopNode = Wn, this.replaceEntitiesValue = Vn, this.readStopNodeData = Xn, this.saveTextToParentTag = Un, this.addChild = Bn, this.ignoreAttributesFn = gn(this.options.ignoreAttributes), this.entityExpansionCount = 0, this.currentExpandedLength = 0, this.doctypefound = !1;
    let i = { ...Je };
    this.options.entityDecoder ? this.entityDecoder = this.options.entityDecoder : (typeof this.options.htmlEntities == "object" ? i = this.options.htmlEntities : this.options.htmlEntities === !0 && (i = { ...jt, ...Ft }), this.entityDecoder = new qt({
      namedEntities: { ...i, ...t },
      numericAllowed: this.options.htmlEntities,
      limit: {
        maxTotalExpansions: this.options.processEntities.maxTotalExpansions,
        maxExpandedLength: this.options.processEntities.maxExpandedLength,
        applyLimitsTo: this.options.processEntities.appliesTo
      },
      // onExternalEntity: (name, value) => isUnsafe(value) ? 'block' : 'allow',
      onInputEntity: (s, o) => (
        //TODO: VALID_CONTEXTS.HTML should be set only if this.options.htmlEntities
        On(o, [it, st]) ? K.BLOCK : K.ALLOW
      )
      //postCheck: resolved => resolved
    })), this.matcher = new bn(), this.readonlyMatcher = this.matcher.readOnly(), this.isCurrentNodeStopNode = !1, this.stopNodeExpressionsSet = new mn();
    const r = this.options.stopNodes;
    if (r && r.length > 0) {
      for (let s = 0; s < r.length; s++) {
        const o = r[s];
        typeof o == "string" ? this.stopNodeExpressionsSet.add(new Fe(o)) : o instanceof Fe && this.stopNodeExpressionsSet.add(o);
      }
      this.stopNodeExpressionsSet.seal();
    }
  }
}
function Rn(n, e, t, i, r, s, o) {
  const a = this.options;
  if (n !== void 0 && (a.trimValues && !i && (n = n.trim()), n.length > 0)) {
    o || (n = this.replaceEntitiesValue(n, e, t));
    const c = a.jPath ? t.toString() : t, u = a.tagValueProcessor(e, n, c, r, s);
    return u == null ? n : typeof u != typeof n || u !== n ? u : a.trimValues || n.trim() === n ? pe(n, a.parseTagValue, a.numberParseOptions) : n;
  }
}
function Pn(n) {
  if (this.options.removeNSPrefix) {
    const e = n.split(":"), t = n.charAt(0) === "/" ? "/" : "";
    if (e[0] === "xmlns")
      return "";
    e.length === 2 && (n = t + e[1]);
  }
  return n;
}
const kn = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
function Fn(n, e, t, i = !1) {
  const r = this.options;
  if (i === !0 || r.ignoreAttributes !== !0 && typeof n == "string") {
    const s = Xe(n, kn), o = s.length, a = {}, c = new Array(o);
    let u = !1;
    const l = {};
    for (let f = 0; f < o; f++) {
      const g = this.resolveNameSpace(s[f][1]), m = s[f][4];
      if (g.length && m !== void 0) {
        let y = m;
        r.trimValues && (y = y.trim()), y = this.replaceEntitiesValue(y, t, this.readonlyMatcher), c[f] = y, l[g] = y, u = !0;
      }
    }
    u && typeof e == "object" && e.updateCurrent && e.updateCurrent(l);
    const d = r.jPath ? e.toString() : this.readonlyMatcher;
    let h = !1;
    for (let f = 0; f < o; f++) {
      const g = this.resolveNameSpace(s[f][1]);
      if (this.ignoreAttributesFn(g, d)) continue;
      let m = r.attributeNamePrefix + g;
      if (g.length)
        if (r.transformAttributeName && (m = r.transformAttributeName(m)), m = at(m, r), s[f][4] !== void 0) {
          const y = c[f], b = r.attributeValueProcessor(g, y, d);
          b == null ? a[m] = y : typeof b != typeof y || b !== y ? a[m] = b : a[m] = pe(y, r.parseAttributeValue, r.numberParseOptions), h = !0;
        } else r.allowBooleanAttributes && (a[m] = !0, h = !0);
    }
    if (!h) return;
    if (r.attributesGroupName && !r.preserveOrder) {
      const f = {};
      return f[r.attributesGroupName] = a, f;
    }
    return a;
  }
}
const jn = function(n) {
  n = n.replace(/\r\n?/g, `
`);
  const e = new M("!xml");
  let t = e, i = "";
  this.matcher.reset(), this.entityDecoder.reset(), this.entityExpansionCount = 0, this.currentExpandedLength = 0, this.doctypefound = !1;
  const r = this.options, s = new en(r.processEntities), o = n.length;
  for (let a = 0; a < o; a++)
    if (n[a] === "<") {
      const u = n.charCodeAt(a + 1);
      if (u === 47) {
        const l = V(n, ">", a, "Closing Tag is not closed.");
        let d = n.substring(a + 2, l).trim();
        if (r.removeNSPrefix) {
          const f = d.indexOf(":");
          f !== -1 && (d = d.substr(f + 1));
        }
        d = re(r.transformTagName, d, "", r).tagName, t && (i = this.saveTextToParentTag(i, t, this.readonlyMatcher));
        const h = this.matcher.getCurrentTag();
        if (d && r.unpairedTagsSet.has(d))
          throw new Error(`Unpaired tag can not be used as closing tag: </${d}>`);
        h && r.unpairedTagsSet.has(h) && (this.matcher.pop(), this.tagsNodeStack.pop()), this.matcher.pop(), this.isCurrentNodeStopNode = !1, t = this.tagsNodeStack.pop() || e, r.captureMetaData && t && t.addEndIndex(l + 1), i = "", a = l;
      } else if (u === 63) {
        let l = he(n, a, !1, "?>");
        if (!l) throw new Error("Pi Tag is not closed.");
        i = this.saveTextToParentTag(i, t, this.readonlyMatcher);
        const d = this.buildAttributesMap(l.tagExp, this.matcher, l.tagName, !0);
        if (d) {
          const h = d[this.options.attributeNamePrefix + "version"];
          this.entityDecoder.setXmlVersion(Number(h) || 1), s.setXmlVersion(Number(h) || 1);
        }
        if (!(r.ignoreDeclaration && l.tagName === "?xml" || r.ignorePiTags)) {
          const h = new M(l.tagName);
          h.add(r.textNodeName, ""), l.tagName !== l.tagExp && l.attrExpPresent && r.ignoreAttributes !== !0 && (h[":@"] = d), this.addChild(t, h, this.readonlyMatcher, a), r.captureMetaData && t.addEndIndex(l.closeIndex + 2);
        }
        a = l.closeIndex + 1;
      } else if (u === 33 && n.charCodeAt(a + 2) === 45 && n.charCodeAt(a + 3) === 45) {
        const l = V(n, "-->", a + 4, "Comment is not closed.");
        if (r.commentPropName) {
          const d = n.substring(a + 4, l - 2);
          i = this.saveTextToParentTag(i, t, this.readonlyMatcher), t.add(r.commentPropName, [{ [r.textNodeName]: d }]);
        }
        a = l;
      } else if (u === 33 && n.charCodeAt(a + 2) === 68) {
        if (this.doctypefound) throw new Error("Multiple DOCTYPE declarations found.");
        this.doctypefound = !0;
        const l = s.readDocType(n, a);
        this.entityDecoder.addInputEntities(l.entities), a = l.i;
      } else if (u === 33 && n.charCodeAt(a + 2) === 91) {
        const l = V(n, "]]>", a, "CDATA is not closed.") - 2, d = n.substring(a + 9, l);
        i = this.saveTextToParentTag(i, t, this.readonlyMatcher);
        let h = this.parseTextData(d, t.tagname, this.readonlyMatcher, !0, !1, !0, !0);
        h == null && (h = ""), r.cdataPropName ? t.add(r.cdataPropName, [{ [r.textNodeName]: d }]) : t.add(r.textNodeName, h), a = l + 2;
      } else {
        let l = he(n, a, r.removeNSPrefix);
        if (!l) {
          const N = n.substring(Math.max(0, a - 50), Math.min(o, a + 50));
          throw new Error(`readTagExp returned undefined at position ${a}. Context: "${N}"`);
        }
        let d = l.tagName;
        const h = l.rawTagName;
        let f = l.tagExp, g = l.attrExpPresent, m = l.closeIndex;
        if ({ tagName: d, tagExp: f } = re(r.transformTagName, d, f, r), r.strictReservedNames && (d === r.commentPropName || d === r.cdataPropName || d === r.textNodeName || d === r.attributesGroupName))
          throw new Error(`Invalid tag name: ${d}`);
        t && i && t.tagname !== "!xml" && (i = this.saveTextToParentTag(i, t, this.readonlyMatcher, !1));
        const y = t;
        y && r.unpairedTagsSet.has(y.tagname) && (t = this.tagsNodeStack.pop(), this.matcher.pop());
        let b = !1;
        f.length > 0 && f.lastIndexOf("/") === f.length - 1 && (b = !0, d[d.length - 1] === "/" ? (d = d.substr(0, d.length - 1), f = d) : f = f.substr(0, f.length - 1), g = d !== f);
        let p = null, E;
        E = vn(h), d !== e.tagname && this.matcher.push(d, {}, E), d !== f && g && (p = this.buildAttributesMap(f, this.matcher, d), p && Ln(p, r)), d !== e.tagname && (this.isCurrentNodeStopNode = this.isItStopNode());
        const x = a;
        if (this.isCurrentNodeStopNode) {
          let N = "";
          if (b)
            a = l.closeIndex;
          else if (r.unpairedTagsSet.has(d))
            a = l.closeIndex;
          else {
            const O = this.readStopNodeData(n, h, m + 1);
            if (!O) throw new Error(`Unexpected end of ${h}`);
            a = O.i, N = O.tagContent;
          }
          const L = new M(d);
          p && (L[":@"] = p), L.add(r.textNodeName, N), this.matcher.pop(), this.isCurrentNodeStopNode = !1, this.addChild(t, L, this.readonlyMatcher, x), r.captureMetaData && t.addEndIndex(a + 1);
        } else {
          if (b) {
            ({ tagName: d, tagExp: f } = re(r.transformTagName, d, f, r));
            const N = new M(d);
            p && (N[":@"] = p), this.addChild(t, N, this.readonlyMatcher, x), r.captureMetaData && t.addEndIndex(m + 1), this.matcher.pop(), this.isCurrentNodeStopNode = !1;
          } else if (r.unpairedTagsSet.has(d)) {
            const N = new M(d);
            p && (N[":@"] = p), this.addChild(t, N, this.readonlyMatcher, x), r.captureMetaData && t.addEndIndex(l.closeIndex + 1), this.matcher.pop(), this.isCurrentNodeStopNode = !1, a = l.closeIndex;
            continue;
          } else {
            const N = new M(d);
            if (this.tagsNodeStack.length > r.maxNestedTags)
              throw new Error("Maximum nested tags exceeded");
            this.tagsNodeStack.push(t), p && (N[":@"] = p), this.addChild(t, N, this.readonlyMatcher, x), t = N;
          }
          i = "", a = m;
        }
      }
    } else
      i += n[a];
  return e.child;
};
function Bn(n, e, t, i) {
  this.options.captureMetaData || (i = void 0);
  const r = this.options.jPath ? t.toString() : t, s = this.options.updateTag(e.tagname, r, e[":@"]);
  s === !1 || (typeof s == "string" && (e.tagname = s), n.addChild(e, i));
}
function Vn(n, e, t) {
  const i = this.options.processEntities;
  if (!i || !i.enabled)
    return n;
  if (i.allowedTags) {
    const r = this.options.jPath ? t.toString() : t;
    if (!(Array.isArray(i.allowedTags) ? i.allowedTags.includes(e) : i.allowedTags(e, r)))
      return n;
  }
  if (i.tagFilter) {
    const r = this.options.jPath ? t.toString() : t;
    if (!i.tagFilter(e, r))
      return n;
  }
  return this.entityDecoder.decode(n);
}
function Un(n, e, t, i) {
  return n && (i === void 0 && (i = e.child.length === 0), n = this.parseTextData(
    n,
    e.tagname,
    t,
    !1,
    e[":@"] ? Object.keys(e[":@"]).length !== 0 : !1,
    i
  ), n !== void 0 && n !== "" && e.add(this.options.textNodeName, n), n = ""), n;
}
function Wn() {
  return this.stopNodeExpressionsSet.size === 0 ? !1 : this.matcher.matchesAny(this.stopNodeExpressionsSet);
}
function qn(n, e, t = ">") {
  let i = 0;
  const r = n.length, s = t.charCodeAt(0), o = t.length > 1 ? t.charCodeAt(1) : -1;
  let a = "", c = e;
  for (let u = e; u < r; u++) {
    const l = n.charCodeAt(u);
    if (i)
      l === i && (i = 0);
    else if (l === 34 || l === 39)
      i = l;
    else if (l === s)
      if (o !== -1) {
        if (n.charCodeAt(u + 1) === o)
          return a += n.substring(c, u), { data: a, index: u };
      } else
        return a += n.substring(c, u), { data: a, index: u };
    else l === 9 && !i && (a += n.substring(c, u) + " ", c = u + 1);
  }
}
function V(n, e, t, i) {
  const r = n.indexOf(e, t);
  if (r === -1)
    throw new Error(i);
  return r + e.length - 1;
}
function Gn(n, e, t, i) {
  const r = n.indexOf(e, t);
  if (r === -1) throw new Error(i);
  return r;
}
function he(n, e, t, i = ">") {
  const r = qn(n, e + 1, i);
  if (!r) return;
  let s = r.data;
  const o = r.index, a = s.search(/\s/);
  let c = s, u = !0;
  a !== -1 && (c = s.substring(0, a), s = s.substring(a + 1).trimStart());
  const l = c;
  if (t) {
    const d = c.indexOf(":");
    d !== -1 && (c = c.substr(d + 1), u = c !== r.data.substr(d + 1));
  }
  return {
    tagName: c,
    tagExp: s,
    closeIndex: o,
    attrExpPresent: u,
    rawTagName: l
  };
}
function Xn(n, e, t) {
  const i = t;
  let r = 1;
  const s = n.length;
  for (; t < s; t++)
    if (n[t] === "<") {
      const o = n.charCodeAt(t + 1);
      if (o === 47) {
        const a = Gn(n, ">", t, `${e} is not closed`);
        if (n.substring(t + 2, a).trim() === e && (r--, r === 0))
          return {
            tagContent: n.substring(i, t),
            i: a
          };
        t = a;
      } else if (o === 63)
        t = V(n, "?>", t + 1, "StopNode is not closed.");
      else if (o === 33 && n.charCodeAt(t + 2) === 45 && n.charCodeAt(t + 3) === 45)
        t = V(n, "-->", t + 3, "StopNode is not closed.");
      else if (o === 33 && n.charCodeAt(t + 2) === 91)
        t = V(n, "]]>", t, "StopNode is not closed.") - 2;
      else {
        const a = he(n, t, !1);
        a && ((a && a.tagName) === e && a.tagExp[a.tagExp.length - 1] !== "/" && r++, t = a.closeIndex);
      }
    }
}
function pe(n, e, t) {
  if (e && typeof n == "string") {
    const i = n.trim();
    return i === "true" ? !0 : i === "false" ? !1 : un(n, t);
  } else
    return _t(n) ? n : "";
}
function re(n, e, t, i) {
  if (n) {
    const r = n(e);
    t === e && (t = r), e = r;
  }
  return e = at(e, i), { tagName: e, tagExp: t };
}
function at(n, e) {
  if (ze.includes(n))
    throw new Error(`[SECURITY] Invalid name: "${n}" is a reserved JavaScript keyword that could cause prototype pollution`);
  return Ee.includes(n) ? e.onDangerousProperty(n) : n;
}
const ie = M.getMetaDataSymbol();
function Hn(n, e) {
  if (!n || typeof n != "object") return {};
  if (!e) return n;
  const t = {};
  for (const i in n)
    if (i.startsWith(e)) {
      const r = i.substring(e.length);
      t[r] = n[i];
    } else
      t[i] = n[i];
  return t;
}
function zn(n, e, t, i) {
  return ct(n, e, t, i);
}
function ct(n, e, t, i) {
  let r;
  const s = {};
  for (let o = 0; o < n.length; o++) {
    const a = n[o], c = Yn(a);
    if (c !== void 0 && c !== e.textNodeName) {
      const u = Hn(
        a[":@"] || {},
        e.attributeNamePrefix
      );
      t.push(c, u);
    }
    if (c === e.textNodeName)
      r === void 0 ? r = a[c] : r += "" + a[c];
    else {
      if (c === void 0)
        continue;
      if (a[c]) {
        let u = ct(a[c], e, t, i);
        const l = Zn(u, e);
        if (Object.keys(u).length === 0 && e.alwaysCreateTextNode && (u[e.textNodeName] = ""), a[":@"] ? Jn(u, a[":@"], i, e) : Object.keys(u).length === 1 && u[e.textNodeName] !== void 0 && !e.alwaysCreateTextNode ? u = u[e.textNodeName] : Object.keys(u).length === 0 && (e.alwaysCreateTextNode ? u[e.textNodeName] = "" : u = ""), a[ie] !== void 0 && typeof u == "object" && u !== null && (u[ie] = a[ie]), s[c] !== void 0 && Object.prototype.hasOwnProperty.call(s, c))
          Array.isArray(s[c]) || (s[c] = [s[c]]), s[c].push(u);
        else {
          const d = e.jPath ? i.toString() : i;
          e.isArray(c, d, l) ? s[c] = [u] : s[c] = u;
        }
        c !== void 0 && c !== e.textNodeName && t.pop();
      }
    }
  }
  return typeof r == "string" ? r.length > 0 && (s[e.textNodeName] = r) : r !== void 0 && (s[e.textNodeName] = r), s;
}
function Yn(n) {
  const e = Object.keys(n);
  for (let t = 0; t < e.length; t++) {
    const i = e[t];
    if (i !== ":@") return i;
  }
}
function Jn(n, e, t, i) {
  if (e) {
    const r = Object.keys(e), s = r.length;
    for (let o = 0; o < s; o++) {
      const a = r[o], c = a.startsWith(i.attributeNamePrefix) ? a.substring(i.attributeNamePrefix.length) : a, u = i.jPath ? t.toString() + "." + c : t;
      i.isArray(a, u, !0, !0) ? n[a] = [e[a]] : n[a] = e[a];
    }
  }
}
function Zn(n, e) {
  const { textNodeName: t } = e, i = Object.keys(n).length;
  return !!(i === 0 || i === 1 && (n[t] || typeof n[t] == "boolean" || n[t] === 0));
}
class Dn {
  constructor(e) {
    this.externalEntities = {}, this.options = Ht(e);
  }
  /**
   * Parse XML dats to JS object 
   * @param {string|Uint8Array} xmlData 
   * @param {boolean|Object} validationOption 
   */
  parse(e, t) {
    if (typeof e != "string" && e.toString)
      e = e.toString();
    else if (typeof e != "string")
      throw new Error("XML data is accepted in String or Bytes[] form.");
    if (t) {
      t === !0 && (t = {});
      const s = Ye(e, t);
      if (s !== !0)
        throw Error(`${s.err.msg}:${s.err.line}:${s.err.col}`);
    }
    const i = new Mn(this.options, this.externalEntities), r = i.parseXml(e);
    return this.options.preserveOrder || r === void 0 ? r : zn(r, this.options, i.matcher, i.readonlyMatcher);
  }
  /**
   * Add Entity which is not by default supported by this library
   * @param {string} key 
   * @param {string} value 
   */
  addEntity(e, t) {
    if (t.indexOf("&") !== -1)
      throw new Error("Entity value can't have '&'");
    if (e.indexOf("&") !== -1 || e.indexOf(";") !== -1)
      throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
    if (t === "&")
      throw new Error("An entity with value '&' is not permitted");
    this.externalEntities[e] = t;
  }
  /**
   * Returns a Symbol that can be used to access the metadata
   * property on a node.
   * 
   * If Symbol is not available in the environment, an ordinary property is used
   * and the name of the property is here returned.
   * 
   * The XMLMetaData property is only present when `captureMetaData`
   * is true in the options.
   */
  static getMetaDataSymbol() {
    return M.getMetaDataSymbol();
  }
}
const Kn = {
  validate: Ye
};
function Ir(n) {
  return n;
}
class lt extends Error {
  fileName;
  line;
  column;
  code;
  constructor(e, t = {}) {
    const i = t.fileName ? `${t.fileName}:${t.line ?? 1}:${t.column ?? 1}: ` : "";
    super(`${i}${e}`), this.name = "MarkupCompileError", this.fileName = t.fileName, this.line = t.line ?? 1, this.column = t.column ?? 1, this.code = t.code ?? "MARKUP_ERROR";
  }
}
const Qn = new Dn({
  ignoreAttributes: !1,
  attributeNamePrefix: "",
  preserveOrder: !0,
  processEntities: !0,
  trimValues: !1
}), ut = /* @__PURE__ */ new WeakMap(), Y = /* @__PURE__ */ new Set([
  "alignContent",
  "alignItems",
  "alignSelf",
  "aspectRatio",
  "borderBottomWidth",
  "borderEndWidth",
  "borderLeftWidth",
  "borderRightWidth",
  "borderStartWidth",
  "borderTopWidth",
  "borderWidth",
  "borderInlineWidth",
  "borderBlockWidth",
  "bottom",
  "left",
  "right",
  "top",
  "end",
  "start",
  "boxSizing",
  "direction",
  "display",
  "flex",
  "flexBasis",
  "flexDirection",
  "rowGap",
  "gap",
  "columnGap",
  "flexGrow",
  "flexShrink",
  "flexWrap",
  "justifyContent",
  "margin",
  "marginBottom",
  "marginEnd",
  "marginLeft",
  "marginRight",
  "marginStart",
  "marginTop",
  "marginInline",
  "marginBlock",
  "width",
  "height",
  "maxHeight",
  "maxWidth",
  "minHeight",
  "minWidth",
  "overflow",
  "padding",
  "paddingBottom",
  "paddingEnd",
  "paddingLeft",
  "paddingRight",
  "paddingStart",
  "paddingTop",
  "paddingInline",
  "paddingBlock",
  "insetInline",
  "insetBlock",
  "inset",
  "position",
  "borderRadius",
  "backgroundColor",
  "borderColor",
  "transformOrigin",
  "objectFit",
  "objectPosition",
  "applySizeDirectly",
  "isLeaf",
  "debug",
  "debugHeat",
  "debugDrawMargin",
  "debugDrawPadding",
  "debugDrawBorder",
  "debugDrawFlex",
  "debugDrawContent"
]), er = {
  backgroundColor: "color",
  borderColor: "color",
  applySizeDirectly: "boolean",
  isLeaf: "boolean",
  debug: "boolean",
  debugHeat: "boolean",
  debugDrawMargin: "boolean",
  debugDrawPadding: "boolean",
  debugDrawBorder: "boolean",
  debugDrawFlex: "boolean",
  debugDrawContent: "boolean"
}, je = /* @__PURE__ */ new Set([
  "LayoutSprite",
  "LayoutNineSliceSprite",
  "LayoutTilingSprite",
  "LayoutAnimatedSprite",
  "LayoutGraphics",
  "LayoutText",
  "LayoutBitmapText",
  "LayoutHTMLText",
  "LayoutMesh",
  "LayoutPerspectiveMesh",
  "LayoutMeshPlane",
  "LayoutMeshRope",
  "LayoutMeshSimple",
  "LayoutGifSprite",
  "Sprite",
  "NineSliceSprite",
  "TilingSprite",
  "AnimatedSprite",
  "Graphics",
  "Text",
  "BitmapText",
  "HTMLText",
  "Mesh",
  "PerspectiveMesh",
  "MeshPlane",
  "MeshRope",
  "MeshSimple",
  "GifSprite"
]), tr = /* @__PURE__ */ new Set([
  "backgroundColor",
  "borderColor",
  "borderRadius",
  "overflow"
]), nr = /* @__PURE__ */ new Set(["objectFit", "objectPosition"]), Be = {
  label: "string",
  alpha: "number",
  angle: "number",
  rotation: "number",
  visible: "boolean",
  renderable: "boolean",
  zIndex: "number",
  sortableChildren: "boolean",
  cullable: "boolean",
  interactiveChildren: "boolean",
  eventMode: "string",
  cursor: "string",
  tint: "color",
  blendMode: "string",
  roundPixels: "boolean"
}, Ne = {
  align: "string",
  breakWords: "boolean",
  dropShadow: "boolean",
  fill: "color",
  fontFamily: "string",
  fontSize: "number|string",
  fontStyle: "string",
  fontVariant: "string",
  fontWeight: "string",
  leading: "number",
  letterSpacing: "number",
  lineHeight: "number",
  padding: "number",
  textBaseline: "string",
  trim: "boolean",
  whiteSpace: "string",
  wordWrap: "boolean",
  wordWrapWidth: "number"
}, rr = /* @__PURE__ */ new Set([
  "Text",
  "BitmapText",
  "HTMLText",
  "LayoutText",
  "LayoutBitmapText",
  "LayoutHTMLText"
]), ir = /* @__PURE__ */ new Set([
  "Text",
  "BitmapText",
  "HTMLText",
  "Sprite",
  "NineSliceSprite",
  "TilingSprite",
  "AnimatedSprite",
  "LayoutText",
  "LayoutBitmapText",
  "LayoutHTMLText",
  "LayoutSprite",
  "LayoutNineSliceSprite",
  "LayoutTilingSprite",
  "LayoutAnimatedSprite"
]);
function sr(n) {
  if (!n) return !1;
  const e = n.lastIndexOf(":");
  return rr.has(e >= 0 ? n.slice(e + 1) : n);
}
function we(n) {
  if (!n) return !1;
  const e = n.lastIndexOf(":");
  return ir.has(e >= 0 ? n.slice(e + 1) : n);
}
function Te(n, e) {
  if (!sr(e)) return null;
  const t = n.startsWith("style.") ? n.slice(6) : n;
  return Ne[t] ? t : null;
}
const Ae = /* @__PURE__ */ new Set([
  "LayoutContainer",
  "LayoutView",
  "LayoutSprite",
  "LayoutNineSliceSprite",
  "LayoutTilingSprite",
  "LayoutAnimatedSprite",
  "LayoutGraphics",
  "LayoutText",
  "LayoutBitmapText",
  "LayoutHTMLText",
  "LayoutMesh",
  "LayoutPerspectiveMesh",
  "LayoutMeshPlane",
  "LayoutMeshRope",
  "LayoutMeshSimple",
  "LayoutGifSprite",
  "Sprite",
  "NineSliceSprite",
  "TilingSprite",
  "AnimatedSprite",
  "Graphics",
  "Text",
  "BitmapText",
  "HTMLText",
  "Mesh",
  "PerspectiveMesh",
  "MeshPlane",
  "MeshRope",
  "MeshSimple",
  "GifSprite"
]), dt = /* @__PURE__ */ new Set([
  "Container",
  "Sprite",
  "NineSliceSprite",
  "TilingSprite",
  "AnimatedSprite",
  "Graphics",
  "Text",
  "BitmapText",
  "HTMLText",
  "Mesh",
  "PerspectiveMesh",
  "MeshPlane",
  "MeshRope",
  "MeshSimple",
  "GifSprite"
]), ee = /* @__PURE__ */ new Set([
  "ButtonContainer",
  "FancyButton",
  "Input",
  "CheckBox",
  "Switcher",
  "List",
  "MaskedFrame",
  "ProgressBar",
  "CircularProgressBar",
  "RadioGroup",
  "ScrollBox",
  "Select",
  "Slider",
  "DoubleSlider",
  "Dialog"
]), or = /* @__PURE__ */ new Set([
  "FancyButton",
  "Input",
  "CheckBox",
  "List",
  "MaskedFrame",
  "ProgressBar",
  "CircularProgressBar",
  "RadioGroup",
  "ScrollBox",
  "Select",
  "Slider",
  "DoubleSlider",
  "Dialog"
]), Ce = /* @__PURE__ */ new Set([
  "Rect",
  "RoundRect",
  "Circle",
  "Ellipse",
  "MoveTo",
  "LineTo",
  "BezierCurveTo",
  "QuadraticCurveTo",
  "Arc",
  "ArcTo",
  "ClosePath",
  "ArcToSvg",
  "Star",
  "RegularPoly",
  "FilletRect",
  "ChamferRect",
  "Poly",
  "RoundPoly",
  "RoundShape",
  "Texture",
  "Svg",
  "RotateTransform",
  "ScaleTransform",
  "TranslateTransform",
  "SetTransform",
  "ResetTransform",
  "BeginPath",
  "Fill",
  "Stroke",
  "Cut",
  "Save",
  "Restore"
]), ar = {
  ButtonContainer: ["enabled"],
  FancyButton: ["defaultView", "hoverView", "pressedView", "disabledView", "text", "icon", "padding", "scale", "anchor", "anchorX", "anchorY", "offset", "textOffset", "iconOffset", "defaultTextScale", "defaultIconScale", "defaultTextAnchor", "defaultIconAnchor", "animations", "nineSliceSprite", "contentFittingMode", "ignoreRefitting", "enabled"],
  Input: ["bg", "textStyle", "TextClass", "placeholder", "value", "maxLength", "secure", "align", "padding", "cleanOnFocus", "nineSliceSprite", "addMask"],
  CheckBox: ["style", "text", "TextClass", "checked"],
  List: ["type", "elementsMargin", "children", "padding", "vertPadding", "horPadding", "topPadding", "bottomPadding", "leftPadding", "rightPadding", "items", "maxWidth", "maxHeight"],
  MaskedFrame: ["target", "mask", "borderWidth", "borderColor"],
  ProgressBar: ["bg", "fill", "fillPaddings", "nineSliceSprite", "progress"],
  CircularProgressBar: ["backgroundColor", "fillColor", "lineWidth", "radius", "value", "backgroundAlpha", "fillAlpha", "cap", "progress"],
  ScrollBox: ["width", "height", "background", "type", "radius", "disableDynamicRendering", "disableEasing", "dragTrashHold", "globalScroll", "shiftScroll", "proximityRange", "proximityDebounce", "disableProximityCheck", "elementsMargin", "padding", "vertPadding", "horPadding", "topPadding", "bottomPadding", "leftPadding", "rightPadding", "items", "maxWidth", "maxHeight"],
  Select: ["closedBG", "openBG", "textStyle", "TextClass", "selected", "selectedTextOffset", "items", "scrollBoxOffset", "scrollBoxWidth", "scrollBoxHeight", "scrollBoxRadius", "visibleItems", "scrollBox"],
  Slider: ["bg", "fill", "fillPaddings", "nineSliceSprite", "min", "max", "valueTextStyle", "valueTextClass", "showValue", "valueTextOffset", "slider", "step", "value"],
  DoubleSlider: ["bg", "fill", "fillPaddings", "nineSliceSprite", "min", "max", "valueTextStyle", "valueTextClass", "showValue", "valueTextOffset", "slider1", "slider2", "value1", "value2"],
  Dialog: ["backdrop", "backdropColor", "backdropAlpha", "background", "title", "content", "width", "height", "padding", "buttons", "buttonList", "scrollBox", "animations", "closeOnBackdropClick", "nineSliceSprite"],
  RadioGroup: ["items", "type", "elementsMargin", "selectedItem"],
  Switcher: ["activeView", "enabled"]
}, cr = {
  ButtonContainer: ["onDown", "onUp", "onUpOut", "onOut", "onPress", "onHover"],
  FancyButton: ["onDown", "onUp", "onUpOut", "onOut", "onPress", "onHover"],
  Input: ["onChange", "onEnter"],
  CheckBox: ["onCheck"],
  Slider: ["onUpdate", "onChange"],
  DoubleSlider: ["onUpdate", "onChange"],
  Dialog: ["onSelect", "onClose"],
  Select: ["onSelect"],
  ScrollBox: ["onScroll", "onProximityChange"],
  RadioGroup: ["onChange"],
  Switcher: ["onChange"]
}, lr = {
  Input: ["bg"],
  CheckBox: ["style"],
  Slider: ["slider"],
  Dialog: ["background"]
}, fe = /* @__PURE__ */ new Set([
  "__proto__",
  "constructor",
  "prototype",
  "refs"
]);
function ur(n) {
  return Ae.has(n) || dt.has(n) || ee.has(n);
}
function _e(n) {
  return Ae.has(n) || or.has(n);
}
function $e(n, e = {}) {
  const t = Kn.validate(n);
  if (t !== !0)
    throw new lt(t.err.msg, {
      fileName: e.fileName,
      line: t.err.line,
      column: t.err.col,
      code: "INVALID_XML"
    });
  let i;
  try {
    i = Qn.parse(n);
  } catch (o) {
    throw w(n, o instanceof Error ? o.message : String(o), e);
  }
  const r = i.find((o) => be(o) !== null);
  if (!r)
    throw w(n, "XML markup does not contain a root element.", e);
  const s = xt(r);
  if (ut.set(s, dr(s, n, e)), s.tagName !== "LayoutContainer" && s.tagName !== "Container")
    throw w(
      n,
      "The UI root component must be LayoutContainer or Container.",
      e,
      s.tagName,
      "INVALID_ROOT"
    );
  return Ar(s), Tr(s, n, e), s;
}
function dr(n, e, t) {
  const i = {};
  for (const [s, o] of Object.entries(n.attributes)) {
    if (s === "xmlns")
      throw w(
        e,
        'The default XML namespace is not supported. Use a named namespace such as xmlns:ui="./ui".',
        t,
        s,
        "DEFAULT_NAMESPACE_NOT_SUPPORTED"
      );
    if (!s.startsWith("xmlns:")) continue;
    const a = s.slice(6);
    if (!/^[A-Za-z_$][\w$.-]*$/.test(a) || a === "xml" || a === "xmlns")
      throw w(e, `Invalid XML namespace prefix: ${a}`, t, s, "INVALID_NAMESPACE_PREFIX");
    if (!o.trim())
      throw w(e, `XML namespace ${a} requires a source.`, t, s, "INVALID_NAMESPACE_SOURCE");
    if (o.includes("\\"))
      throw w(
        e,
        `XML namespace ${a} must use forward slashes.`,
        t,
        s,
        "INVALID_NAMESPACE_SOURCE"
      );
    i[a] = o.trim(), delete n.attributes[s];
  }
  const r = (s) => {
    for (const o of s.children) {
      const a = Object.keys(o.attributes).find(
        (c) => c === "xmlns" || c.startsWith("xmlns:")
      );
      if (a)
        throw w(
          e,
          "XML namespaces must be declared on the root element.",
          t,
          a,
          "NESTED_NAMESPACE_NOT_SUPPORTED"
        );
      r(o);
    }
  };
  return r(n), i;
}
function ht(n, e, t) {
  const i = ut.get(n) ?? {}, r = {};
  for (const [s, o] of Object.entries(i))
    if (o.startsWith("./") || o.startsWith("../")) {
      const a = U(v(t.fileName ?? "markup.xml"));
      r[s] = { directory: v(a, o) };
    } else {
      if (xe(o))
        throw w(
          e,
          `XML namespace ${s} cannot use an absolute path.`,
          t,
          `xmlns:${s}`,
          "INVALID_NAMESPACE_SOURCE"
        );
      r[s] = { module: o, importMode: "named" };
    }
  return {
    ...t,
    namespaces: { ...t.namespaces, ...r }
  };
}
function Or(n, e = {}) {
  const t = $e(n, e), i = ht(t, n, e);
  mr(t, n, i), fr(t, n, i);
  const r = i.components ?? {}, s = /* @__PURE__ */ new Set(), o = (p) => {
    if (p.tagName === "Object") {
      for (const E of p.children) for (const x of E.children) o(x);
      return;
    }
    if (p.tagName === "Array") {
      for (const E of p.children) o(E);
      return;
    }
    p.tagName !== "Value" && (s.add(p.tagName), a(p));
  }, a = (p) => {
    for (const E of p.children)
      if (j(p, E))
        for (const x of E.children)
          o(x);
      else {
        if (B(p, E))
          continue;
        s.add(E.tagName), a(E);
      }
  };
  a(t);
  const c = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Set([
    "defaultView",
    "hoverView",
    "pressedView",
    "disabledView",
    "icon"
  ]), l = (p, E = !1) => {
    !E && H(p.tagName) && p.children.some((x) => B(p, x)) && p.children.every((x) => B(p, x)) && p.children.every((x) => Object.values(x.attributes).every((N) => !N.includes("{") && !N.startsWith("@asset("))) && c.set(p, `__MarkupGraphicsContext${c.size}`);
    for (const x of p.children) {
      const N = j(p, x);
      if (N || !B(p, x)) {
        const L = E || p.tagName === "FancyButton" && N !== null && u.has(N);
        for (const O of N ? x.children : [x])
          l(O, L);
      }
    }
  };
  l(t);
  const d = pr(t) ? ['import "@pixi/layout";'] : [];
  bt(t) && d.push('import { Assets as __MarkupAssets } from "pixi.js";'), c.size > 0 && d.push('import { GraphicsContext as __MarkupGraphicsContext } from "pixi.js";');
  const h = /* @__PURE__ */ new Map();
  for (const p of s) {
    const E = pt(p, i, !1, n), x = r[p] ?? {}, N = `__Markup${h.size}`;
    h.set(p, N);
    const L = x.export ?? E.exported, O = x.module ?? E.moduleName;
    d.push(`import { ${L} as ${N} } from ${JSON.stringify(O)};`);
  }
  const f = [];
  for (const [p, E] of c)
    f.push(`const ${E} = new __MarkupGraphicsContext();`), Ue(f, E, p.children, "");
  const g = [...d, ...f, "export default function render(target, refs) {"];
  We(g, "target", t.attributes, !1, !1, t.tagName);
  let m = 0;
  const y = (p) => {
    if (p.tagName === "Object") return z(p);
    if (p.tagName === "Array")
      return `[${p.children.map((E) => y(E)).join(", ")}]`;
    if (p.tagName === "Value") {
      if (p.children.length > 0 || p.attributes.value === void 0)
        throw new Error("Value requires a value attribute and cannot contain children.");
      return A(p.attributes.value);
    }
    return b(p);
  }, b = (p) => {
    const E = /* @__PURE__ */ new Map(), x = [];
    for (const R of p.children) {
      const J = j(p, R);
      if (!J) {
        B(p, R) || x.push(R);
        continue;
      }
      const Z = R.children[0];
      if (!Z) throw new Error(`Property element ${R.tagName} requires one child component.`);
      E.set(J, y(Z));
    }
    p.tagName === "LayoutView" && x.length === 1 && (E.set("slot", b(x[0])), x.length = 0);
    const N = `node${m++}`, L = r[p.tagName] ?? {}, O = h.get(p.tagName);
    if (!O) throw new Error(`Missing component import: ${p.tagName}`);
    const te = c.get(p), Et = te ? `{ context: ${te} }` : wr(p, L, E);
    g.push(`  const ${N} = new ${O}(${Et});`), We(g, N, p.attributes, !0, _e(p.tagName), p.tagName), H(p.tagName) && !te && Ue(g, N, p.children);
    for (const R of x) {
      const J = b(R), Z = p.tagName === "ScrollBox" ? "addItem" : "addChild";
      g.push(`  ${N}.${Z}(${J});`);
    }
    return N;
  };
  for (const p of t.children) {
    const E = b(p);
    g.push(`  target.addChild(${E});`);
  }
  return g.push("}"), g.join(`
`);
}
function Lr(n, e) {
  const t = S.createSourceFile(
    "MarkupContainer.ts",
    n,
    S.ScriptTarget.Latest,
    !0,
    S.ScriptKind.TS
  ), i = [], r = [], s = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
  for (const u of t.statements) {
    if (!S.isImportDeclaration(u)) continue;
    const l = u.importClause;
    if (!l || l.isTypeOnly) continue;
    l.name && a.add(l.name.text);
    const d = l.namedBindings;
    if (d && S.isNamespaceImport(d) && a.add(d.name.text), d && S.isNamedImports(d))
      for (const h of d.elements)
        h.isTypeOnly || a.add(h.name.text);
  }
  for (const u of t.statements) {
    if (!S.isImportDeclaration(u) || u.moduleSpecifier.getText(t).replace(/["']/g, "") !== "pixi-layout-markup") continue;
    const l = u.importClause?.namedBindings;
    if (l && S.isNamespaceImport(l) && o.add(l.name.text), l && S.isNamedImports(l))
      for (const d of l.elements) {
        const h = d.propertyName?.text ?? d.name.text;
        h === "MarkupContainer" && s.set(d.name.text, "Container"), h === "MarkupLayoutContainer" && s.set(d.name.text, "LayoutContainer");
      }
  }
  for (const u of t.statements) {
    if (!S.isClassDeclaration(u) || !u.name) continue;
    let l;
    for (const y of u.heritageClauses ?? [])
      if (y.token === S.SyntaxKind.ExtendsKeyword)
        for (const { expression: b } of y.types)
          S.isIdentifier(b) ? l = s.get(b.text) : S.isPropertyAccessExpression(b) && S.isIdentifier(b.expression) && o.has(b.expression.text) && (b.name.text === "MarkupContainer" && (l = "Container"), b.name.text === "MarkupLayoutContainer" && (l = "LayoutContainer"));
    if (!l) continue;
    const d = u.name.text;
    let h = [];
    if (e) {
      const y = v(U(e), `${d}.xml`);
      if (!ae(y)) throw new Error(`${d} requires matching markup file: ${y}`);
      const b = $e(qe(y, "utf8"), { fileName: y }), p = b.tagName;
      if (p !== l)
        throw new Error(`${d} extends ${l === "Container" ? "MarkupContainer" : "MarkupLayoutContainer"} but ${d}.xml uses <${p}>; expected <${l}>.`);
      const E = new Set(u.members.flatMap((x) => x.name && S.isIdentifier(x.name) ? [x.name.text] : []));
      h = [...hr(b)].filter((x) => a.has(x) && !E.has(x));
    }
    const f = `__${d}MarkupTemplate`;
    i.push(`import ${f} from './${d}.xml';`);
    const g = u.members.find(S.isConstructorDeclaration), m = g?.body?.statements.find(
      (y) => S.isExpressionStatement(y) && S.isCallExpression(y.expression) && y.expression.expression.kind === S.SyntaxKind.SuperKeyword
    );
    if (m && S.isCallExpression(m.expression)) {
      const y = m.expression.arguments.map((p) => p.getText(t)).join(", "), b = h.map((p) => `(this as any)[${JSON.stringify(p)}] = ${p}; `).join("");
      r.push({
        start: m.expression.getStart(t),
        end: m.expression.getEnd(),
        text: `super(${y}); ${b}this.applyMarkup(${f})`
      });
    } else if (!g)
      r.push({
        start: u.members.pos,
        end: u.members.pos,
        text: `
  public constructor() { super(); ${h.map((y) => `(this as any)[${JSON.stringify(y)}] = ${y}; `).join("")}this.applyMarkup(${f}); }`
      });
    else
      throw new Error(`${d} constructor must call super() for markup injection.`);
  }
  if (i.length === 0) return null;
  let c = n;
  for (const u of r.sort((l, d) => d.start - l.start))
    c = c.slice(0, u.start) + u.text + c.slice(u.end);
  return `${i.join(`
`)}
${c}`;
}
function hr(n) {
  const e = /* @__PURE__ */ new Set(), t = (i) => {
    for (const r of Object.values(i.attributes)) {
      const s = r.match(/^\{([A-Za-z_$][\w$]*)(?:\.[A-Za-z_$][\w$]*)*\}$/);
      s && e.add(s[1]);
    }
    for (const r of i.children) t(r);
  };
  return t(n), e;
}
function pr(n) {
  let e = n.tagName === "LayoutContainer";
  const t = (i) => {
    if (!e) {
      if (i.tagName.startsWith("Layout") || Object.keys(i.attributes).some((r) => r === "layout" || r === "prop.layout" || r.startsWith("layout.") || Y.has(r))) {
        e = !0;
        return;
      }
      for (const r of i.children) t(r);
    }
  };
  return t(n), e;
}
function vr(n, e, t = {}) {
  const i = $e(n, t), r = ht(i, n, t), s = r.components ?? {}, o = [], a = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Set(), u = (g) => {
    const m = mt(g);
    if (m) {
      if (a.has(m)) throw new Error(`Duplicate UI reference: ${m}`);
      a.add(m), o.push({ name: m, tagName: g.tagName });
    }
    for (const y of Object.values(g.attributes)) {
      const b = y.match(/^\{([A-Za-z_$][\w$]*)/);
      b && c.add(b[1]);
    }
    for (const y of g.children) u(y);
  };
  u(i);
  const l = /* @__PURE__ */ new Map(), d = [];
  for (const { tagName: g } of o) {
    if (l.has(g)) continue;
    const m = s[g] ?? {}, y = pt(g, r, !0, n), b = m.export ?? y.exported, p = m.module ?? y.moduleName, E = `__MarkupRef${l.size}`;
    l.set(g, E), d.push(`import type { ${b} as ${E} } from ${JSON.stringify(p)};`);
  }
  const h = o.map(
    ({ name: g, tagName: m }) => `    readonly ${JSON.stringify(g)}: ${l.get(m)};`
  ), f = [...c].map(
    (g) => `    ${JSON.stringify(g)}: any;`
  );
  return [
    ...d,
    `declare module ${JSON.stringify(Nr(e, r))} {`,
    `  interface ${e}Refs {`,
    ...h,
    "  }",
    `  interface ${e}Bindings {`,
    ...f,
    "  }",
    `  interface ${e} extends ${e}Refs, ${e}Bindings {}`,
    "}",
    "export {};",
    ""
  ].join(`
`);
}
function pt(n, e, t = !1, i = "") {
  const r = e.components?.[n], s = n.indexOf(":"), o = s >= 0 ? n.slice(0, s) : null, a = s >= 0 ? n.slice(s + 1) : n, c = o ? e.namespaces?.[o] : void 0, u = typeof c == "string" ? { module: c } : c;
  if (r?.module)
    return { exported: r.export ?? a, moduleName: r.module };
  if (u?.module)
    return {
      exported: a,
      moduleName: u.importMode === "named" ? u.module : `${u.module.replace(/\/$/, "")}/${a}`
    };
  const l = U(e.fileName ?? "."), d = U(e.declarationFileName ?? e.fileName ?? "."), h = t ? d : l, f = u?.directory ? [u.directory] : o ? [] : e.componentDirs ?? [];
  for (const m of f) {
    const y = xe(m) ? m : v(e.rootDir ?? process.cwd(), m), b = Sr(y, a);
    if (b)
      return { exported: a, moduleName: me(h, b) };
  }
  if (o)
    throw w(i, `Unknown XML namespace: ${o}`, e, n, "UNKNOWN_NAMESPACE");
  if (dt.has(a)) return { exported: a, moduleName: "pixi.js" };
  if (ee.has(a)) return { exported: a, moduleName: "@pixi/ui" };
  if (Ae.has(a))
    return { exported: a, moduleName: "@pixi/layout/components" };
  const g = v(l, a);
  return {
    exported: a,
    moduleName: t ? me(d, g) : `./${a}`
  };
}
function fr(n, e, t) {
  const i = (r) => {
    const s = t.componentMetadata?.[r.tagName] ?? gr(r.tagName) ?? br(r.tagName, t);
    for (const o of lr[r.tagName] ?? []) {
      const a = r.attributes[o] !== void 0 || r.attributes[`prop.${o}`] !== void 0, c = r.children.some((u) => j(r, u) === o);
      if (!a && !c)
        throw w(e, `${r.tagName} requires constructor property ${o}. Use prop.${o} or <${r.tagName}.${o}>.`, t, r.tagName, "MISSING_CONSTRUCTOR_PROPERTY");
    }
    if (s?.allowChildren === !1 && r.children.length > 0)
      throw w(
        e,
        `${r.tagName} does not allow child elements.`,
        t,
        r.tagName,
        "CHILDREN_NOT_ALLOWED"
      );
    for (const [o, a] of Object.entries(r.attributes)) {
      if (o === "ref")
        throw w(
          e,
          "The XML ref attribute has been removed. Use id instead.",
          t,
          o,
          "REMOVED_REF_ATTRIBUTE"
        );
      if (o === "id" || o === "style" || o === "if" || o === "layout" || o === "prop.layout") continue;
      if (o === "anchor" && we(r.tagName)) {
        xr(a, e, t);
        continue;
      }
      const c = Te(o, r.tagName);
      if (c) {
        se(a, Ne[c], e, t, o);
        continue;
      }
      if (o.startsWith("layout.") || Y.has(o)) {
        const d = o.startsWith("layout.") ? o.slice(7) : o, h = er[d];
        h && se(a, h, e, t, o);
        continue;
      }
      if (o.startsWith("signal.")) {
        const d = o.slice(7);
        if (s?.signals && !s.signals.includes(d)) {
          const h = ge(d, [...s.signals]);
          throw w(
            e,
            `Unknown signal ${d} on ${r.tagName}.${h ? ` Did you mean ${h}?` : ""}`,
            t,
            o,
            "UNKNOWN_SIGNAL"
          );
        }
        continue;
      }
      if (o.startsWith("on")) {
        const d = o.slice(2).toLowerCase();
        if (s?.events && !s.events.some((h) => h.toLowerCase() === d))
          throw w(
            e,
            `Unknown event ${o} on ${r.tagName}.`,
            t,
            o,
            "UNKNOWN_EVENT"
          );
        continue;
      }
      const u = o.startsWith("prop.") ? o.slice(5) : o.startsWith("set.") ? o.slice(4) : o, l = s?.properties?.[u] ?? Be[u];
      if (!l && s?.strict) {
        const d = [
          ...Object.keys(s.properties ?? {}),
          ...Object.keys(Be)
        ], h = ge(u, d);
        throw w(
          e,
          `Unknown property ${u} on ${r.tagName}.${h ? ` Did you mean ${h}?` : ""}`,
          t,
          o,
          "UNKNOWN_PROPERTY"
        );
      }
      if (l) {
        const d = typeof l == "string" ? l : l.type ?? "any";
        se(a, d, e, t, o);
      }
    }
    for (const o of r.children) i(o);
  };
  i(n);
}
function gr(n) {
  if (ee.has(n))
    return {
      properties: Object.fromEntries((ar[n] ?? []).map((e) => [e, "any"])),
      signals: cr[n] ?? [],
      strict: !0
    };
}
function mr(n, e, t) {
  const i = (r) => {
    const s = /* @__PURE__ */ new Set();
    for (const o of r.children) {
      const a = j(r, o);
      if (!a) {
        if (B(r, o)) {
          yr(o, e, t);
          continue;
        }
        if (H(r.tagName)) {
          const c = ge(o.tagName, [...Ce]);
          throw w(
            e,
            `Unknown Graphics command ${o.tagName}.${c ? ` Did you mean ${c}?` : ""}`,
            t,
            o.tagName,
            "UNKNOWN_GRAPHICS_COMMAND"
          );
        }
        i(o);
        continue;
      }
      if (!_e(r.tagName) && !t.components?.[r.tagName]?.options)
        throw w(
          e,
          `${r.tagName} does not accept constructor property elements.`,
          t,
          o.tagName,
          "PROPERTY_ELEMENT_NOT_SUPPORTED"
        );
      if (s.has(a))
        throw w(
          e,
          `Duplicate property element ${o.tagName}.`,
          t,
          o.tagName,
          "DUPLICATE_PROPERTY_ELEMENT"
        );
      if (Object.keys(o.attributes).length > 0 || o.children.length !== 1)
        throw w(
          e,
          `${o.tagName} must contain exactly one component and cannot have attributes.`,
          t,
          o.tagName,
          "INVALID_PROPERTY_ELEMENT"
        );
      s.add(a), o.children[0].tagName !== "Object" && i(o.children[0]);
    }
  };
  i(n);
}
function yr(n, e, t) {
  const i = {
    Rect: ["x", "y", "width", "height"],
    RoundRect: ["x", "y", "width", "height", "radius"],
    Circle: ["x", "y", "radius"],
    Ellipse: ["x", "y", "halfWidth", "halfHeight"],
    MoveTo: ["x", "y"],
    LineTo: ["x", "y"],
    BezierCurveTo: ["cp1x", "cp1y", "cp2x", "cp2y", "x", "y"],
    QuadraticCurveTo: ["cpx", "cpy", "x", "y"],
    Arc: ["x", "y", "radius", "startAngle", "endAngle"],
    ArcTo: ["x1", "y1", "x2", "y2", "radius"],
    ArcToSvg: ["rx", "ry", "xAxisRotation", "largeArcFlag", "sweepFlag", "x", "y"],
    Star: ["x", "y", "points", "radius"],
    RegularPoly: ["x", "y", "radius", "sides"],
    FilletRect: ["x", "y", "width", "height", "fillet"],
    ChamferRect: ["x", "y", "width", "height", "chamfer"],
    Poly: ["points"],
    RoundPoly: ["x", "y", "radius", "sides", "corner"],
    RoundShape: ["points", "radius"],
    Texture: ["texture"],
    Svg: ["value"],
    RotateTransform: ["angle"],
    ScaleTransform: ["x", "y"],
    TranslateTransform: ["x", "y"],
    SetTransform: ["a", "b", "c", "d", "dx", "dy"]
  };
  for (const r of i[n.tagName] ?? [])
    if (n.attributes[r] === void 0)
      throw w(
        e,
        `${n.tagName} requires attribute ${r}.`,
        t,
        n.tagName,
        "MISSING_GRAPHICS_ATTRIBUTE"
      );
}
function br(n, e) {
  if (ur(n)) return;
  const t = n.indexOf(":"), i = t >= 0 ? n.slice(0, t) : null, r = t >= 0 ? n.slice(t + 1) : n, s = i ? e.namespaces?.[i] : void 0, o = typeof s == "string" ? { module: s } : s;
  if (o?.module) return;
  const a = o?.directory ? [o.directory] : e.componentDirs ?? [];
  for (const c of a) {
    const u = xe(c) ? c : v(e.rootDir ?? process.cwd(), c), l = ft(u, r);
    if (!l) continue;
    const d = S.createSourceFile(
      l,
      qe(l, "utf8"),
      S.ScriptTarget.Latest,
      !0,
      l.endsWith(".tsx") ? S.ScriptKind.TSX : S.ScriptKind.TS
    ), h = {};
    for (const f of d.statements)
      if (!(!S.isClassDeclaration(f) || f.name?.text !== r))
        for (const g of f.members)
          !g.name || !S.isIdentifier(g.name) || (S.isSetAccessor(g) ? h[g.name.text] = Ve(g.parameters[0]?.type) : (S.isPropertyDeclaration(g) || S.isGetAccessor(g)) && (h[g.name.text] = Ve(g.type)));
    return { properties: h, strict: !0 };
  }
}
function Ve(n) {
  return n ? n.kind === S.SyntaxKind.StringKeyword ? "string" : n.kind === S.SyntaxKind.NumberKeyword ? "number" : n.kind === S.SyntaxKind.BooleanKeyword ? "boolean" : "any" : "any";
}
function se(n, e, t, i, r) {
  if (!(/^\{[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\}$/.test(n) || /^@asset\([^)]+\)$/.test(n) || e === "any" || e === "string" || e === "number" && /^-?\d+(\.\d+)?$/.test(n) || e === "number|string" || e === "boolean" && (n === "true" || n === "false") || e === "color" && /^(#([\da-f]{6}|[\da-f]{8})|0x[\da-f]+|rgba?\(.+\))$/i.test(n)))
    throw w(
      t,
      `Expected ${e} value for ${r}, received ${JSON.stringify(n)}.`,
      i,
      r,
      "INVALID_ATTRIBUTE_VALUE"
    );
}
function xr(n, e, t) {
  const i = /^\{[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\}$/.test(n), r = /^-?\d+(\.\d+)?$/.test(n.trim()), s = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(n);
  if (!(i || r || s))
    throw w(
      e,
      `Expected anchor as a number, x,y pair, or binding; received ${JSON.stringify(n)}.`,
      t,
      "anchor",
      "INVALID_ATTRIBUTE_VALUE"
    );
}
function ge(n, e) {
  let t = null;
  for (const i of e) {
    const r = Er(n, i);
    (!t || r < t.distance) && (t = { value: i, distance: r });
  }
  return t && t.distance <= Math.max(2, Math.floor(n.length / 3)) ? t.value : null;
}
function Er(n, e) {
  const t = Array.from({ length: e.length + 1 }, (i, r) => r);
  for (let i = 1; i <= n.length; i++) {
    let r = t[0];
    t[0] = i;
    for (let s = 1; s <= e.length; s++) {
      const o = t[s];
      t[s] = n[i - 1] === e[s - 1] ? r : Math.min(r, o, t[s - 1]) + 1, r = o;
    }
  }
  return t[e.length];
}
function w(n, e, t = {}, i, r) {
  const s = i ? Math.max(0, n.indexOf(i)) : 0, a = n.slice(0, s).split(/\r?\n/);
  return new lt(e, {
    fileName: t.fileName,
    line: a.length,
    column: (a.at(-1)?.length ?? 0) + 1,
    code: r
  });
}
function Sr(n, e) {
  const t = ft(n, e);
  return t ? t.slice(0, -St(t).length) : null;
}
function ft(n, e) {
  for (const t of [".ts", ".tsx", ".js", ".mjs"]) {
    const i = v(n, `${e}${t}`);
    if (ae(i)) return i;
  }
  for (const t of [".ts", ".tsx", ".js", ".mjs"]) {
    const i = v(n, e, `index${t}`);
    if (ae(i)) return i;
  }
  return null;
}
function me(n, e) {
  let t = Nt(n, e).split(wt).join("/");
  return t.startsWith(".") || (t = `./${t}`), t;
}
function Nr(n, e) {
  if (!e.declarationFileName || !e.fileName) return `./${n}`;
  const t = v(U(e.fileName), n);
  return me(U(e.declarationFileName), t);
}
function wr(n, e, t = /* @__PURE__ */ new Map()) {
  if (e.options) {
    const i = Object.entries(e.options).map(
      ([r, s]) => `${JSON.stringify(r)}: ${oe(n, s)}`
    );
    for (const [r, s] of t) i.push(`${JSON.stringify(r)}: ${s}`);
    return `{ ${i.join(", ")} }`;
  }
  if (!e.arguments) {
    if (!_e(n.tagName)) {
      if (t.size > 0)
        throw new Error(`${n.tagName} does not accept XML property elements in its constructor.`);
      return "";
    }
    const i = Object.entries(n.attributes).filter(([r]) => gt(r, n.tagName)).map(([r]) => {
      const s = r.startsWith("prop.") ? r.slice(5) : r, o = r === "text" ? "resolve" : r.startsWith("on") ? "action" : "evaluate", a = r === "anchor" && we(n.tagName) ? yt(n.attributes[r]) : oe(n, { attribute: r, transform: o });
      return `${JSON.stringify(s)}: ${a}`;
    });
    for (const [r, s] of t) i.push(`${JSON.stringify(r)}: ${s}`);
    return `{ ${i.join(", ")} }`;
  }
  if (t.size > 0)
    throw new Error(`${n.tagName} uses positional constructor arguments and cannot accept XML property elements.`);
  return (e.arguments ?? []).map((i) => oe(n, i)).join(", ");
}
function j(n, e) {
  const t = n.tagName.lastIndexOf(":"), r = `${t >= 0 ? n.tagName.slice(t + 1) : n.tagName}.`;
  return e.tagName.startsWith(r) && e.tagName.slice(r.length) || null;
}
function H(n) {
  const e = n.lastIndexOf(":"), t = e >= 0 ? n.slice(e + 1) : n;
  return t === "Graphics" || t === "LayoutGraphics";
}
function B(n, e) {
  return H(n.tagName) && Ce.has(e.tagName);
}
function z(n) {
  const e = Object.entries(n.attributes).map(([t, i]) => {
    if (fe.has(t)) throw new Error(`Reserved object property name: ${t}`);
    return `${JSON.stringify(t)}: ${A(i)}`;
  });
  for (const t of n.children) {
    const i = t.tagName.lastIndexOf(".");
    if (i < 0) throw new Error(`Object child ${t.tagName} must use Object.property syntax.`);
    const r = t.tagName.slice(i + 1);
    if (!r) throw new Error(`Invalid object property element ${t.tagName}.`);
    if (fe.has(r)) throw new Error(`Reserved object property name: ${r}`);
    let s;
    if (t.children.length === 0)
      s = z({ ...t });
    else if (t.children.length === 1 && t.children[0].tagName === "Object") {
      const o = t.children[0];
      s = z({
        attributes: { ...o.attributes, ...t.attributes },
        children: o.children
      });
    } else
      throw new Error(`${t.tagName} must contain one Object or use attributes as its value.`);
    e.push(`${JSON.stringify(r)}: ${s}`);
  }
  return `{ ${e.join(", ")} }`;
}
function Ue(n, e, t, i = "  ") {
  for (const r of t) {
    if (!Ce.has(r.tagName)) continue;
    const s = r.attributes, o = {
      Rect: ["x", "y", "width", "height"],
      RoundRect: ["x", "y", "width", "height", "radius"],
      Circle: ["x", "y", "radius"],
      Ellipse: ["x", "y", "halfWidth", "halfHeight"],
      MoveTo: ["x", "y"],
      LineTo: ["x", "y"],
      BezierCurveTo: ["cp1x", "cp1y", "cp2x", "cp2y", "x", "y"],
      QuadraticCurveTo: ["cpx", "cpy", "x", "y"],
      Arc: ["x", "y", "radius", "startAngle", "endAngle", "counterclockwise"],
      ArcTo: ["x1", "y1", "x2", "y2", "radius"],
      ArcToSvg: ["rx", "ry", "xAxisRotation", "largeArcFlag", "sweepFlag", "x", "y"],
      Star: ["x", "y", "points", "radius", "innerRadius", "rotation"],
      RegularPoly: ["x", "y", "radius", "sides", "rotation"],
      FilletRect: ["x", "y", "width", "height", "fillet"],
      ChamferRect: ["x", "y", "width", "height", "chamfer"],
      Poly: ["points", "close"],
      RoundPoly: ["x", "y", "radius", "sides", "corner", "rotation"],
      RoundShape: ["points", "radius", "useQuadratic", "smoothness"],
      Texture: ["texture", "tint", "dx", "dy", "dw", "dh"],
      Svg: ["value"],
      RotateTransform: ["angle"],
      ScaleTransform: ["x", "y"],
      TranslateTransform: ["x", "y"],
      SetTransform: ["a", "b", "c", "d", "dx", "dy"]
    };
    if (r.tagName === "Fill") {
      const a = Object.keys(s), c = a.length === 1 && a[0] === "color" ? A(s.color) : z({ ...r });
      n.push(`${i}${e}.fill(${c});`);
    } else if (r.tagName === "Stroke")
      n.push(`${i}${e}.stroke(${z({ ...r })});`);
    else if (["ClosePath", "Cut", "BeginPath", "Save", "Restore", "ResetTransform"].includes(r.tagName)) {
      const a = r.tagName[0].toLowerCase() + r.tagName.slice(1);
      n.push(`${i}${e}.${a}();`);
    } else {
      const a = o[r.tagName];
      if (!a) continue;
      const c = a.filter((l, d) => s[l] !== void 0 || d < a.length - 1).map((l) => A(s[l] ?? "false")), u = r.tagName[0].toLowerCase() + r.tagName.slice(1);
      n.push(`${i}${e}.${u}(${c.join(", ")});`);
    }
  }
}
function gt(n, e) {
  return !(n === "id" || n === "style" || n === "if" || n === "layout" || n === "prop.layout" || Te(n, e) || n.startsWith("on") || n.startsWith("signal.") || n.startsWith("layout.") || n.startsWith("set.") || Y.has(n));
}
function oe(n, e) {
  const t = n.attributes[e.attribute], i = e.default === void 0 ? "undefined" : JSON.stringify(e.default);
  return t === void 0 ? i : (e.transform ?? "evaluate") === "action" ? `this[${JSON.stringify(t)}].bind(this)` : A(t);
}
function We(n, e, t, i, r, s) {
  const o = [];
  let a;
  for (const [c, u] of Object.entries(t)) {
    if (c === "id") {
      if (i) {
        const d = JSON.stringify(u);
        n.push(
          `  refs[${d}] = ${e};`,
          `  target[${d}] = ${e};`
        );
      }
      continue;
    }
    if (c === "layout") {
      a = A(u);
      continue;
    }
    if (c === "anchor" && we(s)) {
      r || n.push(`  ${e}.anchor = ${yt(u)};`);
      continue;
    }
    const l = Te(c, s);
    if (l) {
      n.push(`  ${e}.style[${JSON.stringify(l)}] = ${Cr(u, Ne[l])};`);
      continue;
    }
    if (!(r && gt(c, s))) {
      if (c === "style")
        throw new Error("Named runtime styles are not available in native mode; use prop.style or code-behind.");
      if (c === "if")
        n.push(`  ${e}.visible = Boolean(${A(u)});`);
      else if (c === "text")
        n.push(`  ${e}.text = ${A(u)};`);
      else if (c.startsWith("prop.")) {
        const d = A(u);
        n.push(`  ${e}[${JSON.stringify(c.slice(5))}] = ${d};`);
      } else if (c.startsWith("set."))
        n.push(`  ${e}[${JSON.stringify(c.slice(4))}] = ${A(u)};`);
      else if (c.startsWith("signal.") && c.length > 7) {
        const d = c.slice(7);
        n.push(`  ${e}[${JSON.stringify(d)}].connect(target[${JSON.stringify(u)}].bind(target));`);
      } else if (c.startsWith("on") && c.length > 2) {
        const d = c.slice(2).toLowerCase();
        n.push(`  ${e}.on(${JSON.stringify(d)}, target[${JSON.stringify(u)}], target);`);
      } else c.startsWith("layout.") ? o.push(`${JSON.stringify(c.slice(7))}: ${A(u)}`) : Y.has(c) ? o.push(`${JSON.stringify(c)}: ${A(u)}`) : n.push(`  ${e}[${JSON.stringify(c)}] = ${A(u)};`);
    }
  }
  o.length > 0 ? (s && ee.has(s) && o.some((c) => c.startsWith('"width":') || c.startsWith('"height":')) && !o.some((c) => c.startsWith('"applySizeDirectly":')) && o.push('"applySizeDirectly": true'), a === "true" && (o.some((c) => c.startsWith('"width":')) || o.unshift('"width": "intrinsic"'), o.some((c) => c.startsWith('"height":')) || o.unshift('"height": "intrinsic"')), n.push(`  ${e}.layout = { ${o.join(", ")} };`)) : a !== void 0 && n.push(`  ${e}.layout = ${a};`);
}
function Tr(n, e, t) {
  const i = (r) => {
    const s = r.attributes, o = s.layout, a = Object.keys(s).filter(
      (u) => u.startsWith("layout.") || Y.has(u)
    );
    if (o !== void 0 && !["true", "false", "null"].includes(o))
      throw w(e, "layout must be true, false, or null.", t, "layout", "INVALID_LAYOUT_VALUE");
    if ((o === "false" || o === "null") && a.length > 0)
      throw w(e, `layout="${o}" cannot be combined with layout styles.`, t, "layout", "CONFLICTING_LAYOUT_VALUE");
    if (r.tagName === "LayoutView" && r.children.filter((l) => !j(r, l)).length !== 1)
      throw w(e, "LayoutView requires exactly one child, compiled as its slot.", t, r.tagName, "INVALID_LAYOUT_VIEW_SLOT");
    if (je.has(r.tagName) && !H(r.tagName)) {
      const u = r.children.filter((l) => !j(r, l));
      if (u.length > 0)
        throw w(e, `${r.tagName} is a leaf node and cannot contain display children.`, t, u[0].tagName, "LEAF_CHILD_NOT_ALLOWED");
    }
    const c = je.has(r.tagName) || r.tagName === "LayoutView" || s.isLeaf === "true" || s["layout.isLeaf"] === "true";
    for (const u of a) {
      const l = u.startsWith("layout.") ? u.slice(7) : u;
      if (r.tagName === "Container" && tr.has(l))
        throw w(e, `${l} requires LayoutContainer or LayoutView.`, t, u, "UNSUPPORTED_LAYOUT_STYLE");
      if (nr.has(l) && !c)
        throw w(e, `${l} only applies to leaf nodes.`, t, u, "LEAF_LAYOUT_STYLE_REQUIRED");
    }
    for (const u of r.children) i(u);
  };
  i(n);
}
function Ar(n) {
  const e = /* @__PURE__ */ new Set(), t = (i) => {
    const r = mt(i);
    if (r) {
      if (e.has(r)) throw new Error(`Duplicate UI reference: ${r}`);
      if (fe.has(r))
        throw new Error(`Reserved UI reference name: ${r}`);
      e.add(r);
    }
    for (const s of i.children) t(s);
  };
  t(n);
}
function mt(n) {
  return n.attributes.id;
}
function A(n) {
  const e = n.match(/^@asset\(([^)]+)\)$/);
  if (e) return `__MarkupAssets.get(${JSON.stringify(e[1].trim())})`;
  const t = n.match(/^\{([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\}$/);
  if (t)
    return t[1].split(".").reduce((i, r) => `${i}[${JSON.stringify(r)}]`, "target");
  if (n.includes("{") || n.includes("}"))
    throw new Error(
      `Invalid native binding ${JSON.stringify(n)}. Use a single property path such as {width} or {theme.color}.`
    );
  return /^-?\d+(\.\d+)?$/.test(n) || /^0x[\da-f]+$/i.test(n) || n === "true" || n === "false" || n === "null" ? n : JSON.stringify(ye(n));
}
function ye(n) {
  return n.replace(/\\u\{([\da-fA-F]{1,6})\}/g, (e, t) => {
    const i = Number.parseInt(t, 16);
    return i <= 1114111 ? String.fromCodePoint(i) : e;
  }).replace(/\\u([\da-fA-F]{4})/g, (e, t) => String.fromCharCode(Number.parseInt(t, 16)));
}
function yt(n) {
  if (/^\{[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\}$/.test(n))
    return A(n);
  const e = n.split(",").map((t) => t.trim());
  return e.length === 2 ? `{ x: ${e[0]}, y: ${e[1]} }` : A(n.trim());
}
function Cr(n, e) {
  return /^\{[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\}$/.test(n) || /^@asset\([^)]+\)$/.test(n) ? A(n) : e === "string" || e === "number|string" && !/^-?\d+(\.\d+)?$/.test(n) ? JSON.stringify(ye(n)) : A(n);
}
function bt(n) {
  return Object.values(n.attributes).some((e) => /^@asset\([^)]+\)$/.test(e)) ? !0 : n.children.some(bt);
}
function xt(n) {
  const e = be(n);
  if (!e) throw new Error("Invalid XML element.");
  const t = Array.isArray(n[e]) ? n[e] : [], i = n[":@"] ?? {}, r = Object.fromEntries(
    Object.entries(i).map(([o, a]) => [o, String(a)])
  ), s = t.filter((o) => be(o) !== null).map(xt);
  return { tagName: e, attributes: r, children: s };
}
function be(n) {
  return Object.keys(n).find(
    (e) => e !== ":@" && e !== "#text" && !e.startsWith("?")
  ) ?? null;
}
export {
  lt as MarkupCompileError,
  $e as compileMarkup,
  Lr as compileMarkupClassModule,
  Or as compileMarkupModule,
  vr as compileMarkupRefsDeclaration,
  Ir as defineMarkupComponent
};
//# sourceMappingURL=compiler.js.map
