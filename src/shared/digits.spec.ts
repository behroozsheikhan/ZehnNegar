import { describe, expect, it } from 'vitest';
import { formatDigits, normalizeDigits, parseLocalizedNumber, toPersianDigits } from './digits';

describe('normalizeDigits', () => {
  it('ارقام فارسی را به لاتین تبدیل می‌کند', () => {
    expect(normalizeDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });

  it('ارقام عربی را به لاتین تبدیل می‌کند', () => {
    expect(normalizeDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('متن مخلوط را فقط در ارقام تغییر می‌دهد', () => {
    expect(normalizeDigits('اندازهٔ قلم ۱۴ و بزرگ‌نمایی ٪۱۲۰')).toBe('اندازهٔ قلم 14 و بزرگ‌نمایی ٪120');
    expect(normalizeDigits('Version 2 — نسخهٔ ۲')).toBe('Version 2 — نسخهٔ 2');
  });

  it('ممیز فارسی را به نقطه تبدیل و جداکنندهٔ هزارگان را حذف می‌کند', () => {
    expect(normalizeDigits('۱٬۲۳۴٫۵')).toBe('1234.5');
  });

  it('رشتهٔ خالی و بدون رقم را دست‌نخورده برمی‌گرداند', () => {
    expect(normalizeDigits('')).toBe('');
    expect(normalizeDigits('ذهن‌نگار')).toBe('ذهن‌نگار');
  });
});

describe('toPersianDigits / formatDigits', () => {
  it('ارقام لاتین را برای نمایش فارسی می‌کند', () => {
    expect(toPersianDigits(1405)).toBe('۱۴۰۵');
    expect(toPersianDigits('1.0.0')).toBe('۱.۰.۰');
    expect(toPersianDigits('Ctrl+0')).toBe('Ctrl+۰');
  });

  it('رفت‌وبرگشت بدون تغییر است', () => {
    expect(normalizeDigits(toPersianDigits('0123456789'))).toBe('0123456789');
  });

  it('در زبان انگلیسی ارقام لاتین می‌مانند', () => {
    expect(formatDigits(120, 'en')).toBe('120');
    expect(formatDigits(120, 'fa')).toBe('۱۲۰');
  });
});

describe('parseLocalizedNumber', () => {
  it('ورودی فارسی، عربی و لاتین را به عدد تبدیل می‌کند', () => {
    expect(parseLocalizedNumber('۱۴')).toBe(14);
    expect(parseLocalizedNumber('٣٦')).toBe(36);
    expect(parseLocalizedNumber('48')).toBe(48);
    expect(parseLocalizedNumber(' ۱۲٫۵ ')).toBe(12.5);
    expect(parseLocalizedNumber('-۳')).toBe(-3);
  });

  it('ورودی نامعتبر null می‌شود', () => {
    expect(parseLocalizedNumber('')).toBeNull();
    expect(parseLocalizedNumber('دوازده')).toBeNull();
    expect(parseLocalizedNumber('۱۲px')).toBeNull();
    expect(parseLocalizedNumber('۱.۲.۳')).toBeNull();
  });
});
