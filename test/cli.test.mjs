import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const cliPath = resolve('dist/cli.js');

test('generate-refs works with consumer-project defaults and cleans stale declarations', async () => {
  const projectDir = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-cli-'));
  await mkdir(join(projectDir, 'src', 'ui'), { recursive: true });
  await writeFile(
    join(projectDir, 'src', 'ui', 'Screen.xml'),
    '<Container><Text id="title" /></Container>',
  );
  const stalePath = join(projectDir, '.pixi-layout-markup', 'types', 'stale.refs.d.ts');
  await mkdir(join(projectDir, '.pixi-layout-markup', 'types'), { recursive: true });
  await writeFile(stalePath, 'stale');

  const result = spawnSync(process.execPath, [cliPath, 'generate-refs', '--clean'], {
    cwd: projectDir,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Generated 1 ref declaration/);
  assert.match(
    await readFile(join(projectDir, '.pixi-layout-markup/types/src/ui/Screen.refs.d.ts'), 'utf8'),
    /readonly "title"/,
  );
  await assert.rejects(readFile(stalePath, 'utf8'));
});

test('generate-refs resolves file-local relative XML namespaces', async () => {
  const projectDir = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-cli-namespace-'));
  const uiDir = join(projectDir, 'src', 'ui');
  const childrenDir = join(uiDir, 'childrenui');
  await mkdir(childrenDir, { recursive: true });
  await writeFile(
    join(childrenDir, 'ActionButton.ts'),
    'export class ActionButton {}',
    'utf8',
  );
  await writeFile(
    join(childrenDir, 'ActionButton.xml'),
    '<LayoutContainer><Text id="label" /></LayoutContainer>',
    'utf8',
  );
  await writeFile(
    join(uiDir, 'GameUI.xml'),
    '<LayoutContainer xmlns:child="./childrenui"><child:ActionButton id="startButton" /></LayoutContainer>',
    'utf8',
  );

  const result = spawnSync(process.execPath, [cliPath, 'generate-refs'], {
    cwd: projectDir,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Generated 2 ref declaration/);
  const declaration = await readFile(
    join(projectDir, '.pixi-layout-markup/types/src/ui/GameUI.refs.d.ts'),
    'utf8',
  );
  assert.match(declaration, /ActionButton/);
  assert.match(declaration, /readonly "startButton"/);
});

test('generate-refs automatically loads the shared project config', async () => {
  const projectDir = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-cli-config-'));
  const uiDir = join(projectDir, 'source');
  const componentsDir = join(projectDir, 'components');
  await mkdir(uiDir, { recursive: true });
  await mkdir(componentsDir, { recursive: true });
  await writeFile(join(componentsDir, 'ActionButton.ts'), 'export class ActionButton {}', 'utf8');
  await writeFile(
    join(uiDir, 'GameUI.xml'),
    '<LayoutContainer><child:ActionButton id="startButton" /></LayoutContainer>',
    'utf8',
  );
  await writeFile(
    join(projectDir, 'pixi-layout-markup.config.mjs'),
    `export default {
      sourceDir: 'source',
      componentDirs: ['components'],
      namespaces: { child: { directory: 'components' } },
      refTypesDir: '.generated/types',
    };`,
    'utf8',
  );

  const result = spawnSync(process.execPath, [cliPath, 'generate-refs'], {
    cwd: projectDir,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Generated 1 ref declaration/);
  assert.match(
    await readFile(join(projectDir, '.generated/types/source/GameUI.refs.d.ts'), 'utf8'),
    /readonly "startButton"/,
  );
});
