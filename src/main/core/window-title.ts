import type { DocumentState, UiLanguage } from '../../shared/ipc';
import { displayName } from './document';
import { getMessages } from './messages';

/** نام نمایشی سند جاری: نام پرونده یا «بی‌نام». */
export function documentName(filePath: string | null, language: UiLanguage): string {
  return filePath ? displayName(filePath) : getMessages(language).untitled;
}

/**
 * عنوان پنجره: «● نام سند — ذهن‌نگار» (نقطه یعنی تغییر ذخیره‌نشده).
 * نام پرونده با نویسه‌های جداساز جهت (FSI/PDI) محافظت می‌شود تا نام‌های لاتین
 * وسط متن فارسی جابه‌جا دیده نشوند.
 */
export function buildWindowTitle(state: DocumentState, language: UiLanguage): string {
  const messages = getMessages(language);
  const name = documentName(state.filePath, language);
  const isolated = `\u2068${name}\u2069`;
  return `${state.dirty ? '● ' : ''}${isolated} — ${messages.appName}`;
}
