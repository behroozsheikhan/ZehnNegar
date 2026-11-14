/**
 * دسترسی renderer به main فقط از راه `window.api` (ساختهٔ preload) است.
 * در حالت VITE_API_MOCK=1 (پیش‌نمایش مرورگر) یک پیاده‌سازی درون‌حافظه‌ای جایگزین می‌شود.
 */
import type { ZehnApi } from '@shared/ipc';

export async function resolveApi(): Promise<ZehnApi> {
  if (window.api) {
    return window.api;
  }
  if (import.meta.env.VITE_API_MOCK === '1') {
    // import پویا: این ماژول در بستهٔ نهایی برنامه قرار نمی‌گیرد.
    const { createMockApi } = await import('./mock-api');
    const api = createMockApi();
    window.api = api;
    return api;
  }
  throw new Error('window.api is not available (preload did not run)');
}
