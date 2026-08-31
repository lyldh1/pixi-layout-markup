# pixi-layout-markup

`pixi-layout-markup` 是面向 PixiJS v8 和 `@pixi/layout` 的声明式 XML UI 编译器。
XML 会在构建阶段完全编译为原生 PixiJS 实例化代码，浏览器产物中不包含 XML 字符串，
也不需要 `DOMParser`、运行时 AST 遍历或属性反射。

## 特性

- 支持 PixiJS v8、`@pixi/layout` 和可选的 `@pixi/ui`
- 支持 Vite、Rollup、Webpack、Rspack、esbuild 和 Bun
- XML 与同名 TypeScript 类自动关联
- XML 完全展开为 `new Container()`、`new Text()`、`addChild()` 等原生代码
- 自动生成基于 `id` 的 refs 类型声明
- 支持精确 XML Source Map 和编译期诊断
- 支持布局、事件、Signal、Graphics 绘图、对象、数组和资源引用
- 静态 Graphics 自动提升为共享 `GraphicsContext`

## 安装

```bash
npm install pixi-layout-markup pixi.js @pixi/layout
```

需要使用 `@pixi/ui` 时：

```bash
npm install @pixi/ui
```

## 初始化 Vite + TypeScript 项目

下面的步骤使用 Vite 的 `vanilla-ts` 模板创建一个完整项目。

### 1. 创建项目并安装依赖

```bash
npm create vite@latest pixi-markup-app -- --template vanilla-ts
cd pixi-markup-app
npm install
npm install pixi-layout-markup pixi.js @pixi/layout
```

如果 XML 中需要使用 `FancyButton`、`Slider`、`ScrollBox` 等组件，再安装：

```bash
npm install @pixi/ui
```

### 2. 配置 Vite

在项目根目录创建或修改 `vite.config.ts`：

```ts
import { defineConfig } from 'vite';
import { pixiLayoutMarkup } from 'pixi-layout-markup/vite';

export default defineConfig({
  plugins: [
    pixiLayoutMarkup({
      componentDirs: ['src'],
      refTypesDir: '.pixi-layout-markup/types',
      cleanRefTypes: true,
    }),
  ],
});
```

插件会将 XML 编译为原生 PixiJS 代码，并自动把同名 XML 注入继承自
`MarkupContainer` 或 `MarkupLayoutContainer` 的 TypeScript 类。

### 3. 配置 TypeScript

Vite 的 `vanilla-ts` 模板使用 `tsconfig.app.json`，将生成的 refs 类型目录加入
`include`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", ".pixi-layout-markup/types"]
}
```

创建 `src/xml.d.ts`：

```ts
declare module '*.xml' {
  import type { MarkupTemplate } from 'pixi-layout-markup';

  const template: MarkupTemplate;
  export default template;
}
```

### 4. 创建应用入口

将 `src/main.ts` 替换为：

```ts
import { Application } from 'pixi.js';
import { LoginView } from './ui/LoginView';

async function main(): Promise<void> {
  const app = new Application();

  await app.init({
    resizeTo: window,
    background: '#0f172a',
    antialias: true,
  });

  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.appendChild(app.canvas);
  app.stage.addChild(new LoginView());
}

