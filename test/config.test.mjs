import assert from 'node:assert/strict';
import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  defineMarkupConfig,
  findMarkupConfig,
  loadMarkupConfig,
  resolveMarkupConfig,
} from '../dist/config.js';

test('loads a TypeScript project config and removes its temporary module', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-config-'));
  const configPath = join(directory, 'pixi-layout-markup.config.ts');
  await writeFile(configPath, `export default {
    sourceDir: 'source',
    componentDirs: ['source/ui'],
    refTypesDir: '.generated/types',
    namespaces: { shared: { directory: 'source/shared' } },
  };`, 'utf8');

  assert.equal(findMarkupConfig(directory), configPath);
  const loaded = await loadMarkupConfig({ cwd: directory });
  assert.equal(loaded.path, configPath);
  assert.equal(loaded.config.rootDir, directory);
  assert.deepEqual(loaded.config.componentDirs, ['source/ui']);
  assert.deepEqual(await readdir(directory), ['pixi-layout-markup.config.ts']);
});

test('merges explicit options over project config without dropping namespace entries', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-config-merge-'));
  await writeFile(join(directory, 'pixi-layout-markup.config.json'), JSON.stringify({
    generateRefTypes: true,
    namespaces: { shared: { directory: 'src/shared' }, company: '@company/ui' },
  }), 'utf8');

  const loaded = await resolveMarkupConfig({
    generateRefTypes: false,
    namespaces: { local: { directory: 'src/local' } },
  }, { cwd: directory });
  assert.equal(loaded.config.generateRefTypes, false);
  assert.deepEqual(Object.keys(loaded.config.namespaces).sort(), ['company', 'local', 'shared']);
});

test('can disable config discovery and define typed configs without changing values', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-config-disabled-'));
  await writeFile(join(directory, 'pixi-layout-markup.config.json'), '{"cleanRefTypes":true}', 'utf8');
  const loaded = await loadMarkupConfig({ cwd: directory, configFile: false });
  assert.deepEqual(loaded, { config: {} });
  assert.deepEqual(defineMarkupConfig({ sourceDir: 'src' }), { sourceDir: 'src' });
});
