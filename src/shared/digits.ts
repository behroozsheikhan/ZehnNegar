/**
 * ابزارهای رقم فارسی/عربی.
 * قاعده: در منطق و دیتابیس همیشه ارقام لاتین؛ در رابط فارسی ارقام فارسی.
 */

const PERSIAN_ZERO = 0x06f0; // ۰
const ARABIC_ZERO = 0x0660; // ٠
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** ارقام فارسی (۰-۹) و عربی (٠-٩) و جداکننده‌های اعشار/هزارگان را به معادل لاتین تبدیل می‌کند. */
export function normalizeDigits(input: string): string {
  let out = '';
  for (const ch of input) {
    const code = ch.codePointAt(0) as number;
    if (code >= PERSIAN_ZERO && code <= PERSIAN_ZERO + 9) {
      out += String(code - PERSIAN_ZERO);
    } else if (code >= ARABIC_ZERO && code <= ARABIC_ZERO + 9) {
      out += String(code - ARABIC_ZERO);
    } else if (ch === '٫') {
      out += '.'; // ممیز فارسی
    } else if (ch === '٬') {
      // جداکنندهٔ هزارگان فارسی حذف می‌شود
    } else {
      out += ch;
    }
  }
  return out;
}

/** ارقام لاتین را به فارسی تبدیل می‌کند (برای نمایش). */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/** عدد را برای زبان رابط قالب‌بندی می‌کند. */
export function formatDigits(input: string | number, language: 'fa' | 'en'): string {
  return language === 'fa' ? toPersianDigits(input) : String(input);
}

/**
 * ورودی عددی کاربر (با ارقام فارسی/عربی/لاتین) را به عدد تبدیل می‌کند.
 * اگر ورودی عدد معتبر نباشد `null` برمی‌گرداند.
 */
export function parseLocalizedNumber(input: string): number | null {
  const normalized = normalizeDigits(input).replace(/[\s\u200c\u200e\u200f]/g, '');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
