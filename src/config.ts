import { existsSync } from 'node:fs';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import type { MarkupBuildOptions } from './core';

const CONFIG_NAMES = [
  'pixi-layout-markup.config.ts',
  'pixi-layout-markup.config.mjs',
  'pixi-layout-markup.config.js',
  'pixi-layout-markup.config.cjs',
  'pixi-layout-markup.config.json',
] as const;

export interface LoadMarkupConfigOptions {
  cwd?: string;
  configFile?: string | false;
}

export interface LoadedMarkupConfig {
  config: MarkupBuildOptions;
  path?: string;
}

export function defineMarkupConfig<T extends MarkupBuildOptions>(config: T): T {
  return config;
}

export function findMarkupConfig(
  cwd = process.cwd(),
  configFile?: string | false,
): string | undefined {
  if (configFile === false) return undefined;
  if (typeof configFile === 'string') {
    const explicit = isAbsolute(configFile) ? configFile : resolve(cwd, configFile);
    if (!existsSync(explicit)) throw new Error(`Markup config file does not exist: ${explicit}`);
    return explicit;
  }
  return CONFIG_NAMES.map((name) => resolve(cwd, name)).find(existsSync);
}

export async function loadMarkupConfig(
  options: LoadMarkupConfigOptions = {},
): Promise<LoadedMarkupConfig> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const path = findMarkupConfig(cwd, options.configFile);
  if (!path) return { config: {} };
  const loaded = await loadConfigModule(path);
  if (!loaded || typeof loaded !== 'object' || Array.isArray(loaded)) {
    throw new Error(`Markup config must export an object: ${path}`);
  }
  const config = loaded as MarkupBuildOptions;
  const configDirectory = dirname(path);
  return {
    path,
    config: {
      ...config,
      rootDir: resolve(configDirectory, config.rootDir ?? '.'),
      configFile: path,
    },
  };
}

export async function resolveMarkupConfig(
  overrides: MarkupBuildOptions = {},
  options: { cwd?: string } = {},
): Promise<LoadedMarkupConfig> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const loaded = await loadMarkupConfig({ cwd, configFile: overrides.configFile });
  const explicit = withoutUndefined(overrides);
  const config = mergeMarkupConfig(loaded.config, explicit);
  config.rootDir = resolve(cwd, explicit.rootDir ?? config.rootDir ?? '.');
  return { config, path: loaded.path };
}

export function mergeMarkupConfig(
  base: MarkupBuildOptions,
  overrides: MarkupBuildOptions,
): MarkupBuildOptions {
  return {
    ...base,
    ...withoutUndefined(overrides),
    components: mergeRecords(base.components, overrides.components),
    namespaces: mergeRecords(base.namespaces, overrides.namespaces),
    componentMetadata: mergeRecords(base.componentMetadata, overrides.componentMetadata),
  };
}

async function loadConfigModule(path: string): Promise<unknown> {
  const extension = extname(path).toLowerCase();
  if (extension === '.json') return JSON.parse(await readFile(path, 'utf8')) as unknown;
  if (extension !== '.ts') {
    const module = await import(`${pathToFileURL(path).href}?t=${Date.now()}`) as { default?: unknown };
    return module.default ?? module;
  }

  const source = await readFile(path, 'utf8');
  const output = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    reportDiagnostics: true,
  });
  const errors = output.diagnostics?.filter((diagnostic) =>
    diagnostic.category === ts.DiagnosticCategory.Error) ?? [];
  if (errors.length > 0) {
    const message = ts.formatDiagnostics(errors, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => dirname(path),
      getNewLine: () => '\n',
    });
    throw new Error(`Cannot compile markup config ${path}:\n${message}`);
  }

  const temporaryPath = `${path}.${process.pid}-${Date.now()}.mjs`;
  await writeFile(temporaryPath, output.outputText, 'utf8');
  try {
    const module = await import(`${pathToFileURL(temporaryPath).href}?t=${Date.now()}`) as { default?: unknown };
    return module.default ?? module;
  } finally {
    await unlink(temporaryPath).catch(() => undefined);
  }
}

function mergeRecords<T>(
  base: Record<string, T> | undefined,
  overrides: Record<string, T> | undefined,
): Record<string, T> | undefined {
  if (!base && !overrides) return undefined;
  return { ...base, ...overrides };
}

function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}
