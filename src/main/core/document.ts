/**
 * قالب پروندهٔ `.drawnix` (سازگار با Drawnix اصلی) و ابزارهای مسیر/نام.
 * این ماژول خالص است و به electron وابسته نیست.
 */
import { DOCUMENT_EXTENSION, type ExportFormat } from '../../shared/ipc';

export const DOCUMENT_TYPE = 'drawnix';
/** سقف اندازهٔ پرونده‌ای که باز می‌کنیم (۲۰۰ مگابایت). */
export const MAX_DOCUMENT_BYTES = 200 * 1024 * 1024;

export interface DrawnixDocument {
  type: typeof DOCUMENT_TYPE;
  version: number;
  source: string;
  elements: unknown[];
  viewport: Record<string, unknown>;
  theme?: Record<string, unknown>;
}

export type ParseResult =
  | { ok: true; document: DrawnixDocument }
  | { ok: false; reason: 'invalid-json' | 'invalid-format' };

export function isDrawnixDocument(value: unknown): value is DrawnixDocument {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const data = value as Record<string, unknown>;
  return (
    data.type === DOCUMENT_TYPE &&
    Array.isArray(data.elements) &&
    typeof data.viewport === 'object' &&
    data.viewport !== null
  );
}

export function parseDocument(text: string): ParseResult {
  let data: unknown;
  try {
    // BOM ابتدای پرونده (ویرایشگرهای ویندوزی) نادیده گرفته می‌شود.
    data = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }
  if (!isDrawnixDocument(data)) {
    return { ok: false, reason: 'invalid-format' };
  }
  return { ok: true, document: data };
}

export function createEmptyDocument(): DrawnixDocument {
  return { type: DOCUMENT_TYPE, version: 1, source: 'web', elements: [], viewport: { zoom: 1 } };
}

/** نام پرونده بدون مسیر (هر دو جداکنندهٔ ویندوز و یونیکس). */
export function baseName(filePath: string): string {
  const trimmed = filePath.replace(/[\\/]+$/, '');
  const index = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
  return index >= 0 ? trimmed.slice(index + 1) : trimmed;
}

/** نام نمایشی سند: نام پرونده بدون پسوند `.drawnix`. */
export function displayName(filePath: string): string {
  const name = baseName(filePath);
  const suffix = `.${DOCUMENT_EXTENSION}`;
  return name.toLowerCase().endsWith(suffix) ? name.slice(0, -suffix.length) : name;
}

/** اگر مسیر پسوند مورد نظر را ندارد اضافه‌اش می‌کند. */
export function ensureExtension(filePath: string, extension: string): string {
  const suffix = `.${extension.toLowerCase()}`;
  if (filePath.toLowerCase().endsWith(suffix)) {
    return filePath;
  }
  if (extension === 'jpg' && filePath.toLowerCase().endsWith('.jpeg')) {
    return filePath;
  }
  return `${filePath.replace(/\.+$/, '')}${suffix}`;
}

export function hasDocumentExtension(filePath: string): boolean {
  return filePath.toLowerCase().endsWith(`.${DOCUMENT_EXTENSION}`);
}

// نویسه‌های کنترلی عمداً در الگو هستند: ویندوز آن‌ها را در نام پرونده نمی‌پذیرد.
// eslint-disable-next-line no-control-regex
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

/** نامی امن برای پیشنهاد در پنجرهٔ ذخیره (کاراکترهای غیرمجاز ویندوز حذف می‌شوند). */
export function sanitizeFileName(name: string, fallback: string): string {
  const cleaned = name.replace(INVALID_FILENAME_CHARS, ' ').replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '');
  return cleaned.length > 0 ? cleaned.slice(0, 120) : fallback;
}

export const EXPORT_FORMATS: Record<ExportFormat, { extensions: string[]; mime: string }> = {
  png: { extensions: ['png'], mime: 'image/png' },
  jpg: { extensions: ['jpg', 'jpeg'], mime: 'image/jpeg' },
  svg: { extensions: ['svg'], mime: 'image/svg+xml' },
};

export function isExportFormat(value: unknown): value is ExportFormat {
  return value === 'png' || value === 'jpg' || value === 'svg';
}
