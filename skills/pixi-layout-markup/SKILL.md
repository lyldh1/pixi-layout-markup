---
name: pixi-layout-markup
description: Build, integrate, debug, document, or maintain PixiJS v8 interfaces that use pixi-layout-markup XML, generated refs, namespaces, project config, and Vite/Webpack/Rollup/esbuild/Bun tooling. Use for consumer projects and compiler changes; do not use for unrelated PixiJS rendering without XML markup.
---

# Pixi Layout Markup

Use `pixi-layout-markup` as a build-time XML-to-native-PixiJS compiler. Preserve its defining property: generated applications must not need an XML parser, reflection layer, or `eval` at runtime.

For PixiJS API questions, also load the relevant PixiJS v8 skill. Treat the checked-out `README.md`, exported types, implementation, and tests as the source of truth. Do not assume unpublished features from prior conversations.

## Choose the workflow

- For writing or reviewing XML UI, read [references/markup.md](references/markup.md).
- For consumer-project builds, config, and refs, read [references/integration.md](references/integration.md).
- For compiler, loader, CLI, generated-code, or public-API changes, read [references/maintenance.md](references/maintenance.md).

Read only references relevant to the request. Read multiple references when the task spans workflows.

## Essential invariants

- Pair `View.ts` with same-named `View.xml`; the class extends `MarkupContainer` or `MarkupLayoutContainer` and calls `super()`.
- Use `MarkupContainer` for ordinary PixiJS scene graphs and `MarkupLayoutContainer` for Yoga layout roots.
- Use `id`, not the removed `ref`. Generated references are available through `this.refs.id` and generated class members.
- Use `layout="true"` on intrinsic leaf nodes participating in Yoga layout.
- Use forward-slash namespace paths such as `xmlns:ui="./childrenui"`; never generate Windows backslashes in XML imports.
- A binding value is one property path such as `{model.title}`. Do not invent expressions, interpolation, two-way binding, or reactivity.
- Prefer supported scalar XML attributes; use `prop.*`, property elements, assets, or TypeScript for object-valued/runtime values.
- Preserve user code and configuration. Explicit plugin/loader options override discovered project config.

## Verification

- Consumer XML: build/typecheck the consumer and run `pixi-layout-markup generate-refs` when XML files or IDs change.
- Compiler behavior: add focused tests and run `npm test`.
- Integrations, runtime layout, events, or examples: run `npm run test:all`.
- Packaging/exports: also run `npm run pack:check` and inspect its file list.

Do not infer runtime success solely from generated-code inspection. Report the gallery's chunk-size warning separately when present; it is not a test failure.
