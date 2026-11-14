/**
 * Vitest:
 *  - `npm test`     → پروژه‌های «node» (منطق خالص main/shared) و «ui» (کامپوننت‌ها با jsdom)
 *  - `npm run test:db` → فقط src/main/db، درون Node خودِ Electron (ELECTRON_RUN_AS_NODE=1)
 *    تا better-sqlite3 با همان ABI برنامهٔ واقعی آزموده شود.
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { rendererAlias } from './renderer.shared.mts';

const DB_TESTS = 'src/main/db/**/*.spec.ts';
/** اجرای درون Electron (یا ZN_DB_TESTS=1 برای اجرای محلی با Node معمولی). */
const dbMode = Boolean(process.versions.electron) || process.env.ZN_DB_TESTS === '1';

export default defineConfig({
  resolve: { alias: rendererAlias },
  plugins: [react()],
  test: dbMode
    ? {
        name: 'db',
        environment: 'node',
        // با `--dir src/main/db` الگوها نسبت به همان پوشه سنجیده می‌شوند.
        include: ['**/*.spec.ts'],
        // ماژول نیتیو در یک پروسه بارگذاری می‌شود.
        pool: 'forks',
      }
    : {
        projects: [
          {
            extends: true,
            test: {
              name: 'node',
              environment: 'node',
              include: [
                'src/main/**/*.spec.ts',
                'src/shared/**/*.spec.ts',
                'scripts/**/*.spec.ts',
              ],
              exclude: [DB_TESTS, 'node_modules/**'],
            },
          },
          {
            extends: true,
            test: {
              name: 'ui',
              environment: 'jsdom',
              globals: true,
              setupFiles: ['src/renderer/src/test/setup.ts'],
              include: ['src/renderer/**/*.spec.{ts,tsx}', 'packages/**/*.spec.{ts,tsx}'],
              css: false,
            },
          },
        ],
      },
});
