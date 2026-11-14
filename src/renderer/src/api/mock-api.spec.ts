import { describe, expect, it, vi } from 'vitest';
import { parseDocument } from '../document';
import { createMockApi } from './mock-api';
import { createSampleDocument, SAMPLE_RECENT_FILES } from './sample-document';

describe('createMockApi', () => {
  it('دادهٔ نمونه فارسی و معتبر است', async () => {
    const parsed = parseDocument(createSampleDocument());
    expect(parsed?.children).toHaveLength(1);
    expect(JSON.stringify(parsed?.children)).toContain('برنامهٔ سفر نوروزی');

    const api = createMockApi();
    const recent = await api.listRecentFiles();
    expect(recent).toHaveLength(SAMPLE_RECENT_FILES.length);
    expect(recent[0].name).toMatch(/[\u0600-\u06FF]/);
    expect((await api.getSettings()).language).toBe('fa');
  });

  it('باز کردن، ذخیره و فهرست اخیر مثل API واقعی رفتار می‌کنند', async () => {
    const api = createMockApi({ savePath: 'C:\\اسناد\\تازه.drawnix' });
    const opened = await api.openFile(SAMPLE_RECENT_FILES[1].path);
    expect(opened.status).toBe('ok');
    expect((await api.listRecentFiles())[0].path).toBe(SAMPLE_RECENT_FILES[1].path);

    const saved = await api.saveFile({ filePath: null, content: createSampleDocument() });
    expect(saved).toEqual({ status: 'ok', filePath: 'C:\\اسناد\\تازه.drawnix' });
    expect((await api.listRecentFiles())[0].name).toBe('تازه.drawnix');

    expect(await api.openFile('C:\\نیست.drawnix')).toEqual({
      status: 'error',
      code: 'not-found',
      filePath: 'C:\\نیست.drawnix',
    });
  });

  it('انصراف از پنجره‌ها', async () => {
    const api = createMockApi({ savePath: null, openPath: null });
    expect(await api.saveFile({ filePath: null, content: '{}' })).toEqual({ status: 'canceled' });
    expect(await api.openFile()).toEqual({ status: 'canceled' });
  });

  it('رویدادهای main را شبیه‌سازی می‌کند و لغو اشتراک کار می‌کند', () => {
    const api = createMockApi();
    const onCommand = vi.fn();
    const off = api.onCommand(onCommand);
    api.emitCommand('file:new');
    off();
    api.emitCommand('file:open');
    expect(onCommand).toHaveBeenCalledTimes(1);
    expect(onCommand).toHaveBeenCalledWith('file:new');
  });
});
