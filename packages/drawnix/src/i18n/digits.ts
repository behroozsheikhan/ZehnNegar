/**
 * نمایش اعداد در رابط: در زبان فارسی با ارقام فارسی، در انگلیسی با ارقام لاتین.
 * منطق برنامه و پرونده‌ها همیشه ارقام لاتین دارند (منبع واحد: src/shared/digits.ts).
 */
import { formatDigits, normalizeDigits } from '@shared/digits';
import type { Language } from './types';

export { formatDigits, normalizeDigits };

/** درصد: «۱۲۰٪» در فارسی و «120%» در انگلیسی. */
export const formatPercent = (value: number, language: Language): string => {
  return language === 'fa' ? `${formatDigits(value, 'fa')}٪` : `${value}%`;
};

/** ورودی عددی کاربر را به رشتهٔ ارقام لاتین (فقط رقم) تبدیل می‌کند. */
export const sanitizeIntegerInput = (input: string): string => {
  return normalizeDigits(input).replace(/[^0-9]/g, '');
};
