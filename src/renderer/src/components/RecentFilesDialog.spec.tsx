import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RecentFile } from '@shared/ipc';
import { findOverflowing } from '../test/overflow';
import { RecentFilesDialog } from './RecentFilesDialog';

const files: RecentFile[] = [
  {
    path: 'C:\\Users\\Sara\\Documents\\نقشه‌های ذهنی\\برنامهٔ سفر نوروزی.drawnix',
    name: 'برنامهٔ سفر نوروزی.drawnix',
    openedAt: '2026-03-20T12:00:00.000Z',
  },
  {
    path: 'D:\\دانشگاه\\فصل دوم - مرور پیشینهٔ پژوهش و چارچوب نظریِ پایان‌نامهٔ کارشناسی ارشد.drawnix',
    name: 'فصل دوم - مرور پیشینهٔ پژوهش و چارچوب نظریِ پایان‌نامهٔ کارشناسی ارشد.drawnix',
    openedAt: '2026-02-27T12:00:00.000Z',
  },
  {
    path: 'C:\\Users\\Sara\\Desktop\\Roadmap 2026 Q2.drawnix',
    name: 'Roadmap 2026 Q2.drawnix',
    openedAt: '2026-02-02T12:00:00.000Z',
  },
];

function renderDialog(overrides: Partial<React.ComponentProps<typeof RecentFilesDialog>> = {}) {
  const props = {
    language: 'fa' as const,
    files,
    onOpen: vi.fn(),
    onRemove: vi.fn(),
    onClear: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<RecentFilesDialog {...props} />);
  return props;
}

describe('RecentFilesDialog', () => {
  it('نام پرونده‌ها بدون پسوند و تاریخ شمسی با ارقام فارسی', () => {
    renderDialog();
    const items = screen.getAllByTestId('recent-item');
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByText('برنامهٔ سفر نوروزی')).toBeTruthy();
    const date = items[0].querySelector('time') as HTMLTimeElement;
    expect(date.getAttribute('datetime')).toBe('2026-03-20T12:00:00.000Z');
    expect(date.textContent).toContain('اسفند');
    expect(date.textContent).toContain('۱۴۰۴');
    expect(date.textContent).not.toMatch(/[0-9]/);
  });

  it('نام لاتین و مسیر در متن راست‌به‌چپ ایزوله‌اند', () => {
    renderDialog();
    const item = screen.getAllByTestId('recent-item')[2];
    expect(item.querySelector('bdi.zn-recent__name')?.textContent).toBe('Roadmap 2026 Q2');
    const path = within(item).getByTestId('file-path');
    expect(path.getAttribute('dir')).toBe('ltr');
    expect(path.textContent).toBe('C:\\Users\\Sara\\Desktop');
  });

  it('نام بسیار طولانی کامل در DOM هست و کادر را نمی‌شکند', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { name: 'پرونده‌های اخیر' });
    expect(dialog.textContent).toContain('فصل دوم - مرور پیشینهٔ پژوهش و چارچوب نظریِ پایان‌نامهٔ کارشناسی ارشد');
    expect(findOverflowing(dialog)).toEqual([]);
  });

  it('باز کردن و حذف مسیر کامل را برمی‌گردانند', () => {
    const props = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'باز کردن: برنامهٔ سفر نوروزی' }));
    expect(props.onOpen).toHaveBeenCalledWith(files[0].path);
    fireEvent.click(screen.getByRole('button', { name: 'حذف از فهرست: Roadmap 2026 Q2' }));
    expect(props.onRemove).toHaveBeenCalledWith(files[2].path);
    fireEvent.click(screen.getByTestId('recent-clear'));
    expect(props.onClear).toHaveBeenCalledTimes(1);
  });

  it('فهرست خالی پیام فارسی دارد و دکمهٔ پاک‌سازی ندارد', () => {
    renderDialog({ files: [] });
    expect(screen.getByTestId('recent-empty').textContent).toContain('هنوز پرونده‌ای باز نکرده‌اید.');
    expect(screen.queryByTestId('recent-clear')).toBeNull();
  });

  it('در زبان انگلیسی تاریخ میلادی است', () => {
    renderDialog({ language: 'en' });
    expect(screen.getByRole('dialog', { name: 'Recent files' })).toBeTruthy();
    expect(screen.getAllByTestId('recent-item')[0].querySelector('time')?.textContent).toContain('March 2026');
  });
});
