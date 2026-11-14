import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileService, type FileSystemLike } from './file-service';

const VALID = JSON.stringify({
  type: 'drawnix',
  version: 1,
  source: 'web',
  elements: [{ id: 'a', type: 'mindmap', data: { topic: { children: [{ text: 'برنامهٔ سفر نوروزی' }] } } }],
  viewport: { zoom: 1 },
});

describe('FileService (real file system)', () => {
  let dir: string;
  const service = new FileService();

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'zehnnegar-files-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('سند را با نام فارسی می‌نویسد و دوباره می‌خواند', async () => {
    const file = join(dir, 'برنامهٔ سفر نوروزی.drawnix');
    expect(await service.writeDocument(file, VALID)).toEqual({ ok: true });
    expect(await service.readDocument(file)).toEqual({ ok: true, content: VALID });
    expect(readFileSync(file, 'utf8')).toBe(VALID);
  });

  it('پس از نوشتن پروندهٔ موقتی باقی نمی‌ماند', async () => {
    await service.writeDocument(join(dir, 'طرح.drawnix'), VALID);
    expect(readdirSync(dir)).toEqual(['طرح.drawnix']);
  });

  it('روی پروندهٔ موجود بازنویسی می‌کند', async () => {
    const file = join(dir, 'طرح.drawnix');
    writeFileSync(file, 'قدیمی');
    await service.writeDocument(file, VALID);
    expect(readFileSync(file, 'utf8')).toBe(VALID);
  });

  it('محتوای نامعتبر را روی دیسک نمی‌نویسد', async () => {
    const file = join(dir, 'خراب.drawnix');
    expect(await service.writeDocument(file, 'این JSON نیست')).toEqual({ ok: false, code: 'invalid-format' });
    expect(readdirSync(dir)).toEqual([]);
  });

  it('دادهٔ دودویی (تصویر خروجی) را می‌نویسد', async () => {
    const file = join(dir, 'خروجی.png');
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
    expect(await service.writeAtomic(file, bytes)).toEqual({ ok: true });
    expect(new Uint8Array(readFileSync(file))).toEqual(bytes);
  });

  it('خطاهای خواندن را دسته‌بندی می‌کند', async () => {
    expect(await service.readDocument(join(dir, 'نیست.drawnix'))).toEqual({ ok: false, code: 'not-found' });
    expect(await service.readDocument(dir)).toEqual({ ok: false, code: 'not-found' });

    const bad = join(dir, 'متن.drawnix');
    writeFileSync(bad, 'سلام دنیا');
    expect(await service.readDocument(bad)).toEqual({ ok: false, code: 'invalid-format' });
  });

  it('BOM را از محتوای خوانده‌شده برمی‌دارد', async () => {
    const file = join(dir, 'bom.drawnix');
    writeFileSync(file, `\uFEFF${VALID}`);
    expect(await service.readDocument(file)).toEqual({ ok: true, content: VALID });
  });

  it('پروندهٔ بزرگ‌تر از سقف را رد می‌کند', async () => {
    const file = join(dir, 'بزرگ.drawnix');
    writeFileSync(file, VALID);
    const limited = new FileService(undefined, 10);
    expect(await limited.readDocument(file)).toEqual({ ok: false, code: 'too-large' });
  });

  it('نوشتن در پوشهٔ ناموجود io-error می‌دهد', async () => {
    expect(await service.writeDocument(join(dir, 'نیست', 'طرح.drawnix'), VALID)).toEqual({
      ok: false,
      code: 'io-error',
    });
  });
});

describe('FileService (injected file system)', () => {
  it('اگر rename شکست بخورد پروندهٔ موقت پاک می‌شود و مقصد دست‌نخورده می‌ماند', async () => {
    const calls: string[] = [];
    const fs: FileSystemLike = {
      stat: async () => ({ size: 0, isFile: () => true }),
      readFile: async () => '',
      writeFile: async (path) => {
        calls.push(`write:${path}`);
      },
      rename: async () => {
        calls.push('rename');
        throw new Error('EPERM');
      },
      unlink: async (path) => {
        calls.push(`unlink:${path}`);
      },
    };
    const result = await new FileService(fs).writeDocument('/docs/طرح.drawnix', VALID);
    expect(result).toEqual({ ok: false, code: 'io-error' });
    expect(calls[0]).toMatch(/^write:.*\.tmp$/);
    expect(calls[1]).toBe('rename');
    expect(calls[2]).toBe(calls[0].replace('write:', 'unlink:'));
  });

  it('خطای دسترسی هنگام خواندن io-error است', async () => {
    const fs: FileSystemLike = {
      stat: async () => {
        throw Object.assign(new Error('EACCES'), { code: 'EACCES' });
      },
      readFile: async () => '',
      writeFile: async () => undefined,
      rename: async () => undefined,
      unlink: async () => undefined,
    };
    expect(await new FileService(fs).readDocument('/docs/قفل.drawnix')).toEqual({ ok: false, code: 'io-error' });
  });
});
