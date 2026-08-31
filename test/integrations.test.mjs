import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import { pixiLayoutMarkup } from '../dist/vite.js';
import { pixiLayoutMarkupEsbuild } from '../dist/esbuild.js';
import { compileMarkupFile } from '../dist/core.js';
import { SourceMapConsumer } from 'source-map-js';

const xml = '<LayoutContainer><FancyButton defaultView="button.png" /></LayoutContainer>';

test('Vite plugin automatically loads the shared project config', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-vite-config-'));
  await writeFile(
    join(directory, 'pixi-layout-markup.config.mjs'),
    "export default { generateRefTypes: false, namespaces: { ui: '@company/ui' } };",
    'utf8',
  );
  const plugin = pixiLayoutMarkup();
  await plugin.configResolved({ root: directory });
  const result = await plugin.transform(
    '<LayoutContainer><ui:Button /></LayoutContainer>',
    join(directory, 'View.xml'),
  );
  assert.match(result.code, /from "@company\/ui\/Button"/);
});

test('resolves a relative XML namespace and generates matching ref types', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-namespace-'));
  const childrenDirectory = join(directory, 'childrenui');
  await mkdir(childrenDirectory);
  await writeFile(
    join(childrenDirectory, 'ActionButton.ts'),
    "export class ActionButton {}",
    'utf8',
  );
  const file = join(directory, 'GameUI.xml');
  const source = `<LayoutContainer xmlns:child="./childrenui">
    <child:ActionButton id="startButton" />
  </LayoutContainer>`;
  const compiled = compileMarkupFile(source, file, {
    rootDir: directory,
    refTypesDir: '.pixi-layout-markup/types',
  });

  assert.match(compiled.code, /from "\.\/childrenui\/ActionButton"/);
  assert.doesNotMatch(compiled.code, /xmlns/);
  assert.match(compiled.declaration, /from "\.\.\/\.\.\/childrenui\/ActionButton"/);
  assert.match(compiled.declaration, /readonly "startButton"/);
});

test('Vite plugin transforms XML and matching markup container classes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-view-'));
  await writeFile(join(directory, 'View.xml'), xml, 'utf8');
  const plugin = pixiLayoutMarkup({ generateRefTypes: false, configFile: false });
  await plugin.configResolved({ root: process.cwd() });
  const result = await plugin.transform(xml, join(process.cwd(), 'View.xml'));
  assert.match(result.code, /from "@pixi\/ui"/);
  assert.equal(result.map.version, 3);
  assert.deepEqual(result.map.sourcesContent, [xml]);

  const view = await plugin.transform(
    "import { MarkupLayoutContainer } from 'pixi-layout-markup'; class View extends MarkupLayoutContainer { constructor() { super(); } }",
    join(directory, 'View.ts'),
  );
  assert.match(view.code, /import __ViewMarkupTemplate from '.\/View.xml'/);
  assert.match(view.code, /super\(\); this\.applyMarkup\(__ViewMarkupTemplate\)/);
});

test('Vite plugin leaves raw and URL resource queries to Vite', async () => {
  const plugin = pixiLayoutMarkup({ generateRefTypes: false, configFile: false });
  await plugin.configResolved({ root: process.cwd() });
  assert.equal(await plugin.transform('<Container />', join(process.cwd(), 'View.xml?raw')), null);
  assert.equal(await plugin.transform('export class View {}', join(process.cwd(), 'View.ts?raw')), null);
  assert.equal(await plugin.transform('<Container />', join(process.cwd(), 'View.xml?url')), null);
});

test('Vite plugin injects XML into MarkupContainer classes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-container-'));
  await writeFile(join(directory, 'WorldLayer.xml'), '<Container />', 'utf8');
  const plugin = pixiLayoutMarkup({ generateRefTypes: false, configFile: false });
  await plugin.configResolved({ root: process.cwd() });
  const view = await plugin.transform(
    "import { MarkupContainer } from 'pixi-layout-markup'; class WorldLayer extends MarkupContainer {}",
    join(directory, 'WorldLayer.ts'),
  );
  assert.match(view.code, /import __WorldLayerMarkupTemplate from '.\/WorldLayer.xml'/);
  assert.match(view.code, /super\(\); this\.applyMarkup\(__WorldLayerMarkupTemplate\)/);
});

