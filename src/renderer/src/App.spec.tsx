/**
 * تست یکپارچهٔ پوستهٔ برنامه با API ساختگی.
 * خودِ تختهٔ Drawnix در jsdom قابل رسم نیست (SVG/canvas واقعی می‌خواهد)، پس این‌جا با
 * یک جایگزین ساده عوض می‌شود که همان قرارداد (props) را دارد؛ رفتار واقعی تخته در e2e
 * آزموده می‌شود.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DrawnixHost } from '@drawnix/drawnix';
import { createMockApi, type MockApi, type MockApiOptions } from './api/mock-api';
import { createSampleDocument, SAMPLE_RECENT_FILES } from './api/sample-document';
import { parseDocument } from './document';

interface FakeBoard {
  children: unknown[];
  viewport: { zoom: number };
  theme: undefined;
  undo: () => void;
  redo: () => void;
}

interface FakeDrawnixProps {
  value: unknown[];
  host: DrawnixHost;
  tutorial: boolean;
  initialLanguage: string;
  onChange: (data: unknown) => void;
  onLanguageChange: (language: 'fa' | 'en') => void;
  afterInit: (board: FakeBoard) => void;
}

const boards: FakeBoard[] = [];

vi.mock('@drawnix/drawnix', async () => {
  const React = await import('react');
  const Drawnix = (props: FakeDrawnixProps) => {
    const boardRef = React.useRef<FakeBoard | null>(null);
    if (!boardRef.current) {
      boardRef.current = {
        children: props.value,
        viewport: { zoom: 1 },
        theme: undefined,
        undo: vi.fn(),
        redo: vi.fn(),
      };
      boards.push(boardRef.current);
    }
    const board = boardRef.current;
    React.useEffect(() => {
      props.afterInit(board);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const addNode = () => {
      board.children = [...board.children, { id: `n${board.children.length}`, type: 'mindmap' }];
      props.onChange({
        children: board.children,
        viewport: board.viewport,
        theme: undefined,
        operations: [{ type: 'insert_node' }],
      });
    };
    return (
      <div
        data-testid="fake-board"
        data-count={props.value.length}
        data-tutorial={String(props.tutorial)}
        data-language={props.initialLanguage}
      >
        <button onClick={addNode}>add-node</button>
        <button
          onClick={() => {
            board.viewport = { zoom: 1.5 };
            props.onChange({
              children: board.children,
              viewport: board.viewport,
              theme: undefined,
              operations: [{ type: 'set_viewport' }, { type: 'set_selection' }],
            });
          }}
        >
          move-viewport
        </button>
        <button onClick={() => props.host.newFile()}>host-new</button>
        <button onClick={() => props.host.openFile()}>host-open</button>
        <button onClick={() => props.host.saveFile()}>host-save</button>
        <button onClick={() => props.host.saveFileAs()}>host-save-as</button>
        <button onClick={() => props.host.showRecentFiles()}>host-recent</button>
        <button onClick={() => props.host.showAbout()}>host-about</button>
        <button onClick={() => props.host.exportImage('png')}>host-export-png</button>
        <button onClick={() => props.onLanguageChange('en')}>lang-en</button>
      </div>
    );
  };
  return {
    Drawnix,
    exportBoardImage: vi.fn(async () => new Blob([new Uint8Array([1, 2, 3, 4, 5])])),
  };
});

const { App } = await import('./App');

async function renderApp(options: MockApiOptions = {}): Promise<MockApi> {
  const api = createMockApi(options);
  render(<App api={api} />);
  await screen.findByTestId('app-root');
  return api;
}

const board = (): HTMLElement => screen.getByTestId('fake-board');
const click = (name: string): void => {
  fireEvent.click(screen.getByRole('button', { name }));
};

describe('App', () => {
  beforeEach(() => {
    boards.length = 0;
  });

  describe('شروع برنامه', () => {
    it('بدون نشست قبلی: تختهٔ خالی، راهنمای آغازین، فارسی و راست‌به‌چپ', async () => {
      const api = await renderApp({ recentFiles: [] });
      expect(board().dataset.count).toBe('0');
      expect(board().dataset.tutorial).toBe('true');
      expect(board().dataset.language).toBe('fa');
      expect(document.documentElement.lang).toBe('fa');
      expect(document.documentElement.dir).toBe('rtl');
      expect(api.state.documentState).toEqual({ filePath: null, dirty: false });
      expect(screen.queryByTestId('app-notice')).toBeNull();
    });

    it('پیش‌نویس ذخیره‌نشده بازیابی می‌شود و پیام فارسی نشان داده می‌شود', async () => {
      const api = await renderApp({ session: { content: createSampleDocument(), dirty: true } });
      expect(board().dataset.count).toBe('1');
      expect(board().dataset.tutorial).toBe('false');
      expect(api.state.documentState).toEqual({ filePath: null, dirty: true });
      expect(screen.getByTestId('app-notice').textContent).toContain('بازیابی شد');
    });

    it('سند ذخیره‌شدهٔ جلسهٔ قبل از روی دیسک دوباره خوانده می‌شود', async () => {
      const filePath = SAMPLE_RECENT_FILES[0].path;
      const api = await renderApp({
        session: { filePath, content: '{"type":"drawnix","elements":[]}', dirty: false },
      });
      expect(board().dataset.count).toBe('1');
      expect(api.state.documentState).toEqual({ filePath, dirty: false });
    });

    it('اگر پروندهٔ جلسهٔ قبل حذف شده باشد پیش‌نویس به‌صورت سند ذخیره‌نشده می‌آید', async () => {
      const filePath = 'C:\\اسناد\\حذف‌شده.drawnix';
      const api = await renderApp({ session: { filePath, content: createSampleDocument(), dirty: false } });
      expect(board().dataset.count).toBe('1');
      expect(api.state.documentState).toEqual({ filePath: null, dirty: true });
      const notice = screen.getByRole('alert');
      expect(notice.textContent).toContain('پرونده پیدا نشد');
      expect(notice.textContent).toContain(filePath);
    });

    it('پروندهٔ دوبارکلیک‌شده باز می‌شود', async () => {
      const filePath = 'D:\\طرح‌ها\\جلسه.drawnix';
      const api = await renderApp({
        session: { filePath, content: createSampleDocument(), openedFromArgs: true },
      });
      expect(board().dataset.count).toBe('1');
      expect(api.state.documentState).toEqual({ filePath, dirty: false });
      expect(screen.queryByTestId('app-notice')).toBeNull();
    });

    it('خطای پروندهٔ خط فرمان به فارسی گزارش می‌شود', async () => {
      await renderApp({ session: { openedFromArgs: true, error: 'invalid-format' } });
      expect(screen.getByRole('alert').textContent).toContain('پروندهٔ معتبر');
    });

    it('زبان ذخیره‌شدهٔ انگلیسی جهت صفحه را چپ‌به‌راست می‌کند', async () => {
      await renderApp({ settings: { language: 'en' } });
      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dir).toBe('ltr');
      expect(board().dataset.language).toBe('en');
    });
  });

  describe('ویرایش و پیش‌نویس', () => {
    it('تغییر تخته سند را «ذخیره‌نشده» می‌کند و پیش‌نویس با تأخیر ذخیره می‌شود', async () => {
      const api = await renderApp({ recentFiles: [] });
      click('add-node');
      expect(api.state.documentState.dirty).toBe(true);
      expect(board().dataset.tutorial).toBe('false');
      expect(api.state.draft).toBeNull();
      await waitFor(() => expect(api.state.draft).not.toBeNull(), { timeout: 2000 });
      expect(api.state.draft?.dirty).toBe(true);
      expect(parseDocument(api.state.draft?.content ?? '')?.children).toHaveLength(1);
    });

    it('جابه‌جایی و بزرگ‌نمایی صفحه سند را «ذخیره‌نشده» نمی‌کند ولی در پیش‌نویس می‌ماند', async () => {
      const api = await renderApp({ recentFiles: [] });
      click('move-viewport');
      expect(api.state.documentState.dirty).toBe(false);
      await waitFor(() => expect(api.state.draft).not.toBeNull(), { timeout: 2000 });
      expect(api.state.draft?.dirty).toBe(false);
      expect(parseDocument(api.state.draft?.content ?? '')?.viewport).toEqual({ zoom: 1.5 });
      expect(api.state.documentState.dirty).toBe(false);
    });
  });

  describe('ذخیره', () => {
    it('ذخیرهٔ سند بی‌نام: مسیر انتخاب‌شده، پیام موفقیت و فهرست اخیر', async () => {
      const savePath = 'C:\\Users\\Sara\\Documents\\برنامهٔ سفر.drawnix';
      const api = await renderApp({ recentFiles: [], savePath });
      click('add-node');
      click('host-save');
      await waitFor(() => expect(api.state.documentState).toEqual({ filePath: savePath, dirty: false }));
      expect(parseDocument(api.state.files.get(savePath) ?? '')?.children).toHaveLength(1);
      expect(api.state.draft).toMatchObject({ filePath: savePath, dirty: false });
      const notice = await screen.findByTestId('app-notice');
      expect(notice.textContent).toContain('ذخیره شد');
      expect(notice.textContent).toContain(savePath);
      expect((await api.listRecentFiles())[0].path).toBe(savePath);
    });

    it('انصراف از پنجرهٔ ذخیره چیزی را عوض نمی‌کند', async () => {
      const api = await renderApp({ recentFiles: [], savePath: null });
      click('add-node');
      click('host-save');
      await act(async () => {
        await Promise.resolve();
      });
      expect(api.state.documentState).toEqual({ filePath: null, dirty: true });
      expect(screen.queryByTestId('app-notice')).toBeNull();
    });

    it('Ctrl+S با صفحه‌کلید فارسی هم ذخیره می‌کند', async () => {
      const api = await renderApp({ recentFiles: [] });
      click('add-node');
      fireEvent.keyDown(window, { code: 'KeyS', key: 'س', ctrlKey: true });
      await waitFor(() => expect(api.state.documentState.dirty).toBe(false));
      expect(api.state.documentState.filePath).toContain('.drawnix');
    });
  });

  describe('باز کردن و سند جدید', () => {
    it('باز کردن پرونده تخته را از نو می‌سازد', async () => {
      const api = await renderApp();
      const firstKey = screen.getByTestId('app-root').dataset.documentKey;
      click('host-open');
      await waitFor(() => expect(board().dataset.count).toBe('1'));
      expect(screen.getByTestId('app-root').dataset.documentKey).not.toBe(firstKey);
      expect(api.state.documentState).toEqual({ filePath: SAMPLE_RECENT_FILES[0].path, dirty: false });
      expect(api.state.draft).toMatchObject({ filePath: SAMPLE_RECENT_FILES[0].path, dirty: false });
    });

    it('با تغییر ذخیره‌نشده، «انصراف» سند فعلی را نگه می‌دارد', async () => {
      const api = await renderApp({ unsavedChoice: 'cancel' });
      const confirm = vi.spyOn(api, 'confirmUnsaved');
      click('add-node');
      click('host-open');
      await waitFor(() => expect(confirm).toHaveBeenCalledWith('بی‌نام'));
      expect(api.state.documentState).toEqual({ filePath: null, dirty: true });
      expect(board().dataset.count).toBe('0');
    });

    it('با تغییر ذخیره‌نشده، «ذخیره» اول ذخیره می‌کند و بعد سند جدید می‌سازد', async () => {
      const savePath = 'C:\\اسناد\\کار.drawnix';
      const api = await renderApp({ unsavedChoice: 'save', savePath, recentFiles: [] });
      click('add-node');
      click('host-new');
      await waitFor(() => expect(api.state.files.has(savePath)).toBe(true));
      await waitFor(() => expect(api.state.documentState).toEqual({ filePath: null, dirty: false }));
      expect(board().dataset.tutorial).toBe('true');
      await waitFor(() => expect(api.state.draft).toBeNull());
    });

    it('«ذخیره نکن» تغییرات را دور می‌ریزد', async () => {
      const api = await renderApp({ unsavedChoice: 'discard', recentFiles: [] });
      click('add-node');
      click('host-new');
      await waitFor(() => expect(api.state.documentState.dirty).toBe(false));
      expect(api.state.files.size).toBe(0);
    });

    it('پروندهٔ ناموجود: پیام خطای فارسی با مسیر و سند فعلی دست‌نخورده', async () => {
      const api = await renderApp();
      const missing = 'C:\\اسناد\\نیست.drawnix';
      act(() => api.emitOpenPath(missing));
      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toContain('پرونده پیدا نشد');
      expect(alert.textContent).toContain(missing);
      expect(api.state.documentState.filePath).toBeNull();
    });

    it('پروندهٔ خراب: پیام «پروندهٔ معتبر نیست»', async () => {
      const api = await renderApp();
      api.state.files.set('C:\\اسناد\\خراب.drawnix', 'این JSON نیست');
      act(() => api.emitOpenPath('C:\\اسناد\\خراب.drawnix'));
      expect((await screen.findByRole('alert')).textContent).toContain('پروندهٔ معتبر');
    });
  });

  describe('پنجره‌ها', () => {
    it('فهرست پرونده‌های اخیر: باز کردن از فهرست پنجره را می‌بندد', async () => {
      const api = await renderApp();
      click('host-recent');
      const dialog = await screen.findByTestId('recent-dialog');
      expect(dialog.textContent).toContain('برنامهٔ سفر نوروزی');
      const items = screen.getAllByTestId('recent-item');
      expect(items).toHaveLength(SAMPLE_RECENT_FILES.length);
      fireEvent.click(items[1].querySelector('button') as HTMLButtonElement);
      await waitFor(() => expect(screen.queryByTestId('recent-dialog')).toBeNull());
      expect(api.state.documentState.filePath).toBe(SAMPLE_RECENT_FILES[1].path);
    });

    it('حذف و پاک‌سازی فهرست اخیر', async () => {
      const api = await renderApp();
      click('host-recent');
      await screen.findByTestId('recent-dialog');
      fireEvent.click(screen.getAllByTestId('recent-remove')[0]);
      await waitFor(() => expect(screen.getAllByTestId('recent-item')).toHaveLength(SAMPLE_RECENT_FILES.length - 1));
      fireEvent.click(screen.getByTestId('recent-clear'));
      expect((await screen.findByTestId('recent-empty')).textContent).toContain('هنوز پرونده‌ای باز نکرده‌اید');
      expect(api.state.recentFiles).toEqual([]);
    });

    it('«درباره» با F1 باز و با Escape بسته می‌شود', async () => {
      await renderApp();
      fireEvent.keyDown(window, { code: 'F1', key: 'F1' });
      const dialog = await screen.findByTestId('about-dialog');
      await waitFor(() => expect(screen.getByTestId('about-version').textContent).toBe('نسخهٔ ۱.۰.۰'));
      expect(dialog.textContent).toContain('Drawnix');
      fireEvent.keyDown(document.body, { key: 'Escape' });
      await waitFor(() => expect(screen.queryByTestId('about-dialog')).toBeNull());
    });

    it('وقتی پنجره‌ای باز است میان‌برهای پرونده کار نمی‌کنند', async () => {
      const api = await renderApp();
      const saveFile = vi.spyOn(api, 'saveFile');
      click('host-about');
      await screen.findByTestId('about-dialog');
      fireEvent.keyDown(window, { code: 'KeyS', key: 's', ctrlKey: true });
      await act(async () => {
        await Promise.resolve();
      });
      expect(saveFile).not.toHaveBeenCalled();
    });
  });

  describe('برون‌بری تصویر', () => {
    it('تختهٔ خالی: پیام راهنما و بدون پنجرهٔ ذخیره', async () => {
      const api = await renderApp({ recentFiles: [] });
      click('host-export-png');
      expect((await screen.findByTestId('app-notice')).textContent).toContain('تخته خالی است');
      expect(api.state.exports).toEqual([]);
    });

    it('تصویر با نام سند پیشنهاد و ذخیره می‌شود', async () => {
      const api = await renderApp();
      click('host-open');
      await waitFor(() => expect(board().dataset.count).toBe('1'));
      click('host-export-png');
      await waitFor(() => expect(api.state.exports).toHaveLength(1));
      expect(api.state.exports[0]).toEqual({ format: 'png', size: 5, suggestedName: 'برنامهٔ سفر نوروزی' });
      expect((await screen.findByTestId('app-notice')).textContent).toContain('خروجی ذخیره شد');
    });
  });

  describe('فرمان‌های main', () => {
    it('فرمان منوی نیتیو اجرا می‌شود', async () => {
      const api = await renderApp();
      act(() => api.emitCommand('help:about'));
      expect(await screen.findByTestId('about-dialog')).toBeTruthy();
    });

    it('واگرد و ازنو به تخته می‌رسند', async () => {
      const api = await renderApp();
      act(() => api.emitCommand('edit:undo'));
      act(() => api.emitCommand('edit:redo'));
      expect(boards[boards.length - 1].undo).toHaveBeenCalledTimes(1);
      expect(boards[boards.length - 1].redo).toHaveBeenCalledTimes(1);
    });

    it('بستن پنجره بدون تغییر: پیش‌نویس ذخیره و پنجره بسته می‌شود', async () => {
      const api = await renderApp({ recentFiles: [] });
      act(() => api.emitCloseRequested());
      await waitFor(() => expect(api.state.closed).toBe(true));
      expect(api.state.draft).toMatchObject({ filePath: null, dirty: false });
    });

    it('بستن با تغییر ذخیره‌نشده و «انصراف»: پنجره باز می‌ماند', async () => {
      const api = await renderApp({ unsavedChoice: 'cancel', recentFiles: [] });
      const confirm = vi.spyOn(api, 'confirmUnsaved');
      click('add-node');
      act(() => api.emitCloseRequested());
      await waitFor(() => expect(confirm).toHaveBeenCalled());
      expect(api.state.closed).toBe(false);
    });

    it('بستن با «ذخیره نکن»: پیش‌نویسِ تغییرات پاک می‌شود', async () => {
      const api = await renderApp({ unsavedChoice: 'discard', recentFiles: [] });
      click('add-node');
      await waitFor(() => expect(api.state.draft).not.toBeNull(), { timeout: 2000 });
      act(() => api.emitCloseRequested());
      await waitFor(() => expect(api.state.closed).toBe(true));
      expect(api.state.draft).toBeNull();
    });

    it('بستن با «ذخیره نکن» روی سندِ دارای پرونده: نسخهٔ روی دیسک برای دفعهٔ بعد می‌ماند', async () => {
      const api = await renderApp({ unsavedChoice: 'discard' });
      click('host-open');
      await waitFor(() => expect(board().dataset.count).toBe('1'));
      click('add-node');
      act(() => api.emitCloseRequested());
      await waitFor(() => expect(api.state.closed).toBe(true));
      expect(api.state.draft).toEqual({
        filePath: SAMPLE_RECENT_FILES[0].path,
        content: createSampleDocument(),
        dirty: false,
      });
    });
  });

  describe('تنظیمات', () => {
    it('تغییر زبان فوراً ذخیره می‌شود و جهت صفحه عوض می‌شود', async () => {
      const api = await renderApp();
      click('lang-en');
      await waitFor(() => expect(api.state.settings.language).toBe('en'));
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('en');
    });
  });
});
