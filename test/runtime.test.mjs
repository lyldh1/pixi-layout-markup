import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import { Container } from 'pixi.js';
import { MarkupContainer } from '../dist/index.js';
import {
  cleanMarkupRefTypes,
  compileMarkupFile,
  generateMarkupRefTypes,
  getRefTypesPath,
  removeMarkupRefTypes,
  writeMarkupRefTypes,
} from '../dist/core.js';

test('MarkupContainer preserves PixiJS options and initializes generated members', () => {
  const child = new Container({ label: 'child' });
  const template = (target, refs) => {
    target.addChild(child);
    refs.child = child;
    target.child = child;
  };
  class TestView extends MarkupContainer {
    constructor() { super(template, { label: 'root', eventMode: 'static' }); }
  }
  const view = new TestView();
  assert.equal(view.label, 'root');
  assert.equal(view.eventMode, 'static');
  assert.equal(view.refs.child, child);
  assert.equal(view.child, child);
  assert.equal(child.parent, view);
});

test('MarkupContainer can apply markup after derived fields initialize', () => {
  const template = (target) => {
    target.renderedFontFamily = target.fontFamily;
  };
  class TestView extends MarkupContainer {
    fontFamily = 'Arial';
    constructor() {
      super();
      this.applyMarkup(template);
    }
  }
  const view = new TestView();
  assert.equal(view.renderedFontFamily, 'Arial');
});

test('ref declaration files can be written, removed, and safely cleaned', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-refs-'));
  const xmlFile = join(rootDir, 'src', 'View.xml');
  const options = { rootDir, refTypesDir: '.generated/types' };
  const compiled = compileMarkupFile('<Container><Text id="title" /></Container>', xmlFile, options);
  assert.equal(compiled.declarationPath, join(rootDir, '.generated', 'types', 'src', 'View.refs.d.ts'));
  writeMarkupRefTypes(compiled);
  assert.match(await readFile(compiled.declarationPath, 'utf8'), /readonly "title"/);
  removeMarkupRefTypes(xmlFile, options);
  await assert.rejects(readFile(compiled.declarationPath, 'utf8'));

  writeMarkupRefTypes(compiled);
  await writeFile(join(dirname(compiled.declarationPath), 'keep.txt'), 'keep');
  cleanMarkupRefTypes(options);
  await assert.rejects(readFile(compiled.declarationPath, 'utf8'));
  assert.equal(await readFile(join(dirname(compiled.declarationPath), 'keep.txt'), 'utf8'), 'keep');
  assert.throws(() => cleanMarkupRefTypes({ rootDir, refTypesDir: rootDir }), /must stay inside rootDir/);
  assert.equal(getRefTypesPath(xmlFile, options), compiled.declarationPath);
});

test('recursively generates ref declarations for a source directory', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-generate-refs-'));
  const sourceDir = join(rootDir, 'src');
  await mkdir(join(sourceDir, 'nested'), { recursive: true });
  await writeFile(join(sourceDir, 'Main.xml'), '<Container><Text id="title" /></Container>');
  await writeFile(join(sourceDir, 'nested', 'Panel.xml'), '<Container><Graphics id="icon" /></Container>');
  await writeFile(join(sourceDir, 'ignored.txt'), '<Container />');

  const declarations = generateMarkupRefTypes(sourceDir, {
    rootDir,
    refTypesDir: '.generated/types',
  });

  assert.equal(declarations.length, 2);
  assert.match(await readFile(join(rootDir, '.generated/types/src/Main.refs.d.ts'), 'utf8'), /readonly "title"/);
  assert.match(await readFile(join(rootDir, '.generated/types/src/nested/Panel.refs.d.ts'), 'utf8'), /readonly "icon"/);
});

test('Webpack transform loader injects the matching XML template', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-webpack-'));
  const resourcePath = join(directory, 'Panel.ts');
  await writeFile(join(directory, 'Panel.xml'), '<Container />');
  const source = "import { MarkupContainer } from 'pixi-layout-markup'; export class Panel extends MarkupContainer {}";
  const require = createRequire(import.meta.url);
  const loader = require('../webpack-transform-loader.cjs');
  const dependencies = [];
  const code = await new Promise((resolve, reject) => loader.call({
    resourcePath,
    addDependency: (file) => dependencies.push(file),
    async: () => (error, output) => error ? reject(error) : resolve(output),
  }, source));
  assert.match(code, /import __PanelMarkupTemplate from '.\/Panel.xml'/);
  assert.match(code, /super\(\); this\.applyMarkup\(__PanelMarkupTemplate\)/);
  assert.deepEqual(dependencies, [join(directory, 'Panel.xml')]);
});
