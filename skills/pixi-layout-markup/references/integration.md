# Consumer project integration

Use this reference when installing or configuring the package in an application.

## Dependencies

Install compatible peer versions of `pixi.js`, `@pixi/layout`, and `pixi-layout-markup`. Install optional `@pixi/ui` only when its XML components are used. Read the checked-out `package.json` for exact peer ranges.

## Vite + TypeScript

```ts
import { defineConfig } from 'vite';
import { pixiLayoutMarkup } from 'pixi-layout-markup/vite';

export default defineConfig({ plugins: [pixiLayoutMarkup()] });
```

Use the full bootstrap and XML module declarations from `README.md` when editing a real consumer; do not reconstruct them from memory.

## Webpack/Rspack

Both XML compilation and TypeScript class transformation are required:

```js
module.exports = {
  module: {
    rules: [
      { test: /\.xml$/, use: 'pixi-layout-markup/webpack' },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: ['ts-loader', 'pixi-layout-markup/webpack-transform'],
      },
    ],
  },
};
```

Rspack uses `/rspack` and `/rspack-transform`. Rollup, esbuild, and Bun use their documented package exports.

## Unified config

Create `pixi-layout-markup.config.ts` in the consumer root when shared settings are useful:

```ts
import { defineMarkupConfig } from 'pixi-layout-markup/config';

export default defineMarkupConfig({
  sourceDir: 'src',
  componentDirs: ['src/ui/components'],
  refTypesDir: '.pixi-layout-markup/types',
  namespaces: {
    ui: { directory: 'src/ui/components' },
    game: { module: '@company/game-ui' },
  },
});
```

Discovery order is `pixi-layout-markup.config.ts`, `.mjs`, `.js`, `.cjs`, then `.json`. Relative `rootDir` resolves from the config file. Explicit integration options win; `components`, `namespaces`, and `componentMetadata` merge by key.

No config is valid: integrations use defaults, local `xmlns:*` works, and sibling same-name components resolve. Use `configFile: false` or `--no-config` to disable discovery deliberately.

## Generate refs from the project root

Prefer package scripts:

```json
{
  "scripts": {
    "generate:refs": "pixi-layout-markup generate-refs",
    "typecheck": "npm run generate:refs && tsc --noEmit",
    "dev": "npm run generate:refs && vite",
    "build": "npm run typecheck && vite build"
  }
}
```

For a monorepo, run inside the application package or pass `--root packages/game-client`. Do not use `postinstall`; installation should not mutate app source or depend on workspace readiness.

Without config, the CLI scans `src`, uses `[src]` for component lookup, and writes `.pixi-layout-markup/types`. Build integrations can differ when `refTypesDir` is absent, so verify current code before promising an output path.

## Troubleshooting

- Raw XML reaches the bundle: verify the XML plugin/loader and ensure the request is not `?raw` or `?url`.
- A class is not injected: require matching TS/XML basenames and a markup base class.
- Ref types are missing: run from the correct root and include the generated directory in TypeScript.
- A namespace is unknown: declare it on the XML root or in config and preserve casing/slashes.
- Webpack compiles TS but does not inject XML: verify both loaders and their order.
