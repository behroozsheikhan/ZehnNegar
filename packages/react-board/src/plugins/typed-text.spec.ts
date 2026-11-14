import { describe, expect, it } from 'vitest';
import type { PlaitBoard } from '@plait/core';
import { hasPendingTypedText, isPrintableKey, queueTypedText, takeTypedText } from './typed-text';

const key = (init: KeyboardEventInit): KeyboardEvent => new KeyboardEvent('keydown', init);
const createBoard = (): PlaitBoard => ({}) as PlaitBoard;

describe('isPrintableKey', () => {
  it('حروف فارسی، لاتین، رقم و نیم‌فاصله متن تولید می‌کنند', () => {
    expect(isPrintableKey(key({ key: 'س', code: 'KeyS' }))).toBe(true);
    expect(isPrintableKey(key({ key: 'a', code: 'KeyA' }))).toBe(true);
    expect(isPrintableKey(key({ key: '۵', code: 'Digit5' }))).toBe(true);
    expect(isPrintableKey(key({ key: '\u200c', code: 'KeyB', shiftKey: true }))).toBe(true);
    // کلید «لا» در صفحه‌کلید فارسی دو نویسه می‌دهد.
    expect(isPrintableKey(key({ key: 'لا', code: 'KeyB' }))).toBe(true);
  });

  it('کلیدهای نام‌دار، فاصله و ترکیب با Ctrl/Alt متن نیستند', () => {
    for (const name of ['Enter', 'Tab', 'Escape', 'ArrowLeft', 'Backspace', 'F2', 'Dead', 'Process', 'Shift']) {
      expect(isPrintableKey(key({ key: name })), name).toBe(false);
    }
    expect(isPrintableKey(key({ key: ' ', code: 'Space' }))).toBe(false);
    expect(isPrintableKey(key({ key: 's', ctrlKey: true }))).toBe(false);
    expect(isPrintableKey(key({ key: 's', metaKey: true }))).toBe(false);
    expect(isPrintableKey(key({ key: 's', altKey: true }))).toBe(false);
  });
});

describe('صف متنِ تایپ‌شده', () => {
  it('نویسه‌ها به ترتیب نگه داشته و یک بار تحویل می‌شوند', () => {
    const board = createBoard();
    expect(hasPendingTypedText(board)).toBe(false);
    queueTypedText(board, 'س');
    queueTypedText(board, 'ل');
    queueTypedText(board, 'ا');
    queueTypedText(board, 'م');
    expect(hasPendingTypedText(board)).toBe(true);
    expect(takeTypedText(board)).toBe('سلام');
    expect(hasPendingTypedText(board)).toBe(false);
    expect(takeTypedText(board)).toBe('');
  });

  it('هر تخته صف خودش را دارد', () => {
    const first = createBoard();
    const second = createBoard();
    queueTypedText(first, 'الف');
    expect(hasPendingTypedText(second)).toBe(false);
    expect(takeTypedText(first)).toBe('الف');
  });

  it('صفِ کهنه (ویرایشگری که فوکوس نگرفت) نادیده گرفته می‌شود', () => {
    const board = createBoard();
    queueTypedText(board, 'س', 1000);
    expect(hasPendingTypedText(board, 1500)).toBe(true);
    expect(hasPendingTypedText(board, 2500)).toBe(false);
    queueTypedText(board, 'ب', 3000);
    expect(takeTypedText(board, 3050)).toBe('ب');
  });
});