test('markup injection preserves container constructor options', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-options-'));
  await writeFile(join(directory, 'WorldLayer.xml'), '<Container />', 'utf8');
  const plugin = pixiLayoutMarkup({ generateRefTypes: false, configFile: false });
  await plugin.configResolved({ root: process.cwd() });
  const view = await plugin.transform(
    "import { MarkupContainer as Base } from 'pixi-layout-markup'; class WorldLayer extends Base { constructor() { super({ label: 'world' }); } }",
    join(directory, 'WorldLayer.ts'),
  );
  assert.match(view.code, /super\(\{ label: 'world' \}\); this\.applyMarkup\(__WorldLayerMarkupTemplate\)/);
});

test('markup injection exposes runtime imports used by XML bindings', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-import-binding-'));
  await writeFile(join(directory, 'WorldLayer.xml'), `<Container><Graphics><Svg value='{SVG_ICONS.undo}' /></Graphics></Container>`, 'utf8');
  const plugin = pixiLayoutMarkup({ generateRefTypes: false, configFile: false });
  await plugin.configResolved({ root: process.cwd() });
  const view = await plugin.transform(
    `import { MarkupContainer } from 'pixi-layout-markup'; import { SVG_ICONS } from './icons'; class WorldLayer extends MarkupContainer { constructor() { super(); } }`,
    join(directory, 'WorldLayer.ts'),
  );
  assert.match(view.code, /\(this as any\)\[\x22SVG_ICONS\x22\] = SVG_ICONS; this\.applyMarkup/);
});

test('rejects a markup base whose XML root does not match', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-mismatch-'));
  await writeFile(join(directory, 'Broken.xml'), '<LayoutContainer />', 'utf8');
  const plugin = pixiLayoutMarkup({ generateRefTypes: false, configFile: false });
  await plugin.configResolved({ root: process.cwd() });
  await assert.rejects(() => plugin.transform(
    "import { MarkupContainer } from 'pixi-layout-markup'; class Broken extends MarkupContainer {}",
    join(directory, 'Broken.ts'),
  ), /expected <Container>/);
});

test('esbuild plugin registers and executes XML and TS loaders', async () => {
  const callbacks = [];
  pixiLayoutMarkupEsbuild({ generateRefTypes: false }).setup({
    initialOptions: { absWorkingDir: process.cwd() },
    onLoad(options, callback) { callbacks.push([options.filter, callback]); },
  });
  assert.equal(callbacks.length, 2);
  const directory = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-'));
  const file = join(directory, 'View.xml');
  await writeFile(file, xml, 'utf8');
  const result = await callbacks.find(([filter]) => filter.test(file))[1]({ path: file });
  assert.equal(result.loader, 'js');
  assert.match(result.contents, /FancyButton/);
  assert.match(result.contents, /sourceMappingURL=data:application\/json/);
});

test('esbuild plugin automatically loads the shared project config', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-esbuild-config-'));
  await writeFile(
    join(directory, 'pixi-layout-markup.config.mjs'),
    "export default { generateRefTypes: false, namespaces: { ui: '@company/ui' } };",
    'utf8',
  );
  const callbacks = [];
  pixiLayoutMarkupEsbuild().setup({
    initialOptions: { absWorkingDir: directory },
    onLoad(options, callback) { callbacks.push([options.filter, callback]); },
  });
  const file = join(directory, 'View.xml');
  await writeFile(file, '<LayoutContainer><ui:Button /></LayoutContainer>', 'utf8');
  const result = await callbacks.find(([filter]) => filter.test(file))[1]({ path: file });
  assert.match(result.contents, /from "@company\/ui\/Button"/);
});

