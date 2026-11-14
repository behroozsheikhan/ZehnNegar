import { describe, expect, it } from 'vitest';
import { getStrings } from './strings';

type Tree = { [key: string]: unknown };

/** مسیر همهٔ برگ‌ها، با نوع هر برگ (رشته، آرایه یا تابع). */
function shape(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) return [`${path}[]`];
  if (typeof value === 'function') return [`${path}()`];
  if (value && typeof value === 'object') {
    return Object.keys(value as Tree)
      .sort()
      .flatMap((key) => shape((value as Tree)[key], path ? `${path}.${key}` : key));
  }
  return [path];
}

function leaves(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(leaves);
  if (value && typeof value === 'object') return Object.values(value as Tree).flatMap(leaves);
  return [];
}

describe('متن‌های پوستهٔ برنامه', () => {
  const fa = getStrings('fa');
  const en = getStrings('en');

  it('فارسی و انگلیسی دقیقاً کلیدهای یکسان دارند', () => {
    expect(shape(fa)).toEqual(shape(en));
  });

  it('هیچ متنی خالی نیست', () => {
    for (const text of [...leaves(fa), ...leaves(en)]) {
      expect(text.trim()).not.toBe('');
    }
  });

  it('متن‌های فارسی حرف فارسی دارند و از ي و ك عربی استفاده نمی‌کنند', () => {
    for (const text of leaves(fa)) {
      // نشانی‌ها و نام‌های خاص (مثل Drawnix) استثنا هستند.
      if (/^(https?:|[A-Za-z0-9 .:/()-]+$)/.test(text)) continue;
      expect(text, text).toMatch(/[\u0600-\u06FF]/);
      expect(text, text).not.toMatch(/[\u064A\u0643]/);
    }
  });

  it('متن‌های فارسی سه‌نقطهٔ یونیکد دارند، نه سه نقطهٔ جدا', () => {
    for (const text of leaves(fa)) {
      expect(text, text).not.toContain('...');
    }
  });

  it('متن‌های انگلیسی حرف فارسی ندارند (به‌جز نام برنامه)', () => {
    for (const text of leaves(en)) {
      expect(text.replace(/ذهن‌نگار/g, ''), text).not.toMatch(/[\u0600-\u06FF]/);
    }
  });
});
