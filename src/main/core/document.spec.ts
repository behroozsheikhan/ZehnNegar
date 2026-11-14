import { describe, expect, it } from 'vitest';
import {
  baseName,
  createEmptyDocument,
  displayName,
  ensureExtension,
  hasDocumentExtension,
  isDrawnixDocument,
  isExportFormat,
  parseDocument,
  sanitizeFileName,
} from './document';

const valid = JSON.stringify({ type: 'drawnix', version: 1, source: 'web', elements: [], viewport: { zoom: 1 } });

describe('parseDocument', () => {
  it('سند معتبر را می‌پذیرد', () => {
    const result = parseDocument(valid);
    expect(result.ok).toBe(true);
  });

  it('BOM ابتدای پرونده را نادیده می‌گیرد', () => {
    expect(parseDocument(`\uFEFF${valid}`).ok).toBe(true);
  });

  it('JSON خراب را رد می‌کند', () => {
    expect(parseDocument('{ نقشه ذهنی')).toEqual({ ok: false, reason: 'invalid-json' });
  });

  it('JSON با قالب دیگر را رد می‌کند', () => {
    expect(parseDocument('{"type":"excalidraw","elements":[]}')).toEqual({ ok: false, reason: 'invalid-format' });
    expect(parseDocument('[]')).toEqual({ ok: false, reason: 'invalid-format' });
    expect(parseDocument('null')).toEqual({ ok: false, reason: 'invalid-format' });
    expect(parseDocument('{"type":"drawnix","elements":{},"viewport":{}}')).toEqual({
      ok: false,
      reason: 'invalid-format',
    });
    expect(parseDocument('{"type":"drawnix","elements":[],"viewport":null}')).toEqual({
      ok: false,
      reason: 'invalid-format',
    });
  });

  it('سند خالیِ تازه معتبر است', () => {
    expect(isDrawnixDocument(createEmptyDocument())).toBe(true);
  });
});

describe('نام و مسیر', () => {
  it('نام پرونده را از مسیر ویندوز و یونیکس جدا می‌کند', () => {
    expect(baseName('C:\\Users\\Sara\\Documents\\برنامهٔ سفر.drawnix')).toBe('برنامهٔ سفر.drawnix');
    expect(baseName('/home/sara/نقشه‌ها/درس.drawnix')).toBe('درس.drawnix');
    expect(baseName('طرح.drawnix')).toBe('طرح.drawnix');
    expect(baseName('C:\\پوشه\\')).toBe('پوشه');
  });

  it('نام نمایشی پسوند drawnix ندارد', () => {
    expect(displayName('C:\\اسناد\\برنامهٔ سفر.drawnix')).toBe('برنامهٔ سفر');
    expect(displayName('C:\\اسناد\\PLAN.DRAWNIX')).toBe('PLAN');
    expect(displayName('C:\\اسناد\\تصویر.png')).toBe('تصویر.png');
  });

  it('پسوند را فقط در صورت نبودن اضافه می‌کند', () => {
    expect(ensureExtension('C:\\اسناد\\سفر', 'drawnix')).toBe('C:\\اسناد\\سفر.drawnix');
    expect(ensureExtension('C:\\اسناد\\سفر.drawnix', 'drawnix')).toBe('C:\\اسناد\\سفر.drawnix');
    expect(ensureExtension('C:\\اسناد\\سفر.Drawnix', 'drawnix')).toBe('C:\\اسناد\\سفر.Drawnix');
    expect(ensureExtension('عکس.jpeg', 'jpg')).toBe('عکس.jpeg');
    expect(ensureExtension('عکس.', 'png')).toBe('عکس.png');
  });

  it('پسوند سند را بدون حساسیت به بزرگی حروف تشخیص می‌دهد', () => {
    expect(hasDocumentExtension('a.drawnix')).toBe(true);
    expect(hasDocumentExtension('A.DRAWNIX')).toBe(true);
    expect(hasDocumentExtension('a.drawnix.bak')).toBe(false);
  });

  it('نویسه‌های غیرمجاز ویندوز را از نام پیشنهادی حذف می‌کند', () => {
    expect(sanitizeFileName('طرح: نسخهٔ «۲» / نهایی?', 'x')).toBe('طرح نسخهٔ «۲» نهایی');
    expect(sanitizeFileName('  گزارش.  ', 'x')).toBe('گزارش');
    expect(sanitizeFileName('<>:"/\\|?*', 'بی‌نام')).toBe('بی‌نام');
    expect(sanitizeFileName('', 'بی‌نام')).toBe('بی‌نام');
    expect(sanitizeFileName('ن'.repeat(300), 'x')).toHaveLength(120);
  });

  it('فقط قالب‌های خروجی شناخته‌شده را می‌پذیرد', () => {
    expect(isExportFormat('png')).toBe(true);
    expect(isExportFormat('jpg')).toBe(true);
    expect(isExportFormat('svg')).toBe(true);
    expect(isExportFormat('exe')).toBe(false);
    expect(isExportFormat(undefined)).toBe(false);
  });
});
