# XML markup guide

Use this reference when authoring, reviewing, or debugging `.xml` UI.

## Basic view

```ts
import { MarkupLayoutContainer } from 'pixi-layout-markup';

export class LoginView extends MarkupLayoutContainer {
  public submit(): void {
    this.title.text = '正在登录…';
  }
}
```

```xml
<LayoutContainer width="320" padding="20" gap="12" flexDirection="column">
  <Text id="title" text="登录" fill="#ffffff" fontSize="32"
    fontWeight="bold" align="center" fontFamily="Microsoft YaHei" layout="true" />
  <LayoutContainer id="submitButton" height="44" eventMode="static"
    cursor="pointer" onPointerTap="submit" />
</LayoutContainer>
```

The XML root must match the selected markup base. Intrinsic leaves need `layout="true"` when participating in Yoga layout.

## Attributes and values

- Literal numbers, booleans, `null`, strings, hex colors, and supported CSS colors compile to native values.
- `{member}` and `{model.member}` compile to direct target property reads. They run once during base construction and are not reactive.
- `@asset(alias)` compiles to `Assets.get(alias)`.
- `prop.name="value"` sets an explicit component/runtime property.
- `set.name="value"` performs a post-construction assignment.
- `layout.name="value"` disambiguates Yoga properties.
- `if="{visible}"` changes `visible`; it does not remove the node or its layout slot.
- `onPointerTap="method"` binds a PixiJS event handler.
- `signal.onPress="method"` connects a supported `@pixi/ui` signal.

Do not put compound JavaScript inside `{}`. Expose computed behavior through a TypeScript getter or method.

## Text styles

`Text`, `BitmapText`, `HTMLText`, and their `Layout*` variants accept these scalar TextStyle shortcuts:

`fill`, `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`, `fontVariant`, `align`, `letterSpacing`, `lineHeight`, `leading`, `padding`, `textBaseline`, `whiteSpace`, `wordWrap`, `wordWrapWidth`, `breakWords`, and `trim`.

Use numeric sizes/spacing and literal booleans. Use a shared `TextStyle` through `prop.style="{sharedStyle}"` for `stroke`, `dropShadow`, gradients, `tagStyles`, or other object values. Scalar XML shortcuts on the node override matching shared-style fields.

## IDs and refs

IDs must be unique and safe. Use `this.refs.title` or the generated `this.title` member. Never use `ref`. Run `pixi-layout-markup generate-refs` after adding, removing, or renaming IDs, and include the output directory in TypeScript.

Avoid IDs that collide with inherited or business members. When modifying collision rules, inspect compiler validation and add regression tests.

## Components and namespaces

Pair `ActionButton.ts` and `ActionButton.xml`, and export the class by name. Re-exporting is supported:

```ts
export { ActionButton } from './ActionButton';
```

Use a child directory through a file-local namespace:

```xml
<LayoutContainer xmlns:child="./childrenui">
  <child:ActionButton id="startButton" prop.text="开始游戏" />
</LayoutContainer>
```

This emits a named import from `./childrenui/ActionButton`. A package namespace imports named exports from its package root:

```xml
<LayoutContainer xmlns:game="@company/game-ui">
  <game:ActionButton />
</LayoutContainer>
```

Configured module namespaces retain configured subpath/import-mode behavior. File-local declarations override global config. Default namespaces, nested declarations, absolute paths, and backslashes are invalid. Preserve path casing across operating systems.

## Objects, arrays, assets, and Graphics

Use property elements with `Object`, `Array`, and `Value` for constructor object graphs. Use declarative Graphics commands such as `Rect`, `RoundRect`, `Circle`, `Fill`, and `Stroke`; do not model drawing calls as arbitrary attributes.

For the exact current property and command catalog, search `README.md`, `src/compiler.ts`, and `test/compiler.test.mjs` rather than guessing.
