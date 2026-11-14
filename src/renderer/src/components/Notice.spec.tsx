import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Notice } from './Notice';

describe('Notice', () => {
  it('پیام موفقیت فارسی با مسیر پرونده', () => {
    render(
      <Notice
        notice={{ id: 1, kind: 'success', message: 'پرونده ذخیره شد.', detail: 'C:\\اسناد\\سفر نوروزی.drawnix' }}
        closeLabel="بستن"
        onDismiss={vi.fn()}
      />
    );
    const notice = screen.getByRole('status');
    expect(notice.textContent).toContain('پرونده ذخیره شد.');
    expect(screen.getByTestId('file-path').getAttribute('dir')).toBe('ltr');
    expect(notice.className).toContain('zn-notice--success');
  });

  it('خطا نقش alert دارد و با دکمه بسته می‌شود', () => {
    const onDismiss = vi.fn();
    render(
      <Notice
        notice={{ id: 2, kind: 'error', message: 'پرونده پیدا نشد. شاید جابه‌جا یا حذف شده باشد.' }}
        closeLabel="بستن"
        onDismiss={onDismiss}
      />
    );
    expect(screen.getByRole('alert').textContent).toContain('پرونده پیدا نشد.');
    expect(screen.queryByTestId('file-path')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'بستن' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
