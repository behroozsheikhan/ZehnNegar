import { describe, expect, it } from 'vitest';
import { localizeTypedDigits } from './typed-digits';

describe('localizeTypedDigits', () => {
  it('پس از متن فارسی، رقم تایپ‌شده فارسی می‌شود', () => {
    expect(localizeTypedDigits('1', 'هزینه ')).toBe('۱');
    expect(localizeTypedDigits('0123456789', 'شماره: ')).toBe('۰۱۲۳۴۵۶۷۸۹');
  });

  it('وقتی پیش از رقم هیچ حرفی نیست، رقم فارسی می‌شود', () => {
    expect(localizeTypedDigits('2026')).toBe('۲۰۲۶');
    expect(localizeTypedDigits('5', '')).toBe('۵');
    expect(localizeTypedDigits('3', '۱۲')).toBe('۳');
    expect(localizeTypedDigits('7', '(+ ')).toBe('۷');
  });

  it('پس از حرف لاتین، رقم دست‌نخورده می‌ماند', () => {
    expect(localizeTypedDigits('5', 'iPhone 1')).toBe('5');
    expect(localizeTypedDigits('2', 'نسخهٔ v')).toBe('2');
    expect(localizeTypedDigits('2026', 'Reading list ')).toBe('2026');
  });

  it('نزدیک‌ترین حرف ملاک است، نه اولین حرف متن', () => {
    expect(localizeTypedDigits('1404', 'نسخهٔ v2 سال ')).toBe('۱۴۰۴');
    expect(localizeTypedDigits('3', 'کتاب\nChapter ')).toBe('3');
    expect(localizeTypedDigits('3', 'Chapter\nفصل ')).toBe('۳');
  });

  it('نشانه‌ها، فاصله و رقم‌های قبلی زمینه را عوض نمی‌کنند', () => {
    expect(localizeTypedDigits('5', 'قیمت: ۱۲.')).toBe('۵');
    expect(localizeTypedDigits('5', 'قیمت، ')).toBe('۵');
    expect(localizeTypedDigits('5', 'Price: 12.')).toBe('5');
  });

  it('در متنی که یک‌جا درج می‌شود، زمینه حرف‌به‌حرف دنبال می‌شود', () => {
    expect(localizeTypedDigits('سال 1404 و v2 سپس 3')).toBe('سال ۱۴۰۴ و v2 سپس ۳');
    expect(localizeTypedDigits('12 apples 3', '')).toBe('۱۲ apples 3');
    expect(localizeTypedDigits('12:30', 'ساعت ')).toBe('۱۲:۳۰');
  });

  it('خط‌های غیر فارسی دیگر (سیریلیک، چینی و …) مثل لاتین رفتار می‌کنند', () => {
    expect(localizeTypedDigits('5', 'Версия ')).toBe('5');
    expect(localizeTypedDigits('5', '版本')).toBe('5');
  });

  it('متن بدون رقم و رقم‌های فارسی/عربیِ موجود دست‌نخورده می‌مانند', () => {
    expect(localizeTypedDigits('سلام', 'abc')).toBe('سلام');
    expect(localizeTypedDigits('۱۲٣', 'abc')).toBe('۱۲٣');
    expect(localizeTypedDigits('', 'abc')).toBe('');
  });
});