void main();
```

接着按照“快速开始”一节创建同名的 `src/ui/LoginView.ts` 和
`src/ui/LoginView.xml`。TypeScript 类中不需要手动导入 XML。

### 5. 生成 refs 类型并运行

建议在 `package.json` 中增加 refs 生成和类型检查命令：

```json
{
  "scripts": {
    "generate:refs": "pixi-layout-markup generate-refs --clean",
    "typecheck": "npm run generate:refs && tsc --noEmit",
    "dev": "npm run generate:refs && vite",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview"
  }
}
```

在 `.gitignore` 中加入：

```gitignore
.pixi-layout-markup/
```

启动开发服务器：

```bash
npm run dev
```

## 初始化 Webpack + TypeScript 项目

下面的步骤从空目录创建一个使用 Webpack、TypeScript、PixiJS v8 和
`pixi-layout-markup` 的项目。建议使用 Node.js 20.19+ 或 22.12+。

### 1. 创建项目并安装依赖

```bash
mkdir pixi-markup-app
cd pixi-markup-app
npm init -y
npm install pixi-layout-markup pixi.js @pixi/layout
npm install --save-dev typescript webpack webpack-cli webpack-dev-server ts-loader html-webpack-plugin
```

如果 XML 中需要使用 `FancyButton`、`Slider`、`ScrollBox` 等组件，再安装：

```bash
npm install @pixi/ui
```

### 2. 配置 Webpack

在项目根目录创建 `webpack.config.cjs`：

```js
const path = require('node:path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.xml$/i,
        use: [
          {
            loader: 'pixi-layout-markup/webpack',
            options: {
              componentDirs: ['src'],
              refTypesDir: '.pixi-layout-markup/types',
              generateRefTypes: true,
            },
          },
        ],
      },
      {
        test: /\.ts$/i,
        exclude: /node_modules/,
        use: [
          'ts-loader',
          'pixi-layout-markup/webpack-transform',
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' }),
  ],
  devtool: 'source-map',
  devServer: {
    hot: true,
    open: true,
  },
};
```

Webpack loader 从右向左执行，因此 TypeScript 规则中必须先写 `ts-loader`，再写
`pixi-layout-markup/webpack-transform`。这样同名 XML 会先注入 TypeScript 类，然后再由
`ts-loader` 编译。

### 3. 配置 TypeScript

创建 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "skipLibCheck": true,
    "sourceMap": true
  },
  "include": ["src", ".pixi-layout-markup/types"]
}
```

创建 `src/xml.d.ts`：

```ts
declare module '*.xml' {
  import type { MarkupTemplate } from 'pixi-layout-markup';

  const template: MarkupTemplate;
  export default template;
}
```

### 4. 创建应用入口

创建 `src/index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pixi Layout Markup</title>
  </head>
  <body style="margin: 0; overflow: hidden"></body>
</html>
```

创建 `src/main.ts`：

```ts
import { Application } from 'pixi.js';
import { LoginView } from './ui/LoginView';

async function main(): Promise<void> {
  const app = new Application();

  await app.init({
    resizeTo: window,
    background: '#0f172a',
    antialias: true,
  });

  document.body.appendChild(app.canvas);
  app.stage.addChild(new LoginView());
}

void main();
```

接着按照下一节创建同名的 `src/ui/LoginView.ts` 和 `src/ui/LoginView.xml`。
TypeScript 类中不需要手动导入 XML，Webpack transform loader 会自动完成关联。

### 5. 添加命令并运行

在 `package.json` 中加入：

```json
{
  "scripts": {
    "generate:refs": "pixi-layout-markup generate-refs --clean",
    "typecheck": "npm run generate:refs && tsc --noEmit",
    "dev": "npm run generate:refs && webpack serve --mode development",
    "build": "npm run typecheck && webpack --mode production"
  }
}
```

在 `.gitignore` 中加入：

```gitignore
dist/
.pixi-layout-markup/
```

启动开发服务器：

```bash
npm run dev
```

## 快速开始

创建同名的 TypeScript 和 XML 文件：

```ts
// src/ui/LoginView.ts
import { MarkupLayoutContainer } from 'pixi-layout-markup';

export class LoginView extends MarkupLayoutContainer {
  public submit(): void {
    this.title.text = '正在登录…';
    this.submitButton.visible = false;
  }
}
```

```xml
<!-- src/ui/LoginView.xml -->
<LayoutContainer
  width="320"
  padding="20"
  gap="12"
  flexDirection="column"
  backgroundColor="#111827"
  borderRadius="12"
>
  <Text
    id="title"
    text="登录"
    fill="#ffffff"
    fontSize="32"
    fontWeight="bold"
    align="center"
    fontFamily="Microsoft YaHei"
    layout="true"
  />
  <LayoutContainer
    id="submitButton"
    height="44"
    eventMode="static"
    cursor="pointer"
    onPointerTap="submit"
  />
</LayoutContainer>
```

