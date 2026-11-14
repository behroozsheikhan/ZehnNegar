import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../shared/ipc';
import { InMemoryRepository } from './repository';
import { isUiLanguage, sanitizeSettings, SettingsService } from './settings';

describe('SettingsService', () => {
  it('پیش‌فرض: زبان فارسی', () => {
    const service = new SettingsService(new InMemoryRepository());
    expect(service.get()).toEqual(DEFAULT_SETTINGS);
    expect(service.get().language).toBe('fa');
  });

  it('تغییر جزئی ذخیره می‌شود و بقیهٔ مقدارها می‌مانند', () => {
    const repository = new InMemoryRepository();
    const service = new SettingsService(repository);
    service.update({ exportTransparent: true });
    service.update({ language: 'en' });
    expect(new SettingsService(repository).get()).toEqual({
      ...DEFAULT_SETTINGS,
      language: 'en',
      exportTransparent: true,
    });
  });

  it('مقدار نامعتبر نادیده گرفته می‌شود', () => {
    const service = new SettingsService(new InMemoryRepository());
    service.update({ language: 'en' });
    const next = service.update({ language: 'zh', copyTransparent: 'بله', extra: 1 });
    expect(next.language).toBe('en');
    expect(next.copyTransparent).toBe(false);
    expect(next).not.toHaveProperty('extra');
    expect(service.update(null)).toEqual(next);
    expect(service.update('fa')).toEqual(next);
  });

  it('دادهٔ خراب در دیتابیس به پیش‌فرض برمی‌گردد', () => {
    const repository = new InMemoryRepository();
    repository.setSetting('settings', '{خراب');
    expect(new SettingsService(repository).get()).toEqual(DEFAULT_SETTINGS);
  });

  it('وضعیت ابزارها به‌صورت JSON نگه داشته می‌شود', () => {
    const service = new SettingsService(new InMemoryRepository());
    const toolState = { pointer: 'mind', freehand: { strokeWidth: 4 } };
    expect(service.update({ toolState }).toolState).toEqual(toolState);
  });
});

describe('sanitizeSettings', () => {
  it('وضعیت ابزار بسیار بزرگ را نمی‌پذیرد', () => {
    const huge = { data: 'x'.repeat(70 * 1024) };
    expect(sanitizeSettings({ toolState: huge }).toolState).toBeNull();
  });

  it('فقط fa و en زبان معتبرند', () => {
    expect(isUiLanguage('fa')).toBe(true);
    expect(isUiLanguage('en')).toBe(true);
    expect(isUiLanguage('ar')).toBe(false);
    expect(isUiLanguage(undefined)).toBe(false);
  });
});
