import { afterEach, describe, expect, it, vi } from 'vitest';
import { pickFile } from './pick-file';

/** به‌جای پنجرهٔ انتخاب پرونده: همان لحظه‌ای که input کلیک می‌شود آن را در اختیار آزمون می‌گذارد. */
function interceptPicker() {
  const opened: HTMLInputElement[] = [];
  vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
    opened.push(this);
  });
  return opened;
}

const choose = (input: HTMLInputElement, files: File[]) => {
  Object.defineProperty(input, 'files', { configurable: true, value: files });
  input.dispatchEvent(new Event('change'));
};

describe('pickFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('یک input پنهان از نوع file با accept دلخواه باز می‌کند', () => {
    const opened = interceptPicker();
    void pickFile({ accept: 'image/png,.png' });

    expect(opened).toHaveLength(1);
    const input = opened[0];
    expect(input.type).toBe('file');
    expect(input.accept).toBe('image/png,.png');
    expect(input.multiple).toBe(false);
    expect(input.style.display).toBe('none');
    expect(input.isConnected).toBe(true);
  });

  it('پروندهٔ انتخاب‌شده را برمی‌گرداند و input را از صفحه برمی‌دارد', async () => {
    const opened = interceptPicker();
    const pending = pickFile();
    const file = new File(['x'], 'عکس.png', { type: 'image/png' });

    choose(opened[0], [file]);

    await expect(pending).resolves.toBe(file);
    expect(document.querySelector('input[type=file]')).toBeNull();
  });

  it('با انصراف کاربر null برمی‌گرداند', async () => {
    const opened = interceptPicker();
    const pending = pickFile();

    opened[0].dispatchEvent(new Event('cancel'));

    await expect(pending).resolves.toBeNull();
    expect(document.querySelector('input[type=file]')).toBeNull();
  });

  it('اگر پرونده‌ای انتخاب نشده باشد null برمی‌گرداند', async () => {
    const opened = interceptPicker();
    const pending = pickFile();
    choose(opened[0], []);
    await expect(pending).resolves.toBeNull();
  });
});