`Text`、`BitmapText`、`HTMLText` 及对应的 `Layout*` 文本组件支持直接书写常用的标量 `TextStyle` 属性：

```xml
<Text
  text="登录"
  fill="#ffffff"
  fontFamily="Microsoft YaHei"
  fontSize="32"
  fontWeight="bold"
  fontStyle="normal"
  fontVariant="normal"
  align="center"
  letterSpacing="1"
  lineHeight="40"
  leading="0"
  padding="2"
  textBaseline="alphabetic"
  whiteSpace="normal"
  wordWrap="true"
  wordWrapWidth="280"
  breakWords="false"
  trim="false"
  layout="true"
/>
```

这些属性会编译为对 PixiJS `TextStyle` 的赋值。`fontSize`、间距和尺寸属性使用数字，布尔属性使用 `true`/`false`。`stroke`、`dropShadow`、渐变、`tagStyles` 等对象型样式仍通过 `prop.style="{sharedStyle}"` 或代码侧的 `TextStyle` 设置；同一节点同时使用时，XML 快捷属性会覆盖共享样式中的同名字段。

配置 Vite：

```ts
import { defineConfig } from 'vite';
import { pixiLayoutMarkup } from 'pixi-layout-markup/vite';

export default defineConfig({
  plugins: [pixiLayoutMarkup({
    componentDirs: ['src'],
    refTypesDir: '.pixi-layout-markup/types',
    cleanRefTypes: true,
  })],
});
```

在 `tsconfig.json` 中包含生成的类型：

```json
{
  "include": ["src", ".pixi-layout-markup/types"]
}
```

建议将生成目录加入 `.gitignore`：

```gitignore
.pixi-layout-markup/
```

## 两种视图基类

```ts
import {
  MarkupContainer,
  MarkupLayoutContainer,
} from 'pixi-layout-markup';
```

- `MarkupContainer`：对应普通 PixiJS `Container`，适合场景层或不需要布局背景的容器。
- `MarkupLayoutContainer`：对应 `LayoutContainer`，适合使用背景、边框、溢出和 Flexbox 布局的 UI。

根 XML 必须与基类匹配：

```ts
class WorldLayer extends MarkupContainer {}
class MainPanel extends MarkupLayoutContainer {}
```

```xml
<!-- WorldLayer.xml -->
<Container />
```

```xml
<!-- MainPanel.xml -->
<LayoutContainer />
```

## `id` 与自动 refs

XML 中带 `id` 的节点会同时写入 `this.refs`，并投影为同名只读成员：

```xml
<LayoutContainer>
  <Text id="title" text="Hello" />
  <Graphics id="icon" />
</LayoutContainer>
```

```ts
this.title.text = 'Updated';
this.refs.icon.visible = false;
```

生成的 `.refs.d.ts` 会提供准确类型。没有声明泛型时，`refs` 仍可作为
`Record<string, any>` 使用。`id` 不能重复，也不能覆盖视图或 PixiJS 已有成员。
旧的 `ref` 属性不受支持，请统一使用 `id`。

## Layout 语义

布局属性可以直接写在 XML 节点上：

```xml
<LayoutContainer
  width="80%"
  minHeight="200"
  padding="16"
  gap="8"
  flexDirection="row"
  justifyContent="space-between"
  alignItems="center"
/>
```

也可以使用显式的 `layout.` 前缀：

```xml
<Sprite layout.width="128" layout.height="128" layout.objectFit="contain" />
```

原生叶子显示对象可使用 intrinsic 尺寸：

```xml
<Text text="标题" layout="true" />
```

`layout="true"` 与 `layout.isLeaf="true"` 含义不同：

