import { describe, expect, it } from 'vitest';
import { getLatinKey, isModCode } from './with-hotkey';

const key = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init);

describe('میان‌برهای مستقل از چیدمان صفحه‌کلید', () => {
  it('با چیدمان فارسی، حرف لاتینِ کلید فیزیکی برمی‌گردد', () => {
    // کلید H در چیدمان فارسی «ا» می‌دهد.
    expect(getLatinKey(key({ key: 'ا', code: 'KeyH' }))).toBe('h');
    expect(getLatinKey(key({ key: 'پ', code: 'KeyM' }))).toBe('m');
    expect(getLatinKey(key({ key: 'ر', code: 'KeyV' }))).toBe('v');
  });

  it('با چیدمان لاتین همان حرف تایپ‌شده ملاک است (مثلاً Dvorak)', () => {
    expect(getLatinKey(key({ key: 'h', code: 'KeyJ' }))).toBe('h');
    expect(getLatinKey(key({ key: 'M', code: 'KeyM' }))).toBe('m');
  });

  it('کلیدهای غیرحرفی دست‌نخورده می‌مانند', () => {
    expect(getLatinKey(key({ key: 'Escape', code: 'Escape' }))).toBe('Escape');
    expect(getLatinKey(key({ key: '۱', code: 'Digit1' }))).toBe('۱');
  });

  it('isModCode: Ctrl یا Cmd + کلید فیزیکی، بدون Alt', () => {
    expect(isModCode(key({ key: 'س', code: 'KeyS', ctrlKey: true }), 'KeyS')).toBe(true);
    expect(isModCode(key({ key: 's', code: 'KeyS', metaKey: true }), 'KeyS')).toBe(true);
    expect(isModCode(key({ key: 'س', code: 'KeyS' }), 'KeyS')).toBe(false);
    // AltGr در ویندوز به شکل Ctrl+Alt گزارش می‌شود و نباید میان‌بر حساب شود.
    expect(isModCode(key({ key: 'س', code: 'KeyS', ctrlKey: true, altKey: true }), 'KeyS')).toBe(false);
    expect(isModCode(key({ key: 'س', code: 'KeyS', ctrlKey: true }), 'KeyA')).toBe(false);
  });
});
