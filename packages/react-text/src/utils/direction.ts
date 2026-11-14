/**
 * تشخیص جهت متن از نخستین «حرف قوی» (مطابق رفتار dir="auto").
 */
const RTL_RANGE = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const LTR_RANGE = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u3040-\u30FF\u4E00-\u9FFF]/;

// ارقام فارسی و عربی «حرف قوی» نیستند (در الگوریتم دوجهتهٔ یونیکد از نوع EN/AN هستند).
const ARABIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/;

export const isRtlText = (text: string): boolean => {
  for (const char of text) {
    if (ARABIC_DIGITS.test(char)) {
      continue;
    }
    if (RTL_RANGE.test(char)) {
      return true;
    }
    if (LTR_RANGE.test(char)) {
      return false;
    }
  }
  return false;
};