- `layout="true"`：启用布局并使用元素自身的 intrinsic 尺寸。
- `layout.isLeaf="true"`：把一个容器强制作为 Yoga 叶节点处理。

普通 `Container` 可以使用布局，也可以完全不使用布局。没有使用任何 Layout 能力的
XML 不会引入 `@pixi/layout` 运行时代码。

## 属性规则

普通属性会根据组件元数据编译到构造参数或布局配置：

```xml
<Text text="Hello" eventMode="static" cursor="pointer" />
```

使用 `set.` 显式设置实例属性：

```xml
<Sprite set.alpha="0.8" set.rotation="1.57" set.tint="#ff0000" />
```

使用 `prop.` 显式传递原生组件属性或构造选项，主要用于解决属性名与 Layout 属性冲突：

```xml
<FancyButton width="100%" prop.width="240" prop.padding="12" />
```

颜色支持：

```xml
backgroundColor="#dc2626"
backgroundColor="#dc2626ff"
backgroundColor="rgb(220, 38, 38)"
backgroundColor="rgba(220, 38, 38, 0.5)"
backgroundColor="0xdc2626"
```

## 事件

PixiJS 联合事件可以直接绑定到同名 TypeScript 方法：

```xml
<LayoutContainer
  eventMode="static"
  cursor="pointer"
  onPointerDown="beginDrag"
  onGlobalPointerMove="drag"
  onPointerUp="endDrag"
  onPointerUpOutside="endDrag"
/>
```

```ts
import type { FederatedPointerEvent } from 'pixi.js';

public beginDrag(event: FederatedPointerEvent): void {
  console.log(event.pointerType, event.global.x, event.global.y);
}
```

支持的主要事件包括：

- Pointer：`PointerDown`、`PointerUp`、`PointerUpOutside`、`PointerMove`、
  `GlobalPointerMove`、`PointerOver`、`PointerOut`、`PointerEnter`、
  `PointerLeave`、`PointerTap`、`PointerCancel`
- Mouse：`MouseDown`、`MouseUp`、`MouseUpOutside`、`MouseMove`、
  `GlobalMouseMove`、`MouseOver`、`MouseOut`、`MouseEnter`、`MouseLeave`、
  `Click`、`RightDown`、`RightUp`、`RightUpOutside`、`RightClick`、`Wheel`
- Touch：`TouchStart`、`TouchEnd`、`TouchEndOutside`、`TouchMove`、
  `GlobalTouchMove`、`TouchCancel`、`Tap`

在事件名后追加 `Capture` 可绑定捕获阶段，例如 `onPointerDownCapture`。

## `@pixi/ui`

安装 `@pixi/ui` 后，可以直接使用常见 UI 标签，包括：

- `ButtonContainer`、`FancyButton`、`Input`、`CheckBox`、`Switcher`
- `List`、`MaskedFrame`、`ProgressBar`、`CircularProgressBar`
- `RadioGroup`、`ScrollBox`、`Select`、`Slider`、`DoubleSlider`、`Dialog`

Signal 使用 `signal.` 绑定：

```xml
<Slider id="volume" signal.onChange="changeVolume" />
<FancyButton id="start" text="开始" signal.onPress="startGame" />
```

状态视图使用属性元素：

```xml
<FancyButton id="start" signal.onPress="startGame">
  <FancyButton.defaultView>
    <Graphics>
      <RoundRect x="0" y="0" width="220" height="52" radius="10" />
      <Fill color="#dc2626" />
    </Graphics>
  </FancyButton.defaultView>
  <FancyButton.hoverView>
    <Graphics>
      <RoundRect x="0" y="0" width="220" height="52" radius="10" />
      <Fill color="#ef4444" />
    </Graphics>
  </FancyButton.hoverView>
</FancyButton>
```

每个 FancyButton 状态 Graphics 都会生成独立的 `GraphicsContext`，避免
`Graphics.clone()` 共享 Context 后继续 `fill()`、`stroke()` 或 `svg()`
导致状态互相污染。