test('Webpack loader compiles XML through its async callback', async () => {
  const require = createRequire(import.meta.url);
  const loader = require('../webpack-loader.cjs');
  const result = await new Promise((resolve, reject) => {
    loader.call({
      resourcePath: join(process.cwd(), 'View.xml'),
      rootContext: process.cwd(),
      getOptions: () => ({ generateRefTypes: false }),
      async: () => (error, code, map) => error ? reject(error) : resolve({ code, map }),
    }, xml);
  });
  assert.match(result.code, /from "@pixi\/ui"/);
  assert.equal(result.map.version, 3);
});

test('Webpack loader automatically loads the shared project config', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-webpack-config-'));
  await writeFile(
    join(directory, 'pixi-layout-markup.config.mjs'),
    "export default { generateRefTypes: false, namespaces: { ui: '@company/ui' } };",
    'utf8',
  );
  const require = createRequire(import.meta.url);
  const loader = require('../webpack-loader.cjs');
  const result = await new Promise((resolve, reject) => {
    loader.call({
      resourcePath: join(directory, 'View.xml'),
      rootContext: directory,
      getOptions: () => ({}),
      async: () => (error, code) => error ? reject(error) : resolve(code),
    }, '<LayoutContainer><ui:Button /></LayoutContainer>');
  });
  assert.match(result, /from "@company\/ui\/Button"/);
});

test('source map resolves generated component construction to its XML tag', () => {
  const source = `<LayoutContainer>\n  <Container>\n    <Text\n      id="title"\n      text="Hello"\n    />\n  </Container>\n</LayoutContainer>`;
  const compiled = compileMarkupFile(source, join(process.cwd(), 'MappedView.xml'), {
    generateRefTypes: false,
  });
  const generatedLines = compiled.code.split('\n');
  const constructions = generatedLines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /const node\d+ = new /.test(line));
  const generatedLine = constructions[1].index + 1;
  const consumer = new SourceMapConsumer(compiled.map);
  const original = consumer.originalPositionFor({ line: generatedLine, column: 2 });
  assert.equal(original.line, 3);
  assert.equal(original.column, 5);
});

test('source map follows property-element emission order for equal component types', () => {
  const source = `<LayoutContainer>\n  <FancyButton>\n    <FancyButton.defaultView>\n      <FancyButton />\n    </FancyButton.defaultView>\n  </FancyButton>\n</LayoutContainer>`;
  const compiled = compileMarkupFile(source, join(process.cwd(), 'NestedView.xml'), {
    generateRefTypes: false,
  });
  const constructionLines = compiled.code.split('\n')
    .map((line, index) => ({ line, generatedLine: index + 1 }))
    .filter(({ line }) => /const node\d+ = new /.test(line));
  const consumer = new SourceMapConsumer(compiled.map);
  assert.equal(consumer.originalPositionFor({ line: constructionLines[0].generatedLine, column: 2 }).line, 4);
  assert.equal(consumer.originalPositionFor({ line: constructionLines[1].generatedLine, column: 2 }).line, 2);
});

test('source map follows LayoutView slot-before-parent emission order', () => {
  const source = `<LayoutContainer>\n  <LayoutView>\n    <Graphics />\n  </LayoutView>\n</LayoutContainer>`;
  const compiled = compileMarkupFile(source, join(process.cwd(), 'SlotView.xml'), { generateRefTypes: false });
  const lines = compiled.code.split('\n')
    .map((line, index) => ({ line, generatedLine: index + 1 }))
    .filter(({ line }) => /const node\d+ = new /.test(line));
  const consumer = new SourceMapConsumer(compiled.map);
  assert.equal(consumer.originalPositionFor({ line: lines[0].generatedLine, column: 2 }).line, 3);
  assert.equal(consumer.originalPositionFor({ line: lines[1].generatedLine, column: 2 }).line, 2);
});
