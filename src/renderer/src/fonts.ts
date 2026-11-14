import './styles/fonts.css';

/**
 * قلم‌ها پیش از رسم بوم بارگذاری می‌شوند؛ چون Plait اندازهٔ متن را با canvas می‌سنجد و
 * اگر قلم هنوز آماده نباشد اندازه‌ها با قلم جایگزین محاسبه و متن بریده می‌شود.
 */
const FONT_PROBES = [
  '400 14px "Vazirmatn"',
  '500 14px "Vazirmatn"',
  '700 14px "Vazirmatn"',
  '400 14px "-apple-system"',
  '700 14px "-apple-system"',
  '400 14px "BlinkMacSystemFont"',
  '700 14px "BlinkMacSystemFont"',
  '400 14px "Segoe UI"',
  '700 14px "Segoe UI"',
];

const SAMPLE_TEXT = 'ذهن‌نگار Abc ۱۲۳';

export async function loadAppFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.load) {
    return;
  }
  try {
    await Promise.all(FONT_PROBES.map((font) => document.fonts.load(font, SAMPLE_TEXT)));
  } catch {
    // اگر بارگذاری قلم شکست بخورد برنامه با قلم سیستم ادامه می‌دهد.
  }
}
