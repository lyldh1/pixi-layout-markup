import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compileMarkupModule,
  compileMarkupRefsDeclaration,
  MarkupCompileError,
} from '../dist/compiler.js';

const compile = (xml) => compileMarkupModule(xml, { fileName: 'Test.xml' });

test('resolves file-local XML namespaces from module roots', () => {
  const code = compile(`<LayoutContainer xmlns:company="@company/game-ui">
    <company:ActionButton />
    <company:ConfirmDialog />
  </LayoutContainer>`);
  assert.match(code, /import \{ ActionButton as __Markup\d+ \} from "@company\/game-ui"/);
  assert.match(code, /import \{ ConfirmDialog as __Markup\d+ \} from "@company\/game-ui"/);
  assert.doesNotMatch(code, /xmlns/);
});

test('keeps configured module namespaces using subpath imports', () => {
  const code = compileMarkupModule('<LayoutContainer><ui:Button /></LayoutContainer>', {
    fileName: 'Test.xml',
    namespaces: { ui: '@game/ui' },
  });
  assert.match(code, /from "@game\/ui\/Button"/);
});

test('validates file-local XML namespace declarations', () => {
  assert.throws(
    () => compile('<LayoutContainer xmlns="./ui" />'),
    (error) => error instanceof MarkupCompileError && error.code === 'DEFAULT_NAMESPACE_NOT_SUPPORTED',
  );
  assert.throws(
    () => compile('<LayoutContainer><Container xmlns:ui="./ui" /></LayoutContainer>'),
    (error) => error instanceof MarkupCompileError && error.code === 'NESTED_NAMESPACE_NOT_SUPPORTED',
  );
  assert.throws(
    () => compile('<LayoutContainer xmlns:ui="children\\ui"><ui:Button /></LayoutContainer>'),
    (error) => error instanceof MarkupCompileError && error.code === 'INVALID_NAMESPACE_SOURCE',
  );
});

