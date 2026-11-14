import { describe, expect, it } from 'vitest';
import { isRtlText } from './direction';

describe('isRtlText (جهت متن گره)', () => {
  it('متن فارسی راست‌به‌چپ است', () => {
    expect(isRtlText('نقشهٔ ذهنی')).toBe(true);
  });

  it('متن انگلیسی چپ‌به‌راست است', () => {
    expect(isRtlText('Mind map')).toBe(false);
  });

  it('نخستین حرف قوی جهت را تعیین می‌کند (مثل dir="auto")', () => {
    expect(isRtlText('پروژهٔ React')).toBe(true);
    expect(isRtlText('React در پروژه')).toBe(false);
  });

  it('ارقام، فاصله و نشانه‌های آغاز متن نادیده گرفته می‌شوند', () => {
    expect(isRtlText('۱۴۰۵ — برنامهٔ سال')).toBe(true);
    expect(isRtlText('2026: هدف‌ها')).toBe(true);
    expect(isRtlText('(1) plan')).toBe(false);
    expect(isRtlText('۳ apples')).toBe(false);
  });

  it('متن خالی یا فقط عدد چپ‌به‌راست حساب می‌شود', () => {
    expect(isRtlText('')).toBe(false);
    expect(isRtlText('12345')).toBe(false);
    expect(isRtlText('۱۲۳')).toBe(false);
  });

  it('عربی و عبری هم راست‌به‌چپ‌اند', () => {
    expect(isRtlText('خريطة ذهنية')).toBe(true);
    expect(isRtlText('מפת חשיבה')).toBe(true);
  });
});
