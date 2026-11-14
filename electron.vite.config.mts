import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { rendererAlias } from './renderer.shared.mts';

const sharedAlias = { '@shared': resolve(import.meta.dirname, 'src/shared') };

export default defineConfig({
  main: {
    resolve: { alias: sharedAlias },
  },
  preload: {
    resolve: { alias: sharedAlias },
    build: {
      // preload با sandbox:true باید یک فایل CommonJS تک‌پارچه باشد.
      rollupOptions: { output: { format: 'cjs', entryFileNames: 'index.js' } },
    },
  },
  renderer: {
    resolve: { alias: rendererAlias },
    plugins: [react()],
    build: {
      commonjsOptions: { transformMixedEsModules: true },
    },
  },
});