test('compiles FancyButton views, objects, bindings, and signals to native code', () => {
  const code = compile(`<LayoutContainer>
    <FancyButton id="button" prop.padding="{padding}" signal.onPress="start">
      <FancyButton.defaultView>
        <Graphics>
          <RoundRect x="0" y="0" width="{buttonWidth}" height="44" radius="8" />
          <Fill color="#dc2626" />
          <Stroke color="#991b1b" width="3" />
        </Graphics>
      </FancyButton.defaultView>
      <FancyButton.animations>
        <Object>
          <Object.hover duration="120">
            <Object><Object.props y="-2" /></Object>
          </Object.hover>
        </Object>
      </FancyButton.animations>
    </FancyButton>
  </LayoutContainer>`);

  assert.match(code, /new __Markup\d+\(\{ "padding": target\["padding"\]/);
  assert.match(code, /\.roundRect\(0, 0, target\["buttonWidth"\], 44, 8\)/);
  assert.match(code, /"animations": \{ "hover": \{ "duration": 120, "props": \{ "y": -2 \} \} \}/);
  assert.match(code, /\["onPress"\]\.connect\(target\["start"\]\.bind\(target\)\)/);
});

test('uses ScrollBox.addItem for declarative children', () => {
  const code = compile('<LayoutContainer><ScrollBox><Container /></ScrollBox></LayoutContainer>');
  assert.match(code, /\.addItem\(node\d+\)/);
});

test('compiles arrays containing values and component instances', () => {
  const code = compile(`<LayoutContainer><RadioGroup type="vertical" elementsMargin="8">
    <RadioGroup.items><Array>
      <CheckBox><CheckBox.style><Object checked="on.png" unchecked="off.png" /></CheckBox.style></CheckBox>
      <CheckBox><CheckBox.style><Object checked="on.png" unchecked="off.png" /></CheckBox.style></CheckBox>
    </Array></RadioGroup.items>
  </RadioGroup></LayoutContainer>`);
  assert.match(code, /"items": \[node\d+, node\d+\]/);
});

test('compiles asset references without eval', () => {
  const code = compile('<LayoutContainer><FancyButton defaultView="@asset(button.normal)" /></LayoutContainer>');
  assert.match(code, /import \{ Assets as __MarkupAssets \} from "pixi\.js"/);
  assert.match(code, /"defaultView": __MarkupAssets\.get\("button\.normal"\)/);
});

test('generates binding members alongside refs', () => {
  const declaration = compileMarkupRefsDeclaration(
    '<LayoutContainer><Text id="title" x="{titleX}" tint="{theme.color}" /></LayoutContainer>',
    'BindingView',
  );
  assert.match(declaration, /interface BindingViewBindings/);
  assert.match(declaration, /"titleX": any/);
  assert.match(declaration, /"theme": any/);
});

test('uses id for generated members and rejects the removed ref attribute', () => {
  const code = compile('<LayoutContainer><Text id="labelText" /></LayoutContainer>');
  assert.match(code, /refs\["labelText"\] = node\d+/);
  assert.match(code, /target\["labelText"\] = node\d+/);
  assert.throws(
    () => compile('<LayoutContainer><Text ref="labelText" /></LayoutContainer>'),
    (error) => error instanceof MarkupCompileError && error.code === 'REMOVED_REF_ATTRIBUTE',
  );
});

test('rejects unknown @pixi/ui properties with a suggestion', () => {
  assert.throws(
    () => compile('<LayoutContainer><FancyButton defualtView="x.png" /></LayoutContainer>'),
    (error) => error instanceof MarkupCompileError
      && error.code === 'UNKNOWN_PROPERTY'
      && /defaultView/.test(error.message),
  );
});

test('rejects unknown signals', () => {
  assert.throws(
    () => compile('<LayoutContainer><FancyButton signal.onPres="start" /></LayoutContainer>'),
    (error) => error instanceof MarkupCompileError && error.code === 'UNKNOWN_SIGNAL',
  );
});

test('rejects misspelled Graphics commands and missing arguments', () => {
  assert.throws(
    () => compile('<LayoutContainer><Graphics><RoundRects /></Graphics></LayoutContainer>'),
    (error) => error instanceof MarkupCompileError && error.code === 'UNKNOWN_GRAPHICS_COMMAND',
  );
  assert.throws(
    () => compile('<LayoutContainer><Graphics><RoundRect x="0" /></Graphics></LayoutContainer>'),
    (error) => error instanceof MarkupCompileError && error.code === 'MISSING_GRAPHICS_ATTRIBUTE',
  );
});

test('hoists static Graphics geometry into a shared GraphicsContext', () => {
  const code = compile('<LayoutContainer><Graphics><Rect x="0" y="0" width="20" height="20" /><Fill color="#f00" /></Graphics></LayoutContainer>');
  assert.match(code, /const __MarkupGraphicsContext0 = new __MarkupGraphicsContext\(\)/);
  assert.match(code, /new __Markup\d+\(\{ context: __MarkupGraphicsContext0 \}\)/);
});

test('keeps FancyButton state Graphics contexts independent', () => {
  const code = compile(`<LayoutContainer><FancyButton>
    <FancyButton.defaultView><Graphics><Circle x="15" y="15" radius="15" /><Fill color="#111" /><Svg value="&lt;svg /&gt;" /></Graphics></FancyButton.defaultView>
    <FancyButton.hoverView><Graphics><Circle x="15" y="15" radius="15" /><Fill color="#222" /><Svg value="&lt;svg /&gt;" /></Graphics></FancyButton.hoverView>
    <FancyButton.pressedView><Graphics><Circle x="15" y="15" radius="15" /><Fill color="#222" /><Svg value="&lt;svg /&gt;" /></Graphics></FancyButton.pressedView>
  </FancyButton></LayoutContainer>`);
  assert.doesNotMatch(code, /GraphicsContext/);
  assert.doesNotMatch(code, /\.clone\(/);
  assert.equal((code.match(/\.circle\(/g) ?? []).length, 3);
  assert.equal((code.match(/\.svg\(/g) ?? []).length, 3);
});

test('preserves prop.layout=true using the official intrinsic leaf semantics', () => {
  const code = compile('<LayoutContainer><Text prop.layout="true" /></LayoutContainer>');
  assert.match(code, /(?:\.layout|\["layout"\]) = true/);
});

test('compiles layout=true directly and registers the layout extension', () => {
  const code = compile('<LayoutContainer><Text layout="true" /></LayoutContainer>');
  assert.match(code, /^import "@pixi\/layout";/);
  assert.match(code, /\.layout = true/);
});

test('compiles scalar TextStyle attributes as XML shortcuts', () => {
  const code = compile('<LayoutContainer><Text fill="#ffffff" fontSize="12" fontWeight="bold" align="center" fontFamily="Arial" wordWrap="true" /></LayoutContainer>');
  assert.match(code, /\.style\["fill"\] = "#ffffff"/);
  assert.match(code, /\.style\["fontSize"\] = 12/);
  assert.match(code, /\.style\["fontWeight"\] = "bold"/);
  assert.match(code, /\.style\["align"\] = "center"/);
  assert.match(code, /\.style\["fontFamily"\] = "Arial"/);
  assert.match(code, /\.style\["wordWrap"\] = true/);
  assert.doesNotMatch(code, /new __Markup\d+\(\{[^}]*"fontSize"/);
});

test('compiles separate Text and Sprite anchor coordinates', () => {
  const code = compile(`<Container><Text anchor='0,0.5' /><Sprite anchor='1, 0' /><BitmapText anchor='0.25' /></Container>`);
  assert.match(code, /\x22anchor\x22: \{ x: 0, y: 0\.5 \}/);
  assert.match(code, /\x22anchor\x22: \{ x: 1, y: 0 \}/);
  assert.match(code, /\x22anchor\x22: 0\.25/);
});

test('rejects malformed anchor coordinates', () => {
  assert.throws(
    () => compile(`<Container><Text anchor='0,center' /></Container>`),
    (error) => error instanceof MarkupCompileError && error.code === 'INVALID_ATTRIBUTE_VALUE',
  );
});

test('validates scalar TextStyle shortcut types', () => {
  const code = compile(`<LayoutContainer><Text fontWeight='500' style.fontFamily='Arial' style.fontSize='16px' style.dropShadow='true' /></LayoutContainer>`);
  assert.match(code, /\.style\[\x22fontWeight\x22\] = \x22500\x22/);
  assert.match(code, /\.style\[\x22fontFamily\x22\] = \x22Arial\x22/);
  assert.match(code, /\.style\[\x22fontSize\x22\] = \x2216px\x22/);
  assert.match(code, /\.style\[\x22dropShadow\x22\] = true/);
  assert.throws(
    () => compile('<LayoutContainer><Text dropShadow="yes" /></LayoutContainer>'),
    (error) => error instanceof MarkupCompileError && error.code === 'INVALID_ATTRIBUTE_VALUE',
  );
});

test('keeps plain Container markup free of the layout runtime', () => {
  const code = compile('<Container><Text text="plain" /></Container>');
  assert.doesNotMatch(code, /import "@pixi\/layout"/);
  assert.match(code, /from "pixi.js"/);
  assert.doesNotMatch(code, /@pixi\/layout\/components/);
});

test('decodes Unicode escapes in static text attributes', () => {
  const code = compile(String.raw`<Container><Text text='\u200B' /></Container>`);
  assert.ok(code.includes(String.fromCodePoint(0x200B)));
  assert.doesNotMatch(code, /\\\\u200B/);
});

test('compiles a LayoutView child as its single slot', () => {
  const code = compile('<LayoutContainer><LayoutView><Graphics /></LayoutView></LayoutContainer>');
  assert.match(code, /new __Markup\d+\(\{ "slot": node\d+ \}\)/);
  assert.throws(
    () => compile('<LayoutContainer><LayoutView /></LayoutContainer>'),
    (error) => error.code === 'INVALID_LAYOUT_VIEW_SLOT',
  );
});

test('rejects layout styles on incompatible node types', () => {
  assert.throws(
    () => compile('<Container backgroundColor="red" />'),
    (error) => error.code === 'UNSUPPORTED_LAYOUT_STYLE',
  );
  assert.throws(
    () => compile('<LayoutContainer objectFit="contain" />'),
    (error) => error.code === 'LEAF_LAYOUT_STYLE_REQUIRED',
  );
});

test('uses direct sizing for sized @pixi/ui components by default', () => {
  const code = compile('<LayoutContainer><FancyButton width="100" height="40" /></LayoutContainer>');
  assert.match(code, /"applySizeDirectly": true/);
});

test('rejects display children inside native leaf nodes', () => {
  assert.throws(
    () => compile('<LayoutContainer><Text><Graphics /></Text></LayoutContainer>'),
    (error) => error.code === 'LEAF_CHILD_NOT_ALLOWED',
  );
});

test('rejects missing required @pixi/ui constructor properties', () => {
  assert.throws(
    () => compile('<LayoutContainer><Input /></LayoutContainer>'),
    (error) => error.code === 'MISSING_CONSTRUCTOR_PROPERTY',
  );
});

test('compiles layout.isLeaf directly into layout options', () => {
  const code = compile('<LayoutContainer><Text layout.isLeaf="true" /></LayoutContainer>');
  assert.match(code, /\.layout = \{ "isLeaf": true \}/);
});

test('accepts supported color syntaxes and rejects invalid typed values', () => {
  for (const color of ['#dc2626', '#dc2626ff', '0xdc2626', 'rgb(220, 38, 38)', 'rgba(220, 38, 38, 1)']) {
    assert.doesNotThrow(() => compile(`<LayoutContainer borderColor="${color}" />`));
  }
  assert.throws(
    () => compile('<LayoutContainer borderColor="not-a-color" />'),
    (error) => error.code === 'INVALID_ATTRIBUTE_VALUE',
  );
  assert.throws(
    () => compile('<LayoutContainer visible="maybe" />'),
    (error) => error.code === 'INVALID_ATTRIBUTE_VALUE',
  );
});

test('compiles PixiJS event handlers without runtime reflection', () => {
  const code = compile('<LayoutContainer eventMode="static" cursor="pointer" onPointerdown="press" onPointerup="release" onWheel="scroll" />');
  assert.match(code, /target\["eventMode"\] = "static"/);
  assert.match(code, /target\["cursor"\] = "pointer"/);
  assert.match(code, /\.on\("pointerdown", target\["press"\], target\)/);
  assert.match(code, /\.on\("pointerup", target\["release"\], target\)/);
  assert.match(code, /\.on\("wheel", target\["scroll"\], target\)/);
});

test('validates layout conflicts and root element contracts', () => {
  assert.throws(
    () => compile('<LayoutContainer layout="false" width="100" />'),
    (error) => error.code === 'CONFLICTING_LAYOUT_VALUE',
  );
  assert.throws(
    () => compile('<LayoutContainer layout="enabled" />'),
    (error) => error.code === 'INVALID_LAYOUT_VALUE',
  );
  assert.throws(
    () => compile('<Text />'),
    (error) => error instanceof MarkupCompileError && /root component/.test(error.message),
  );
});

test('rejects duplicate and prototype-polluting ids', () => {
  assert.throws(
    () => compile('<Container><Text id="same" /><Text id="same" /></Container>'),
    /Duplicate UI reference/,
  );
  assert.throws(
    () => compile('<Container><Text id="__proto__" /></Container>'),
    /Reserved UI reference name/,
  );
});

test('emits nested bindings, visibility expressions, and asset lookup as direct code', () => {
  const code = compile('<Container><Text id="title" text="{model.title}" if="{visible}" tint="@asset(theme.tint)" /></Container>');
  assert.match(code, /target\["model"\]\["title"\]/);
  assert.match(code, /Boolean\(target\["visible"\]\)/);
  assert.match(code, /__MarkupAssets\.get\("theme.tint"\)/);
  assert.doesNotMatch(code, /eval|new Function/);
});

test('reports malformed XML with filename and source location', () => {
  assert.throws(
    () => compile('<LayoutContainer>\n  <Text>\n</LayoutContainer>'),
    (error) => error instanceof MarkupCompileError
      && error.fileName === 'Test.xml'
      && error.line >= 1
      && error.column >= 1,
  );
});

