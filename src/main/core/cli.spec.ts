import { describe, expect, it } from 'vitest';
import { findDocumentArgument, isSafeExternalUrl } from './cli';

describe('findDocumentArgument', () => {
  it('مسیر پروندهٔ دوبارکلیک‌شده را پیدا می‌کند', () => {
    expect(
      findDocumentArgument(['C:\\Program Files\\ZehnNegar\\ZehnNegar.exe', 'C:\\اسناد\\برنامهٔ سفر.drawnix'])
    ).toBe('C:\\اسناد\\برنامهٔ سفر.drawnix');
  });

  it('سوییچ‌ها و آرگومان‌های دیگر را نادیده می‌گیرد', () => {
    expect(
      findDocumentArgument(['electron', '--no-sandbox', '.', '--lang=fa', '"D:\\طرح نهایی.DRAWNIX"'])
    ).toBe('D:\\طرح نهایی.DRAWNIX');
  });

  it('خودِ برنامه (آرگومان اول) هرگز سند حساب نمی‌شود', () => {
    expect(findDocumentArgument(['C:\\odd\\app.drawnix'])).toBeNull();
    expect(findDocumentArgument(['app.exe', '', '--flag', 'notes.txt'])).toBeNull();
    expect(findDocumentArgument([])).toBeNull();
  });
});

describe('isSafeExternalUrl', () => {
  it('فقط http، https و mailto مجازند', () => {
    expect(isSafeExternalUrl('https://github.com/plait-board/drawnix')).toBe(true);
    expect(isSafeExternalUrl('http://example.com')).toBe(true);
    expect(isSafeExternalUrl('mailto:someone@example.com')).toBe(true);
    expect(isSafeExternalUrl('file:///C:/Windows/System32/calc.exe')).toBe(false);
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeExternalUrl('ms-settings:privacy')).toBe(false);
    expect(isSafeExternalUrl('نشانی نامعتبر')).toBe(false);
  });
});