## Graphics

Graphics 子节点按照声明顺序编译为 PixiJS v8 绘图调用：

```xml
<Graphics>
  <RoundRect x="0" y="0" width="180" height="48" radius="8" />
  <Fill color="#2563eb" />
  <RoundRect x="3" y="3" width="174" height="42" radius="6" />
  <Stroke color="#93c5fd" width="2" />
</Graphics>
```

支持 `Rect`、`RoundRect`、`Circle`、`Ellipse`、`MoveTo`、`LineTo`、
`BezierCurveTo`、`QuadraticCurveTo`、`Arc`、`ArcTo`、`ClosePath`、
`Fill`、`Stroke` 和 `Cut`。静态图形会提升为模块级共享
`GraphicsContext`，动态图形保持独立实例。

## 对象、数组与资源

复杂构造参数可以使用 `Object` 和 `Array`：

```xml
<FancyButton.offset>
  <Object>
    <Object.default y="0" />
    <Object.disabled y="2" />
  </Object>
</FancyButton.offset>
```

```xml
<RadioGroup.items>
  <Array>
    <CheckBox style="@asset(radioStyle)" />
    <CheckBox style="@asset(radioStyle)" />
  </Array>
</RadioGroup.items>
```

`@asset(alias)` 会直接编译为 `Assets.get(alias)`。资源需要在创建视图前加载完成。

纹理属性必须传入 PixiJS `Texture`，不能直接填写资源别名字符串。例如，下面的写法是错误的：

```xml
<!-- 错误：会把 "ctrlAreaBg" 字符串直接传给 texture -->
<NineSliceSprite texture="ctrlAreaBg" />
```

使用九宫格背景时，应通过 `@asset(alias)` 获取已经加载的纹理：

```xml
<NineSliceSprite
  id="controlPanelBg"
  width="100%"
  height="100%"
  texture="@asset(ctrlAreaBg)"
  leftWidth="20"
  topHeight="20"
  rightWidth="20"
  bottomHeight="20"
/>
```

在创建对应视图实例之前加载资源：

```ts
import { Assets } from 'pixi.js';

await Assets.load({
  alias: 'ctrlAreaBg',
  src: '/assets/ctrl-area-bg.png',
});

const controlPanel = new ControlPanel();
app.stage.addChild(controlPanel);
```

如果资源来自 manifest 或 bundle，同样必须先等待 `Assets.loadBundle(...)` 完成，再创建视图。`@asset(ctrlAreaBg)` 是同步缓存读取；别名不存在或资源尚未加载时会得到 `undefined`，可能在渲染阶段表现为读取纹理 `alphaMode` 等属性失败。

## 自定义组件

同目录、同名的 `.ts` 与 `.xml` 会自动关联：

```ts
// ActionButton.ts
import { MarkupLayoutContainer } from 'pixi-layout-markup';

export class ActionButton extends MarkupLayoutContainer {
  public set text(value: string) {
    this.label.text = value;
  }
}
```

```xml
<!-- ActionButton.xml -->
<LayoutContainer>
  <Text id="label" text="" layout="true" />
</LayoutContainer>
```

父级可以直接使用：

```xml
<ActionButton id="startButton" prop.text="开始游戏" />
```

编译器会从 TypeScript 公共字段、getter 和 setter 推断可设置属性。无法自动推断的第三方
组件可以通过 `defineMarkupComponent()` 提供严格元数据。

## 命名空间

推荐在 XML 根节点通过标准的 `xmlns:*` 属性声明组件来源。命名空间属于当前 XML 文件，
Vite、Webpack、Rollup、esbuild、Bun 和 CLI 都会使用同一套解析规则。

### 引用相对目录中的组件

例如目录结构：

```text
src/ui/
├─ GameUI.ts
├─ GameUI.xml
└─ childrenui/
   ├─ ActionButton.ts
   └─ ActionButton.xml
```

