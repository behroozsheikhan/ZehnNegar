import { describe, expect, it } from 'vitest';
import { enTranslations, faTranslations } from './index';
import { formatPercent, sanitizeIntegerInput } from '../digits';

const translations = { fa: faTranslations, en: enTranslations };

const PERSIAN_LETTER = /[\u0600-\u06FF]/;
// کلیدهایی که عمداً لاتین می‌مانند (نام قالب/زبان).
const LATIN_ON_PURPOSE = new Set([
  'menu.exportImage.svg',
  'menu.exportImage.png',
  'menu.exportImage.jpg',
  'language.english',
  'general.copyToClipboard.svg',
  'general.copyToClipboard.png',
  'menu.github',
]);

describe('ترجمه‌ها', () => {
  it('فقط فارسی و انگلیسی وجود دارد', () => {
    expect(Object.keys(translations).sort()).toEqual(['en', 'fa']);
  });

  it('فارسی و انگلیسی کلیدهای یکسان دارند و هیچ مقداری خالی نیست', () => {
    expect(Object.keys(translations.fa).sort()).toEqual(Object.keys(translations.en).sort());
    for (const [key, value] of Object.entries(translations.fa)) {
      expect(value.trim(), key).not.toBe('');
    }
  });

  it('هر متن فارسی واقعاً فارسی است', () => {
    const untranslated = Object.entries(translations.fa)
      .filter(([key, value]) => !LATIN_ON_PURPOSE.has(key) && !PERSIAN_LETTER.test(value))
      .map(([key]) => key);
    expect(untranslated).toEqual([]);
  });

  it('هیچ متن چینی/روسی از نسخهٔ اصلی باقی نمانده است', () => {
    const leftovers = /[\u4E00-\u9FFF\u0400-\u04FF]/;
    for (const language of ['fa', 'en'] as const) {
      for (const [key, value] of Object.entries(translations[language])) {
        expect(leftovers.test(value), `${language}:${key}`).toBe(false);
      }
    }
  });

  it('متن فارسی از «ي» و «ك» عربی استفاده نمی‌کند', () => {
    for (const [key, value] of Object.entries(translations.fa)) {
      expect(/[\u064A\u0643]/.test(value), key).toBe(false);
    }
  });

  it('چند متن کلیدی', () => {
    expect(translations.fa['menu.open']).toBe('باز کردن…');
    expect(translations.fa['menu.saveFile']).toBe('ذخیره');
    expect(translations.fa['general.undo']).toBe('واگرد');
    expect(translations.fa['language.persian']).toBe('فارسی');
    expect(translations.fa['menu.about']).toBe('دربارهٔ ذهن‌نگار');
  });
});

describe('نمایش اعداد', () => {
  it('درصد بزرگ‌نمایی', () => {
    expect(formatPercent(120, 'fa')).toBe('۱۲۰٪');
    expect(formatPercent(120, 'en')).toBe('120%');
  });

  it('ورودی عددی با ارقام فارسی یا عربی پذیرفته می‌شود', () => {
    expect(sanitizeIntegerInput('۲۴')).toBe('24');
    expect(sanitizeIntegerInput('٣٦px')).toBe('36');
    expect(sanitizeIntegerInput('۱۲.۵')).toBe('125');
    expect(sanitizeIntegerInput('الف')).toBe('');
  });
});
