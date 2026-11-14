/**
 * ارقام فارسی هنگام تایپ.
 *
 * چیدمان «Persian» ویندوز در ردیف عددها (و صفحهٔ عددی) رقم لاتین تولید می‌کند. در رابط فارسی
 * رقم‌هایی که کاربر تایپ می‌کند به رقم فارسی تبدیل می‌شوند — با همان قاعدهٔ «وابسته به متن» که
 * کاربران فارسی از Word می‌شناسند:
 *
 *   - اگر نزدیک‌ترین حرفِ پیش از رقم فارسی/عربی باشد ← رقم فارسی («هزینه 12» ← «هزینه ۱۲»)
 *   - اگر نزدیک‌ترین حرف پیش از رقم از خط دیگری باشد (لاتین و …) ← دست‌نخورده («iPhone 15»)
 *   - اگر پیش از رقم هیچ حرفی نباشد ← رقم فارسی (رابط فارسی است)
 *
 * فقط آنچه تایپ می‌شود تبدیل می‌شود؛ متن چسبانده‌شده و پرونده‌های بازشده دست‌نخورده می‌مانند.
 */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

const LETTER = /\p{L}/u;
const ARABIC_SCRIPT_LETTER = /\p{Script=Arabic}/u;

type Context = 'persian' | 'other' | null;

const contextOf = (char: string): Context => {
  if (!LETTER.test(char)) {
    return null;
  }
  return ARABIC_SCRIPT_LETTER.test(char) ? 'persian' : 'other';
};

/** خطِ نزدیک‌ترین حرفِ متن (از انتها)؛ اگر حرفی نباشد null. */
const trailingContext = (text: string): Context => {
  const chars = Array.from(text);
  for (let index = chars.length - 1; index >= 0; index--) {
    const context = contextOf(chars[index]);
    if (context) {
      return context;
    }
  }
  return null;
};

/**
 * @param typed  متنی که کاربر همین حالا تایپ کرده است
 * @param before متنِ پیش از مکان‌نما در همان نوشته
 */
export const localizeTypedDigits = (typed: string, before = ''): string => {
  if (!/[0-9]/.test(typed)) {
    return typed;
  }
  let context = trailingContext(before);
  let result = '';
  for (const char of typed) {
    if (char >= '0' && char <= '9') {
      result += context === 'other' ? char : PERSIAN_DIGITS[Number(char)];
      continue;
    }
    context = contextOf(char) ?? context;
    result += char;
  }
  return result;
};
