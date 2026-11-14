import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

function renderModal(onClose = vi.fn()) {
  render(
    <>
      <button type="button">دکمهٔ بیرونی</button>
      <Modal title="پرونده‌های اخیر" closeLabel="بستن" onClose={onClose} testId="sample-modal">
        <p>هنوز پرونده‌ای باز نکرده‌اید.</p>
        <button type="button">باز کردن</button>
      </Modal>
    </>
  );
  return onClose;
}

describe('Modal', () => {
  it('نقش dialog با عنوان فارسی دارد و در سند راست‌به‌چپ قرار می‌گیرد', () => {
    renderModal();
    const dialog = screen.getByRole('dialog', { name: 'پرونده‌های اخیر' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.documentElement.dir).toBe('rtl');
    expect(dialog.closest('[dir="ltr"]')).toBeNull();
    expect(document.activeElement).toBe(dialog);
  });

  it('دکمهٔ بستن و کلید Escape پنجره را می‌بندند', () => {
    const onClose = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'بستن' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('Escape حتی وقتی فوکوس بیرون از پنجره است کار می‌کند و به تخته نمی‌رسد', () => {
    const onClose = renderModal();
    const boardListener = vi.fn();
    document.addEventListener('keydown', boardListener);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    fireEvent.keyDown(document.body, { key: 'h' });
    document.removeEventListener('keydown', boardListener);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(boardListener).not.toHaveBeenCalled();
  });

  it('کلیک روی پس‌زمینه می‌بندد ولی کلیک درون پنجره نه', () => {
    const onClose = renderModal();
    fireEvent.pointerDown(screen.getByText('هنوز پرونده‌ای باز نکرده‌اید.'));
    expect(onClose).not.toHaveBeenCalled();
    const backdrop = screen.getByRole('dialog').parentElement as HTMLElement;
    fireEvent.pointerDown(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('فوکوس از پنجره بیرون نمی‌رود', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    screen.getByRole('button', { name: 'دکمهٔ بیرونی' }).focus();
    expect(document.activeElement).toBe(dialog);

    const buttons = Array.from(dialog.querySelectorAll('button'));
    const last = buttons[buttons.length - 1];
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(buttons[0]);

    fireEvent.keyDown(buttons[0], { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});
