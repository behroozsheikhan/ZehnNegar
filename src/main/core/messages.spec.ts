import { describe, expect, it } from 'vitest';
import { getMessages } from './messages';

describe('getMessages', () => {
  it('فارسی و انگلیسی کلیدهای یکسان دارند و هیچ متنی خالی نیست', () => {
    const fa = getMessages('fa');
    const en = getMessages('en');
    expect(Object.keys(fa).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of Object.entries(fa)) {
      if (typeof value === 'string') {
        expect(value.trim(), key).not.toBe('');
      }
    }
    expect(Object.keys(fa.errors).sort()).toEqual(Object.keys(en.errors).sort());
  });

  it('پیام تغییرات ذخیره‌نشده نام سند را در گیومهٔ فارسی می‌گذارد', () => {
    expect(getMessages('fa').unsavedMessage('سفر نوروزی')).toBe('تغییرات «سفر نوروزی» ذخیره شود؟');
    expect(getMessages('en').unsavedMessage('Trip')).toContain('Trip');
  });

  it('نام برنامه', () => {
    expect(getMessages('fa').appName).toBe('ذهن‌نگار');
    expect(getMessages('en').appName).toBe('ZehnNegar');
  });
});
