import type { Plugin } from 'vite';
import { resolveMarkupConfig } from './config';
import {
  cleanMarkupRefTypes,
  compileMarkupFile,
  compileMarkupClass,
  removeMarkupRefTypes,
  writeMarkupRefTypes,
  type MarkupBuildOptions,
} from './core';

export function pixiLayoutMarkup(options: MarkupBuildOptions = {}): Plugin {
  let resolvedOptionsPromise = resolveMarkupConfig(options);
  let configPath: string | undefined;
  return {
    name: 'pixi-layout-markup',
    enforce: 'pre',
    async configResolved(config) {
      resolvedOptionsPromise = resolveMarkupConfig(options, { cwd: config.root });
      configPath = (await resolvedOptionsPromise).path;
    },
    async buildStart() {
      const { config, path } = await resolvedOptionsPromise;
      configPath ??= path;
      if (configPath) this.addWatchFile(configPath);
      if (config.cleanRefTypes) cleanMarkupRefTypes(config);
    },
    async configureServer(server) {
      const { config, path } = await resolvedOptionsPromise;
      configPath ??= path;
      if (configPath) {
        server.watcher.add(configPath);
        server.watcher.on('change', (fileName) => {
          if (fileName === configPath) void server.restart();
        });
      }
      server.watcher.on('unlink', (fileName) => {
        if (fileName.endsWith('.xml')) removeMarkupRefTypes(fileName, config);
      });
    },
    async transform(source, id) {
      const { config } = await resolvedOptionsPromise;
      const queryIndex = id.indexOf('?');
      if (queryIndex >= 0) return null;
      const fileName = id;
      if (fileName.endsWith('.xml')) {
        const compiled = compileMarkupFile(source, fileName, config);
        writeMarkupRefTypes(compiled);
        return {
          code: compiled.code,
          map: compiled.map,
        };
      }
      if (!fileName.endsWith('.ts') || fileName.endsWith('.d.ts')) return null;
      const code = compileMarkupClass(source, fileName);
      return code ? { code, map: null } : null;
    },
  };
}
