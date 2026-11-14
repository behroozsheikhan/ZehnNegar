/**
 * پیکربندی Vite فقط برای renderer — برای پیش‌نمایش در مرورگر (`npm run preview:web`).
 * در این حالت preload وجود ندارد و با VITE_API_MOCK=1 یک API درون‌حافظه‌ای جایگزین می‌شود.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { rendererAlias, rendererRoot } from './renderer.shared.mts';

export default defineConfig({
  root: rendererRoot,
  resolve: { alias: rendererAlias },
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    outDir: '../../dist/web-preview',
    emptyOutDir: true,
  },
});
