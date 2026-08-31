# Compiler maintenance

Use this reference when changing this repository rather than only consuming it.

## Locate the behavior

- `src/compiler.ts`: parsing, validation, resolution, code generation, refs, bindings, Graphics, diagnostics.
- `src/core.ts`: public build options and shared generation utilities.
- `src/config.ts`: discovery, TypeScript config loading, paths, merge precedence.
- `src/vite.ts`, `src/rollup.ts`, `src/esbuild.ts`, `src/bun.ts`: bundler integrations.
- `webpack-loader.cjs`, `webpack-transform-loader.cjs`: Webpack/Rspack.
- `src/MarkupContainer.ts`, `src/MarkupLayoutContainer.ts`: runtime base injection.
- `src/cli.ts`: `generate-refs` and flags.
- `test/compiler.test.mjs`: compiler contracts and diagnostics.
- `test/integrations.test.mjs`: integrations and source maps.
- `test/config.test.mjs`, `test/cli.test.mjs`, `test/runtime.test.mjs`: subsystem contracts.
- `examples/markup-gallery`: browser behavior and E2E coverage.

Search with `rg` before editing, preserve unrelated changes, and use `apply_patch` for source edits.

## Generated-code contract

Output direct ESM/native PixiJS code:

- Static component imports.
- Direct constructors, assignments, `addChild`/`addItem`, events, and signals.
- No runtime XML parser, evaluator, or reflection-based binding engine.
- Source maps point construction back to XML tags.
- Static Graphics may share `GraphicsContext`; mutable state views remain independent.

Constructor-only values belong in options. Post-construction properties must not be duplicated there. For a nested shortcut such as TextStyle, test precedence with `prop.style` and do not pass the shortcut as an invalid top-level PixiJS constructor option.

## Validation

Fail early with `MarkupCompileError`, a stable code, filename, and source location. Add typo suggestions for strict known metadata when useful. Treat bindings and assets as deferred during scalar validation.

When adding an attribute:

1. Identify compatible components.
2. Define its type and constructor/property target.
3. Exclude it from incompatible generic paths.
4. Test literals, bindings where supported, invalid values, and precedence.
5. Update public documentation.

Do not broaden an attribute to every component merely because some built-ins are non-strict.

## Namespaces and declarations

- Relative file-local namespaces resolve from the current XML directory and use component subpaths.
- File-local package namespaces use named exports from the package root.
- Configured module namespaces retain configured import mode/subpath behavior.
- File-local declarations override global config.
- Generated paths use `/`, correct casing, and valid relative ESM specifiers.

Whenever runtime resolution changes, test declaration generation too; both paths must resolve the same type.

## Config invariants

Missing auto-discovered config is non-fatal. An explicit missing path fails clearly. A TypeScript config is transpiled to a temporary sibling module, which is removed in `finally`. Explicit options override file config; record options merge by key. Exercise changes through every affected plugin, loader, and CLI entry point.

## Public surface and packaging

For a new entry point, update source exports, Vite library entries, externals when needed, `package.json` exports/types, and package tests. Keep Node-only imports out of browser runtime paths. Run `npm run pack:check` and verify required `.js` and `.d.ts` files.

## Test matrix

- Focused compiler work: `npm run build`, then the relevant Node test.
- Normal repository changes: `npm test`.
- Runtime, loader, event, or example changes: `npm run test:all`.
- Packaging changes: add `npm run pack:check`.

The gallery can warn that its main chunk exceeds 500 kB. Treat it as an optimization warning unless bundle splitting is in scope.

## Known design cautions

- Generated IDs can collide with inherited/business methods; do not weaken reserved-name protection.
- A root ID is not a generated child ref unless explicitly implemented and tested.
- Bindings are one-time base-constructor reads. Derived fields are not initialized yet; getters can expose values, but reactivity is a separate feature.
- Resolver extensions and transform-loader extensions must remain aligned (`.ts`, `.tsx`, `.js`, `.mjs` where applicable).
- Accessibility metadata, tokens/themes, reactive conditions, and list templating are separate feature areas; do not imply they exist.
