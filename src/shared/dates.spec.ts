import { describe, expect, it } from 'vitest';
import { formatDate, nowIso } from './dates';
import { normalizeDigits } from './digits';

describe('formatDate', () => {
  // ۲۰ مارس ۲۰۲۶ (ظهر UTC) = ۲۹ اسفند ۱۴۰۴ — در هر منطقهٔ زمانی همان روز است.
  const iso = '2026-03-20T12:00:00.000Z';

  it('در زبان فارسی تاریخ شمسی با ارقام فارسی می‌دهد', () => {
    const text = formatDate(iso, 'fa', false);
    expect(text).toContain('اسفند');
    expect(text).toContain('۱۴۰۴');
    expect(text).toContain('۲۹');
    expect(text).not.toMatch(/[0-9]/);
  });

  it('نوروز ۱۴۰۵ را درست تبدیل می‌کند', () => {
    const text = formatDate('2026-03-21T12:00:00.000Z', 'fa', false);
    expect(text).toContain('فروردین');
    expect(normalizeDigits(text)).toContain('1405');
  });

  it('با ساعت، ساعت و دقیقه هم نمایش داده می‌شود', () => {
    const text = formatDate(iso, 'fa');
    expect(text).toMatch(/[۰-۹]{1,2}:[۰-۹]{2}/);
  });

  it('در زبان انگلیسی تاریخ میلادی با ارقام لاتین می‌دهد', () => {
    const text = formatDate(iso, 'en', false);
    expect(text).toContain('March');
    expect(text).toContain('2026');
  });

  it('ورودی نامعتبر رشتهٔ خالی می‌شود', () => {
    expect(formatDate('دیروز', 'fa')).toBe('');
    expect(formatDate('', 'en')).toBe('');
  });
});

describe('nowIso', () => {
  it('ISO-8601 در UTC با ارقام لاتین برمی‌گرداند (قالب ذخیره در دیتابیس)', () => {
    const value = nowIso(new Date(Date.UTC(2026, 2, 21, 8, 30, 0)));
    expect(value).toBe('2026-03-21T08:30:00.000Z');
    expect(nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
