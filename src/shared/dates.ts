/**
 * تاریخ: در دیتابیس همیشه ISO-8601 (UTC)؛ در رابط فارسی تقویم شمسی با Intl (بدون وابستگی).
 */
import type { UiLanguage } from './ipc';

export type { UiLanguage };

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(language: UiLanguage, withTime: boolean): Intl.DateTimeFormat {
  const key = `${language}:${withTime}`;
  let fmt = formatters.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(language === 'fa' ? 'fa-IR-u-ca-persian' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
    formatters.set(key, fmt);
  }
  return fmt;
}

/** رشتهٔ ISO را برای نمایش قالب‌بندی می‌کند؛ ورودی نامعتبر → رشتهٔ خالی. */
export function formatDate(iso: string, language: UiLanguage, withTime = true): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return formatter(language, withTime).format(date);
}

/** زمان فعلی به‌صورت ISO-8601 (UTC) برای ذخیره در دیتابیس. */
export function nowIso(now: Date = new Date()): string {
  return now.toISOString();
}
