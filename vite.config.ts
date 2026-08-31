import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts', vite: 'src/vite.ts', core: 'src/core.ts',
        rollup: 'src/rollup.ts', esbuild: 'src/esbuild.ts', bun: 'src/bun.ts',
        cli: 'src/cli.ts', compiler: 'src/compiler.ts', config: 'src/config.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['pixi.js', '@pixi/layout', '@pixi/layout/components', 'typescript', 'vite', 'node:fs', 'node:fs/promises', 'node:path', 'node:url', 'source-map-js'],
      output: { entryFileNames: '[name].js' },
    },
    sourcemap: true,
  },
});
