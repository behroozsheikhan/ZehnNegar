import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AppInfo } from '@shared/ipc';
import { findOverflowing } from '../test/overflow';
import { AboutDialog } from './AboutDialog';

const info: AppInfo = {
  name: 'ذهن‌نگار',
  version: '1.0.0',
  electron: '45.3.2',
  chrome: '148.0.0.0',
  node: '22.22.0',
  platform: 'win32',
};

describe('AboutDialog', () => {
  it('نام، نسخه با ارقام فارسی و قابلیت‌ها را به فارسی نشان می‌دهد', () => {
    render(<AboutDialog language="fa" info={info} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'دربارهٔ ذهن‌نگار' });
    expect(dialog.textContent).toContain('تختهٔ سفید و نقشهٔ ذهنی فارسی، کاملاً آفلاین');
    expect(screen.getByTestId('about-version').textContent).toBe('نسخهٔ ۱.۰.۰');
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText('نقشهٔ ذهنی با چیدمان خودکار و شاخه‌های رنگی')).toBeTruthy();
  });

  it('از پروژهٔ اصلی Drawnix قدردانی می‌کند و پیوندش را دارد', () => {
    render(<AboutDialog language="fa" info={info} onClose={vi.fn()} />);
    const credit = screen.getByTestId('about-credit');
    expect(credit.textContent).toContain('بر پایهٔ پروژهٔ متن‌باز');
    expect(credit.textContent).toContain('MIT');
    const link = screen.getByRole('link', { name: 'Drawnix' });
    expect(link.getAttribute('href')).toBe('https://github.com/plait-board/drawnix');
    // پیوند بیرونی در پنجرهٔ جدا درخواست می‌شود تا main آن را به مرورگر سیستم بدهد.
    expect(link.getAttribute('target')).toBe('_blank');
    // نام لاتین درون متن فارسی ایزوله شده است.
    expect(link.querySelector('bdi')?.textContent).toBe('Drawnix');
  });

  it('متن مخلوطِ نسخه‌ها ایزوله است و چیزی از کادر بیرون نمی‌زند', () => {
    render(<AboutDialog language="fa" info={info} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    const isolated = Array.from(dialog.querySelectorAll('bdi')).map((element) => element.textContent);
    expect(isolated).toContain('۱.۰.۰');
    expect(isolated.some((text) => text?.includes('Electron 45.3.2'))).toBe(true);
    expect(findOverflowing(dialog)).toEqual([]);
  });

  it('بدون اطلاعات نسخه هم رسم می‌شود و دکمهٔ بستن کار می‌کند', () => {
    const onClose = vi.fn();
    render(<AboutDialog language="fa" info={null} onClose={onClose} />);
    expect(screen.getByRole('dialog').textContent).not.toContain('Electron');
    const closeButtons = screen.getAllByRole('button', { name: 'بستن' });
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('نسخهٔ انگلیسی ارقام لاتین دارد', () => {
    render(<AboutDialog language="en" info={info} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'About ZehnNegar' })).toBeTruthy();
    expect(screen.getByTestId('about-version').textContent).toBe('Version 1.0.0');
  });
});
