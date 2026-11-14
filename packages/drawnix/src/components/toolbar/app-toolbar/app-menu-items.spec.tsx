import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { BoardContext } from '@plait-board/react-board';
import { DrawnixHostContext, type DrawnixHost } from '../../../host';
import { DrawnixContext, mergeToolState, type DrawnixState } from '../../../hooks/use-drawnix';
import { I18nProvider } from '../../../i18n';
import type { Language } from '../../../i18n';
import Menu from '../../menu/menu';
import { About, NewFile, OpenFile, RecentFiles, SaveAsFile, SaveToFile } from './app-menu-items';
import { LanguageSwitcherMenu } from './language-switcher-menu';

const appState: DrawnixState = {
  toolState: mergeToolState(),
  isMobile: false,
  isPencilMode: false,
  fileHandle: null,
  openDialogType: null,
  openCleanConfirm: false,
  copyTransparent: false,
  exportTransparent: false,
};

function createHost(): DrawnixHost {
  return {
    newFile: vi.fn(),
    openFile: vi.fn(),
    showRecentFiles: vi.fn(),
    saveFile: vi.fn(),
    saveFileAs: vi.fn(),
    exportImage: vi.fn(),
    showAbout: vi.fn(),
  };
}

function renderMenu(
  children: ReactNode,
  options: { host?: DrawnixHost | null; language?: Language; onLanguageChange?: (language: Language) => void } = {}
) {
  const host = options.host === undefined ? createHost() : options.host;
  render(
    <I18nProvider initialLanguage={options.language ?? 'fa'} onLanguageChange={options.onLanguageChange}>
      <DrawnixHostContext.Provider value={host}>
        <DrawnixContext.Provider value={{ appState, setAppState: vi.fn(), showToast: vi.fn() }}>
          <BoardContext.Provider value={{ v: 0, board: { children: [] }, listRender: {} } as never}>
            <Menu onSelect={vi.fn()}>{children}</Menu>
          </BoardContext.Provider>
        </DrawnixContext.Provider>
      </DrawnixHostContext.Provider>
    </I18nProvider>
  );
  return host;
}

describe('منوی برنامه با میزبان دسکتاپ', () => {
  it('موارد پرونده برچسب فارسی دارند و به میزبان سپرده می‌شوند', () => {
    const host = renderMenu(
      <>
        <NewFile />
        <OpenFile />
        <RecentFiles />
        <SaveToFile />
        <SaveAsFile />
        <About />
      </>
    ) as DrawnixHost;

    const expectations: [string, string, keyof DrawnixHost][] = [
      ['new-file-button', 'پروندهٔ جدید', 'newFile'],
      ['open-button', 'باز کردن…', 'openFile'],
      ['recent-files-button', 'پرونده‌های اخیر…', 'showRecentFiles'],
      ['save-button', 'ذخیره', 'saveFile'],
      ['save-as-button', 'ذخیره با نام…', 'saveFileAs'],
      ['about-button', 'دربارهٔ ذهن‌نگار', 'showAbout'],
    ];
    for (const [testId, label, method] of expectations) {
      const item = screen.getByTestId(testId);
      expect(item.getAttribute('aria-label')).toBe(label);
      expect(item.textContent).toContain(label);
      fireEvent.click(item);
      expect(host[method]).toHaveBeenCalledTimes(1);
    }
  });

  it('میان‌برها چپ‌به‌راست و ایزوله نمایش داده می‌شوند', () => {
    renderMenu(<SaveToFile />);
    const shortcut = screen.getByTestId('save-button').querySelector('.menu-item__shortcut');
    expect(shortcut?.textContent).toBe('Ctrl+S');
    expect(shortcut?.getAttribute('dir')).toBe('ltr');
  });

  it('بدون میزبان (حالت وب) موارد ویژهٔ دسکتاپ پنهان‌اند', () => {
    renderMenu(
      <>
        <NewFile />
        <RecentFiles />
        <About />
        <SaveToFile />
      </>,
      { host: null }
    );
    expect(screen.queryByTestId('new-file-button')).toBeNull();
    expect(screen.queryByTestId('recent-files-button')).toBeNull();
    expect(screen.queryByTestId('about-button')).toBeNull();
    expect(screen.queryByTestId('save-button')).toBeNull();
  });

  it('برچسب‌های انگلیسی', () => {
    renderMenu(
      <>
        <OpenFile />
        <SaveAsFile />
      </>,
      { language: 'en' }
    );
    expect(screen.getByTestId('open-button').textContent).toContain('Open');
    expect(screen.getByTestId('save-as-button').textContent).toContain('Save As');
  });
});

describe('انتخاب زبان', () => {
  it('فقط فارسی و انگلیسی؛ انتخاب به میزبان خبر داده می‌شود', async () => {
    const onLanguageChange = vi.fn();
    renderMenu(<LanguageSwitcherMenu />, { onLanguageChange });
    const trigger = screen.getByTestId('language-switcher-button');
    expect(trigger.textContent).toContain('زبان');
    // زیرمنو با رفتن نشانگر روی گزینه باز می‌شود (کلیک آن را باز/بسته می‌کند).
    fireEvent.mouseEnter(trigger);
    const english = await screen.findByTestId('language-en');
    expect(screen.getByTestId('language-fa').textContent).toContain('فارسی');
    expect(screen.queryByTestId('language-zh')).toBeNull();
    fireEvent.click(english);
    expect(onLanguageChange).toHaveBeenCalledWith('en');
  });
});
