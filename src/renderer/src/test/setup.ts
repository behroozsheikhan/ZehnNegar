/**
 * آماده‌سازی تست‌های رابط: سند HTML مثل برنامهٔ واقعی فارسی و راست‌به‌چپ است.
 */
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  document.documentElement.lang = 'fa';
  document.documentElement.dir = 'rtl';
});

afterEach(() => {
  cleanup();
});
