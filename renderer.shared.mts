/**
 * تنظیمات مشترک Vite برای renderer.
 * هم electron-vite (بیلد واقعی) و هم `npm run preview:web` (پیش‌نمایش مرورگر) و Vitest از آن استفاده می‌کنند.
 */
import { resolve } from 'node:path';

const __dirname = import.meta.dirname;

export const rendererRoot = resolve(__dirname, 'src/renderer');

export const rendererAlias = {
  '@renderer': resolve(__dirname, 'src/renderer/src'),
  '@shared': resolve(__dirname, 'src/shared'),
  '@drawnix/drawnix': resolve(__dirname, 'packages/drawnix/src/index.ts'),
  '@plait-board/react-board': resolve(__dirname, 'packages/react-board/src/index.ts'),
  '@plait-board/react-text': resolve(__dirname, 'packages/react-text/src/index.ts'),
};
