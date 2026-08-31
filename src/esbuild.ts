import { readFile } from 'node:fs/promises';
import { resolveMarkupConfig } from './config';
import {
  compileMarkupFile,
  compileMarkupClass,
  writeMarkupRefTypes,
  type MarkupBuildOptions,
} from './core';

interface EsbuildResult {
  contents: string;
  loader: 'js' | 'ts';
}

interface EsbuildApi {
  initialOptions: { absWorkingDir?: string };
  onLoad(
    options: { filter: RegExp },
    callback: (args: { path: string }) => Promise<EsbuildResult | null>,
  ): void;
}

export interface PixiLayoutMarkupEsbuildPlugin {
  name: string;
  setup(build: EsbuildApi): void;
}

export function pixiLayoutMarkupEsbuild(
  options: MarkupBuildOptions = {},
): PixiLayoutMarkupEsbuildPlugin {
  return {
    name: 'pixi-layout-markup',
    setup(build) {
      const cwd = build.initialOptions.absWorkingDir ?? process.cwd();
      const resolved = resolveMarkupConfig(options, { cwd });
      build.onLoad({ filter: /\.xml$/ }, async ({ path }) => {
        const { config } = await resolved;
        const compiled = compileMarkupFile(await readFile(path, 'utf8'), path, config);
        writeMarkupRefTypes(compiled);
        const encodedMap = Buffer.from(JSON.stringify(compiled.map), 'utf8').toString('base64');
        return {
          contents: `${compiled.code}\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${encodedMap}`,
          loader: 'js',
        };
      });
      build.onLoad({ filter: /\.tsx?$/ }, async ({ path }) => {
        if (path.endsWith('.d.ts')) return null;
        const source = await readFile(path, 'utf8');
        const code = compileMarkupClass(source, path);
        return code ? { contents: code, loader: 'ts' } : null;
      });
    },
  };
}
