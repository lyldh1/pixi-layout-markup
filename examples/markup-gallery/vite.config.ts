import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { pixiLayoutMarkup } from 'pixi-layout-markup/vite';

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      'pixi-layout-markup': resolve(__dirname, '../../dist/index.js'),
    },
  },
  plugins: [pixiLayoutMarkup({
    rootDir: __dirname,
    componentDirs: ['examples'],
    generateRefTypes: false,
  })],
  build: {
    outDir: resolve(__dirname, '../../dist-gallery'),
    emptyOutDir: true,
  },
});
