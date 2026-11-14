import { describe, expect, it } from 'vitest';
import { fileDirectory, fileDisplayName, parseDocument, serializeDocument } from './document';

describe('serializeDocument / parseDocument', () => {
  it('رفت‌وبرگشت سند با متن فارسی', () => {
    const children = [
      { id: 'a', type: 'mindmap', data: { topic: { children: [{ text: 'برنامهٔ سفر نوروزی ۱۴۰۵' }] } } },
    ] as never[];
    const content = serializeDocument({ children, viewport: { zoom: 1.2 } });
    const parsed = parseDocument(content);
    expect(parsed?.children).toEqual(children);
    expect(parsed?.viewport).toEqual({ zoom: 1.2 });
  });

  it('قالب پرونده با Drawnix اصلی سازگار است', () => {
    const data = JSON.parse(serializeDocument({ children: [] }));
    expect(data).toMatchObject({ type: 'drawnix', version: 1, source: 'web', elements: [], viewport: { zoom: 1 } });
  });

  it('متن فارسی بدون escape و با ارقام اصلی ذخیره می‌شود', () => {
    const content = serializeDocument({ children: [{ id: 'x', text: 'هزینه: ۱۲ میلیون' } as never] });
    expect(content).toContain('هزینه: ۱۲ میلیون');
    expect(content).toContain('"version": 1');
  });

  it('محتوای نامعتبر null می‌شود', () => {
    expect(parseDocument('سلام')).toBeNull();
    expect(parseDocument('null')).toBeNull();
    expect(parseDocument('{"type":"other","elements":[]}')).toBeNull();
    expect(parseDocument('{"type":"drawnix","elements":"x"}')).toBeNull();
  });

  it('viewport و theme اختیاری‌اند', () => {
    const parsed = parseDocument('{"type":"drawnix","elements":[]}');
    expect(parsed).toEqual({ children: [], viewport: undefined, theme: undefined });
  });
});

describe('نام و پوشهٔ پرونده', () => {
  it('نام نمایشی بدون مسیر و پسوند', () => {
    expect(fileDisplayName('C:\\Users\\Sara\\Documents\\برنامهٔ سفر.drawnix', 'بی‌نام')).toBe('برنامهٔ سفر');
    expect(fileDisplayName('/home/sara/طرح.DRAWNIX', 'بی‌نام')).toBe('طرح');
    expect(fileDisplayName(null, 'بی‌نام')).toBe('بی‌نام');
    expect(fileDisplayName('', 'بی‌نام')).toBe('بی‌نام');
  });

  it('پوشهٔ دربرگیرنده', () => {
    expect(fileDirectory('C:\\Users\\Sara\\Documents\\برنامهٔ سفر.drawnix')).toBe('C:\\Users\\Sara\\Documents');
    expect(fileDirectory('/home/sara/طرح.drawnix')).toBe('/home/sara');
    expect(fileDirectory('طرح.drawnix')).toBe('طرح.drawnix');
  });
});
