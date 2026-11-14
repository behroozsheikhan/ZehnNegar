import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UiLanguage } from '../../shared/ipc';
import { AppService, type DialogPort, type SaveKind } from './app-service';
import { InMemoryRepository } from './repository';

const VALID = JSON.stringify({ type: 'drawnix', version: 1, source: 'web', elements: [], viewport: { zoom: 1 } });

class FakeDialogs implements DialogPort {
  openPath: string | null = null;
  savePath: string | null = null;
  readonly saveRequests: { language: UiLanguage; kind: SaveKind; suggestedName: string }[] = [];
  openRequests = 0;

  async pickOpenPath(): Promise<string | null> {
    this.openRequests += 1;
    return this.openPath;
  }

  async pickSavePath(language: UiLanguage, kind: SaveKind, suggestedName: string): Promise<string | null> {
    this.saveRequests.push({ language, kind, suggestedName });
    return this.savePath;
  }
}

describe('AppService', () => {
  let dir: string;
  let dialogs: FakeDialogs;
  let repository: InMemoryRepository;
  let service: AppService;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'zehnnegar-app-'));
    dialogs = new FakeDialogs();
    repository = new InMemoryRepository();
    service = new AppService({ repository, dialogs, now: () => new Date('2026-03-21T08:00:00.000Z') });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe('openFile', () => {
    it('انصراف از پنجرهٔ باز کردن', async () => {
      expect(await service.openFile()).toEqual({ status: 'canceled' });
      expect(dialogs.openRequests).toBe(1);
    });

    it('پروندهٔ انتخاب‌شده را می‌خواند و به فهرست اخیر اضافه می‌کند', async () => {
      const file = join(dir, 'برنامهٔ سفر.drawnix');
      writeFileSync(file, VALID);
      dialogs.openPath = file;
      expect(await service.openFile()).toEqual({ status: 'ok', filePath: file, content: VALID });
      expect(service.listRecentFiles().map((item) => item.path)).toEqual([file]);
    });

    it('با مسیر مشخص پنجره باز نمی‌شود', async () => {
      const file = join(dir, 'طرح.drawnix');
      writeFileSync(file, VALID);
      expect((await service.openFile(file)).status).toBe('ok');
      expect(dialogs.openRequests).toBe(0);
    });

    it('پروندهٔ ناموجود از فهرست اخیر حذف می‌شود', async () => {
      const file = join(dir, 'حذف‌شده.drawnix');
      writeFileSync(file, VALID);
      await service.openFile(file);
      rmSync(file);
      expect(await service.openFile(file)).toEqual({ status: 'error', code: 'not-found', filePath: file });
      expect(service.listRecentFiles()).toEqual([]);
    });

    it('پروندهٔ نامعتبر خطای قالب می‌دهد و به فهرست اخیر نمی‌رود', async () => {
      const file = join(dir, 'متن.drawnix');
      writeFileSync(file, 'سلام');
      expect(await service.openFile(file)).toEqual({ status: 'error', code: 'invalid-format', filePath: file });
      expect(service.listRecentFiles()).toEqual([]);
    });
  });

  describe('saveFile', () => {
    it('سند بی‌نام: پنجرهٔ ذخیره با نام پیشنهادی «بی‌نام.drawnix»', async () => {
      dialogs.savePath = join(dir, 'نقشهٔ من');
      const result = await service.saveFile({ filePath: null, content: VALID });
      const expected = join(dir, 'نقشهٔ من.drawnix');
      expect(result).toEqual({ status: 'ok', filePath: expected });
      expect(readFileSync(expected, 'utf8')).toBe(VALID);
      expect(dialogs.saveRequests).toEqual([{ language: 'fa', kind: 'document', suggestedName: 'بی‌نام.drawnix' }]);
      expect(service.listRecentFiles()[0].name).toBe('نقشهٔ من.drawnix');
    });

    it('سند دارای مسیر بدون پنجره ذخیره می‌شود', async () => {
      const file = join(dir, 'طرح.drawnix');
      expect(await service.saveFile({ filePath: file, content: VALID })).toEqual({ status: 'ok', filePath: file });
      expect(dialogs.saveRequests).toHaveLength(0);
    });

    it('«ذخیره با نام» نام فعلی را پیشنهاد می‌دهد', async () => {
      const file = join(dir, 'طرح.drawnix');
      dialogs.savePath = join(dir, 'طرح ۲.drawnix');
      const result = await service.saveFile({ filePath: file, content: VALID, saveAs: true });
      expect(result).toEqual({ status: 'ok', filePath: join(dir, 'طرح ۲.drawnix') });
      expect(dialogs.saveRequests[0].suggestedName).toBe('طرح.drawnix');
    });

    it('انصراف از پنجرهٔ ذخیره', async () => {
      expect(await service.saveFile({ filePath: null, content: VALID })).toEqual({ status: 'canceled' });
    });

    it('درخواست نامعتبر renderer رد می‌شود', async () => {
      expect(await service.saveFile(null)).toEqual({ status: 'error', code: 'invalid-format' });
      expect(await service.saveFile({ filePath: join(dir, 'a.drawnix'), content: 'خراب' })).toEqual({
        status: 'error',
        code: 'invalid-format',
      });
    });

    it('نام پیشنهادی در زبان انگلیسی', async () => {
      service.updateSettings({ language: 'en' });
      await service.saveFile({ filePath: null, content: VALID });
      expect(dialogs.saveRequests[0]).toEqual({ language: 'en', kind: 'document', suggestedName: 'Untitled.drawnix' });
    });
  });

  describe('exportFile', () => {
    const data = new Uint8Array([1, 2, 3, 4]);

    it('تصویر را با پسوند درست ذخیره می‌کند', async () => {
      dialogs.savePath = join(dir, 'خروجی');
      const result = await service.exportFile({ format: 'png', data, suggestedName: 'سفر: نوروز' });
      expect(result).toEqual({ status: 'ok', filePath: join(dir, 'خروجی.png') });
      expect(new Uint8Array(readFileSync(join(dir, 'خروجی.png')))).toEqual(data);
      expect(dialogs.saveRequests[0]).toEqual({ language: 'fa', kind: 'png', suggestedName: 'سفر نوروز.png' });
    });

    it('قالب ناشناخته یا دادهٔ خالی رد می‌شود', async () => {
      expect(await service.exportFile({ format: 'exe', data, suggestedName: 'x' })).toEqual({
        status: 'error',
        code: 'invalid-format',
      });
      expect(await service.exportFile({ format: 'png', data: new Uint8Array(), suggestedName: 'x' })).toEqual({
        status: 'error',
        code: 'invalid-format',
      });
      expect(await service.exportFile({ format: 'png', data: [1, 2], suggestedName: 'x' })).toEqual({
        status: 'error',
        code: 'invalid-format',
      });
      expect(dialogs.saveRequests).toHaveLength(0);
    });

    it('انصراف', async () => {
      expect(await service.exportFile({ format: 'svg', data, suggestedName: '' })).toEqual({ status: 'canceled' });
      expect(dialogs.saveRequests[0].suggestedName).toBe('export.svg');
    });
  });

  describe('loadSession', () => {
    it('بدون نشست قبلی سند خالی است', async () => {
      expect(await service.loadSession(null)).toEqual({
        filePath: null,
        content: null,
        dirty: false,
        openedFromArgs: false,
      });
    });

    it('آخرین پیش‌نویس را برمی‌گرداند', async () => {
      service.saveDraft({ filePath: null, content: VALID, dirty: true });
      expect(await service.loadSession(null)).toEqual({
        filePath: null,
        content: VALID,
        dirty: true,
        openedFromArgs: false,
      });
      service.clearSession();
      expect((await service.loadSession(null)).content).toBeNull();
    });

    it('پروندهٔ خط فرمان بر نشست قبلی مقدم است', async () => {
      service.saveDraft({ filePath: null, content: VALID, dirty: true });
      const file = join(dir, 'دوبارکلیک.drawnix');
      const content = VALID.replace('"elements":[]', '"elements":[{"id":"x"}]');
      writeFileSync(file, content);
      expect(await service.loadSession(file)).toEqual({
        filePath: file,
        content,
        dirty: false,
        openedFromArgs: true,
      });
      expect(service.listRecentFiles()[0].path).toBe(file);
    });

    it('اگر پروندهٔ خط فرمان خراب باشد نشست قبلی با کد خطا برمی‌گردد', async () => {
      service.saveDraft({ filePath: null, content: VALID, dirty: true });
      const session = await service.loadSession(join(dir, 'نیست.drawnix'));
      expect(session).toEqual({
        filePath: null,
        content: VALID,
        dirty: true,
        openedFromArgs: true,
        error: 'not-found',
      });
    });
  });

  it('حذف و پاک‌سازی فهرست اخیر', async () => {
    const a = join(dir, 'الف.drawnix');
    const b = join(dir, 'ب.drawnix');
    await service.saveFile({ filePath: a, content: VALID });
    await service.saveFile({ filePath: b, content: VALID });
    expect(service.removeRecentFile(a).map((item) => item.path)).toEqual([b]);
    expect(service.removeRecentFile(42).map((item) => item.path)).toEqual([b]);
    expect(service.clearRecentFiles()).toEqual([]);
  });
});
