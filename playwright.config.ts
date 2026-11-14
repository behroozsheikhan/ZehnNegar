import { defineConfig } from '@playwright/test';

/**
 * تست‌های e2e روی برنامهٔ واقعیِ Electron (خروجی `npm run build`).
 * اجرا: npm run build && npm run test:e2e   (در لینوکس زیر xvfb)
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  outputDir: 'test-results',
  // هر تست برنامه را با پوشهٔ دادهٔ جدا اجرا می‌کند؛ اجرای پشت‌سرهم پایدارتر است.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // در CI گزارش JSON را scripts/ci-e2e-report.mjs به annotation تبدیل می‌کند.
  reporter: process.env.CI
    ? [['line'], ['json', { outputFile: 'e2e-artifacts/report.json' }], ['html', { open: 'never' }]]
    : 'line',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
