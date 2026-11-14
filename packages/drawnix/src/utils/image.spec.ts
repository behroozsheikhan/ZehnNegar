import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlaitBoard } from '@plait/core';
import { setBoardLanguage } from '../i18n';
import { addImage, IMAGE_ACCEPT, insertImageFile } from './image';
import { pickFile } from '../data/pick-file';
import { insertImage } from '../data/image';

vi.mock('../data/pick-file', () => ({ pickFile: vi.fn() }));
vi.mock('../data/image', () => ({ insertImage: vi.fn() }));

const pickFileMock = vi.mocked(pickFile);
const insertImageMock = vi.mocked(insertImage);

function setup(language: 'fa' | 'en' = 'fa') {
  const showToast = vi.fn();
  const board = { showToast } as unknown as PlaitBoard;
  setBoardLanguage(board, language);
  return { board, showToast };
}

const png = () => new File(['x'], 'عکس.png', { type: 'image/png' });

describe('addImage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('پنجرهٔ انتخاب را فقط برای تصویرها باز می‌کند', async () => {
    pickFileMock.mockResolvedValue(null);
    const { board } = setup();
    await addImage(board);

    expect(pickFileMock).toHaveBeenCalledWith({ accept: IMAGE_ACCEPT });
    const accept = IMAGE_ACCEPT.split(',');
    expect(accept).toEqual(expect.arrayContaining(['image/png', 'image/jpeg', '.png', '.jpg', '.jpeg', '.svg', '.webp']));
  });

  it('تصویر انتخاب‌شده را روی تخته درج می‌کند', async () => {
    const file = png();
    pickFileMock.mockResolvedValue(file);
    insertImageMock.mockResolvedValue(undefined);
    const { board, showToast } = setup();

    await expect(addImage(board)).resolves.toBe(true);

    expect(insertImageMock).toHaveBeenCalledTimes(1);
    expect(insertImageMock.mock.calls[0].slice(0, 2)).toEqual([board, file]);
    expect(showToast).not.toHaveBeenCalled();
  });

  it('با انصراف کاربر چیزی درج نمی‌شود و پیامی هم نمی‌آید', async () => {
    pickFileMock.mockResolvedValue(null);
    const { board, showToast } = setup();

    await expect(addImage(board)).resolves.toBe(false);

    expect(insertImageMock).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
  });

  it('اگر پرونده تصویرِ خواندنی نباشد، به‌جای شکست بی‌صدا پیام خطا می‌دهد', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    pickFileMock.mockResolvedValue(png());
    insertImageMock.mockRejectedValue(new Error('broken image'));
    const { board, showToast } = setup('fa');

    await expect(addImage(board)).resolves.toBe(false);

    expect(showToast).toHaveBeenCalledWith({
      type: 'error',
      message: 'این پرونده تصویرِ قابل‌خواندن نیست و درج نشد',
    });
  });

  it('پیام خطا از زبان رابط پیروی می‌کند', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    insertImageMock.mockRejectedValue(new Error('broken image'));
    const { board, showToast } = setup('en');

    await expect(insertImageFile(board, png(), [10, 20], true)).resolves.toBe(false);

    expect(insertImageMock).toHaveBeenCalledWith(board, expect.any(File), [10, 20], true);
    expect(showToast.mock.calls[0][0].message).toBe(
      'This file is not a readable image and was not inserted'
    );
  });
});
