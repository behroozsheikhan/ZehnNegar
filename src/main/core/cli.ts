import { hasDocumentExtension } from './document';

/**
 * مسیر پروندهٔ `.drawnix` را از آرگومان‌های خط فرمان پیدا می‌کند
 * (دوبارکلیک روی پرونده در ویندوز → `Zehnnegar.exe "C:\…\x.drawnix"`).
 * آرگومان اول (مسیر اجرایی) و سوییچ‌ها نادیده گرفته می‌شوند.
 */
export function findDocumentArgument(argv: readonly string[]): string | null {
  for (const arg of argv.slice(1)) {
    if (!arg || arg.startsWith('-')) {
      continue;
    }
    const candidate = stripQuotes(arg);
    if (hasDocumentExtension(candidate)) {
      return candidate;
    }
  }
  return null;
}

function stripQuotes(value: string): string {
  return value.length >= 2 && value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
}

/** فقط پیوندهای وب و رایانامه اجازه دارند در برنامهٔ پیش‌فرض سیستم باز شوند. */
export function isSafeExternalUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:' || protocol === 'mailto:';
  } catch {
    return false;
  }
}