`ActionButton.ts` 和 `ActionButton.xml` 仍然遵循同名关联规则：

```ts
// src/ui/childrenui/ActionButton.ts
import { MarkupLayoutContainer } from 'pixi-layout-markup';

export class ActionButton extends MarkupLayoutContainer {
  public set text(value: string) {
    this.label.text = value;
  }
}
```

```xml
<!-- src/ui/childrenui/ActionButton.xml -->
<LayoutContainer
  width="180"
  height="48"
  justifyContent="center"
  alignItems="center"
  backgroundColor="#2563eb"
  borderRadius="8"
>
  <Text id="label" text="Button" layout="true" />
</LayoutContainer>
```

在 `GameUI.xml` 根节点声明相对目录，然后通过 `前缀:类名` 使用组件：

```xml
<!-- src/ui/GameUI.xml -->
<LayoutContainer
  xmlns:child="./childrenui"
  width="100%"
  height="100%"
  justifyContent="center"
  alignItems="center"
>
  <child:ActionButton
    id="startButton"
    prop.text="开始游戏"
  />
</LayoutContainer>
```

以上组件会编译为相对于 `GameUI.xml` 的导入：

```ts
import { ActionButton } from './childrenui/ActionButton';
```

相对命名空间必须以 `./` 或 `../` 开头，并统一使用 `/`，不要使用 Windows 的 `\`。
为了保证 Windows、Linux 和 macOS 构建结果一致，文件名、类名和 XML 标签名应保持相同大小写。

### 引用 npm 组件包

命名空间也可以直接指向包名：

```xml
<LayoutContainer xmlns:game="@company/game-ui">
  <game:ActionButton />
  <game:ConfirmDialog />
</LayoutContainer>
```

包命名空间使用模块根的 named exports，生成结果等价于：

```ts
import {
  ActionButton,
  ConfirmDialog,
} from '@company/game-ui';
```

因此组件包需要从入口导出对应类：

```ts
export { ActionButton } from './ActionButton';
export { ConfirmDialog } from './ConfirmDialog';
```

### 构建配置中的全局命名空间

需要在大量 XML 中共享同一个命名空间时，仍可在构建配置中声明：

```ts
pixiLayoutMarkup({
  namespaces: {
    ui: '@game/ui',
    local: { directory: 'src/shared-ui' },
  },
});
```

```xml
<LayoutContainer>
  <ui:Button />
  <local:Dialog />
</LayoutContainer>
```

构建配置中的字符串模块保持原有的子路径导入语义：`ui:Button` 会解析为
`@game/ui/Button`。如果同一个前缀同时出现在 XML 的 `xmlns:*` 和构建配置中，
XML 文件内的声明优先。

目前只允许在根元素声明 `xmlns:*`，不支持默认 `xmlns` 和子节点重新声明。
命名空间属性仅供编译器使用，不会生成 PixiJS 实例属性。

## 统一项目配置

在项目根目录创建 `pixi-layout-markup.config.ts`，可以让 Vite、Webpack、Rspack、
Rollup、esbuild、Bun 和 CLI 共用同一份配置：

```ts
import { defineMarkupConfig } from 'pixi-layout-markup/config';

export default defineMarkupConfig({
  sourceDir: 'src',
  componentDirs: [
    'src/ui',
    'src/components',
  ],
  namespaces: {
    shared: {
      directory: 'src/shared-ui',
    },
    game: {
      module: '@company/game-ui',
      importMode: 'named',
    },
  },
  refTypesDir: '.pixi-layout-markup/types',
  generateRefTypes: true,
  cleanRefTypes: true,
});
```

支持自动发现以下文件，按列出的顺序优先匹配：

```text
pixi-layout-markup.config.ts
pixi-layout-markup.config.mjs
pixi-layout-markup.config.js
pixi-layout-markup.config.cjs
pixi-layout-markup.config.json
```

配置中的 `rootDir` 相对于配置文件目录解析；`componentDirs`、`sourceDir` 和
`refTypesDir` 再相对于 `rootDir` 使用。

### Vite/Rollup

配置文件存在后，插件可以零参数使用：

```ts
import { defineConfig } from 'vite';
import { pixiLayoutMarkup } from 'pixi-layout-markup/vite';

export default defineConfig({
  plugins: [pixiLayoutMarkup()],
});
```

### Webpack/Rspack

两个 loader 都会从 Webpack 项目根目录自动读取统一配置：

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

### CLI

以下命令会自动读取项目根目录中的配置，因此全局命名空间和组件目录也能用于 refs：

```bash
pixi-layout-markup generate-refs
```

指定其他配置文件：

```bash
pixi-layout-markup generate-refs --config config/markup.config.ts
```

临时禁用配置发现：

```bash
pixi-layout-markup generate-refs --no-config
```

插件、loader 或 CLI 中显式传入的选项优先于配置文件。`components`、`namespaces` 和
`componentMetadata` 会按键合并，其余选项由显式值覆盖。XML 根节点的 `xmlns:*` 优先于
统一配置中的同名前缀。

Vite 开发服务器会监听统一配置文件；配置变化时会自动重启服务器并重新加载配置。

## 其他构建工具

Rollup、esbuild 和 Bun：

```ts
import { pixiLayoutMarkupRollup } from 'pixi-layout-markup/rollup';
import { pixiLayoutMarkupEsbuild } from 'pixi-layout-markup/esbuild';
import { pixiLayoutMarkupBun } from 'pixi-layout-markup/bun';
```

Webpack：

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

Rspack 使用 `pixi-layout-markup/rspack` 和
`pixi-layout-markup/rspack-transform`。

## refs 类型生成 CLI

安装包以后，可以零配置扫描当前项目的 `src`：

```bash
npx pixi-layout-markup generate-refs
```

推荐加入应用项目的 `package.json`：

```json
{
  "scripts": {
    "generate:refs": "pixi-layout-markup generate-refs --clean",
    "typecheck": "npm run generate:refs && tsc --noEmit"
  }
}
```

默认使用当前目录作为项目根目录和 `src` 作为 XML、组件扫描目录，类型输出到
`.pixi-layout-markup/types`。

自定义目录：

```bash
pixi-layout-markup generate-refs \
  --root packages/client \
  --source source \
  --out .generated/markup-types \
  --components source/ui,source/components \
  --clean
```

`--clean` 会清理输出目录中失效的 `*.refs.d.ts`，删除操作受 `rootDir` 边界保护。

也可以编译单个 XML 文件：

```bash
npx pixi-layout-markup src/ui/MainView.xml generated/MainView.markup.js
```

## TypeScript XML 模块声明

```ts
declare module '*.xml' {
  import type { MarkupTemplate } from 'pixi-layout-markup';
  const template: MarkupTemplate;
  export default template;
}
```

## Source Map

编译器生成标准 v3 Source Map，并保留完整 `sourcesContent`。组件实例化、属性赋值、
事件、Signal、Layout 和 Graphics 调用会映射回对应 XML 标签或属性的位置。

- Vite/Rollup：通过插件 transform 返回 Source Map
- Webpack/Rspack：通过 loader callback 返回 Source Map
- esbuild/Bun：生成内联 Source Map
- CLI：生成同名 `.map` 文件和 `sourceMappingURL`

## 示例与测试

```bash
npm.cmd run gallery
npm.cmd run build:gallery
npm.cmd test
npm.cmd run test:all
```

浏览器测试使用 `PLAYWRIGHT_BROWSER_PATH` 指定的 Chromium，或自动查找 Windows 上的
Edge/Chrome，不需要 ChromeDriver。

## 运行环境

- PixiJS v8
- `@pixi/layout` 3.2 或兼容版本
- Node.js 20.19+ 或 22.12+

## License

MIT
