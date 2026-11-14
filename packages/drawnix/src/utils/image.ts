import { getSelectedElements, PlaitBoard, type Point } from '@plait/core';
import { base64ToBlob, boardToImage, boardToSvgData, download } from './common';
import { pickFile } from '../data/pick-file';
import { IMAGE_MIME_TYPES } from '../constants';
import { insertImage } from '../data/image';
import { getBackgroundColor } from './color';
import { TRANSPARENT } from '../constants/color';
import type { DrawnixBoard } from '../hooks/use-drawnix';
import { i18nInsidePlaitHook, type Translations } from '../i18n';

type ClipboardImageFormat = 'svg' | 'png';
type ExportElements = ReturnType<typeof getSelectedElements>;

const CLIPBOARD_MIME_TYPES: Record<ClipboardImageFormat, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
};

const COPY_TOAST_KEYS: Record<ClipboardImageFormat, keyof Translations> = {
  svg: 'toast.copyToClipboard.svg',
  png: 'toast.copyToClipboard.png',
};

const hasClipboardWriteSupport = () => {
  // Keep the ClipboardItem check local until the shared helper also covers it.
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard?.write &&
    typeof ClipboardItem !== 'undefined'
  );
};

const getClipboardItemSupports = () => {
  const clipboardItemWithSupports = ClipboardItem as typeof ClipboardItem & {
    supports?: (type: string) => boolean;
  };
  return clipboardItemWithSupports.supports;
};

export const canCopySelectionAs = (format: ClipboardImageFormat) => {
  if (!hasClipboardWriteSupport()) {
    return false;
  }
  const supports = getClipboardItemSupports();
  if (typeof supports === 'function') {
    return supports(CLIPBOARD_MIME_TYPES[format]);
  }
  return format === 'png';
};

const writeBlobToClipboard = async (
  format: ClipboardImageFormat,
  blob: Blob | null,
  fallbackPngBlob?: Blob | null
) => {
  if (!blob || !hasClipboardWriteSupport()) {
    return;
  }
  const item: Record<string, Blob> = { [CLIPBOARD_MIME_TYPES[format]]: blob };
  if (fallbackPngBlob) {
    item[CLIPBOARD_MIME_TYPES.png] = fallbackPngBlob;
  }
  await navigator.clipboard.write([new ClipboardItem(item)]);
};

const showCopySuccessToast = (
  board: PlaitBoard,
  format: ClipboardImageFormat,
  isTransparent: boolean
) => {
  const { t } = i18nInsidePlaitHook(board);

  (board as DrawnixBoard).showToast?.({
    type: 'success',
    message: t(COPY_TOAST_KEYS[format]),
    description: isTransparent ? t('toast.copyToClipboard.mode.transparent') : undefined,
  });
};

const getSvgBlob = async (board: PlaitBoard, isTransparent: boolean, elements?: ExportElements) => {
  const backgroundColor = getBackgroundColor(board) || 'white';
  const fillStyle = isTransparent ? TRANSPARENT : backgroundColor;
  const svgData = await boardToSvgData(board, {
    fillStyle,
    padding: 20,
    ratio: 4,
    elements,
    inlineStyleClassNames: '.plait-text-container',
    styleNames: ['position'],
  });
  return new Blob([svgData], { type: CLIPBOARD_MIME_TYPES.svg });
};

const getImageBlob = async (
  board: PlaitBoard,
  isTransparent: boolean,
  elements?: ExportElements
) => {
  const backgroundColor = getBackgroundColor(board) || 'white';
  const imageDataUrl = await boardToImage(board, {
    elements,
    fillStyle: isTransparent ? 'transparent' : backgroundColor,
  });
  return imageDataUrl ? base64ToBlob(imageDataUrl) : null;
};

const pngBlobToJpeg = (pngBlob: Blob, backgroundColor: string): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(pngBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(url);
        resolve(null);
        return;
      }
      // JPG شفافیت ندارد؛ پس‌زمینه همیشه پر می‌شود.
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    image.src = url;
  });
};

/**
 * تصویر تخته (یا موارد انتخاب‌شده) را به‌صورت Blob برمی‌گرداند تا میزبان دسکتاپ
 * آن را با پنجرهٔ ذخیرهٔ ویندوز ذخیره کند.
 */
export const exportBoardImage = async (
  board: PlaitBoard,
  format: 'svg' | 'png' | 'jpg'
): Promise<Blob | null> => {
  const exportTransparent = !!(board as DrawnixBoard).appState?.exportTransparent;
  const selectedElements = getSelectedElements(board);
  const elements = selectedElements.length > 0 ? selectedElements : undefined;
  if (format === 'svg') {
    return getSvgBlob(board, exportTransparent, elements);
  }
  if (format === 'png') {
    return getImageBlob(board, exportTransparent, elements);
  }
  const pngBlob = await getImageBlob(board, false, elements);
  if (!pngBlob) {
    return null;
  }
  return pngBlobToJpeg(pngBlob, getBackgroundColor(board) || 'white');
};

export const saveAsSvg = (board: PlaitBoard) => {
  const exportTransparent = !!(board as DrawnixBoard).appState?.exportTransparent;
  const selectedElements = getSelectedElements(board);
  return getSvgBlob(
    board,
    exportTransparent,
    selectedElements.length > 0 ? selectedElements : undefined
  ).then((blob) => {
    const imageName = `drawnix-${new Date().getTime()}.svg`;
    download(blob, imageName);
  });
};

export const saveAsPng = (board: PlaitBoard) => {
  const exportTransparent = !!(board as DrawnixBoard).appState?.exportTransparent;
  const selectedElements = getSelectedElements(board);
  getImageBlob(
    board,
    exportTransparent,
    selectedElements.length > 0 ? selectedElements : undefined
  ).then((imageBlob) => {
    if (imageBlob) {
      const ext = 'png';
      const imageName = `drawnix-${new Date().getTime()}.${ext}`;
      download(imageBlob, imageName);
    }
  });
};

export const copySelectionAsSvg = async (board: PlaitBoard) => {
  const copyTransparent = !!(board as DrawnixBoard).appState?.copyTransparent;
  const selectedElements = getSelectedElements(board);
  if (selectedElements.length === 0) {
    return;
  }
  const [blob, pngBlob] = await Promise.all([
    getSvgBlob(board, copyTransparent, selectedElements),
    getImageBlob(board, copyTransparent, selectedElements),
  ]);
  await writeBlobToClipboard('svg', blob, pngBlob);
  showCopySuccessToast(board, 'svg', copyTransparent);
};

export const copySelectionAsPng = async (board: PlaitBoard) => {
  const copyTransparent = !!(board as DrawnixBoard).appState?.copyTransparent;
  const selectedElements = getSelectedElements(board);
  if (selectedElements.length === 0) {
    return;
  }
  const imageBlob = await getImageBlob(board, copyTransparent, selectedElements);
  if (!imageBlob) {
    return;
  }
  // The clipboard only gets image/png. The background choice is controlled by
  // how the image is rendered before writing to the clipboard.
  await writeBlobToClipboard('png', imageBlob);
  showCopySuccessToast(board, 'png', copyTransparent);
};

/** مقدار accept برای انتخاب تصویر: هم نوع MIME و هم پسوند (‎.jpg و ‎.jpeg هر دو). */
export const IMAGE_ACCEPT = [
  ...Object.values(IMAGE_MIME_TYPES),
  ...Object.keys(IMAGE_MIME_TYPES).map((extension) => `.${extension}`),
  '.jpeg',
].join(',');

/**
 * تصویر را درج می‌کند و اگر پرونده تصویرِ خواندنی نباشد، به‌جای شکستِ بی‌صدا پیام می‌دهد.
 */
export const insertImageFile = async (
  board: PlaitBoard,
  imageFile: File,
  startPoint?: Point,
  isDrop?: boolean
): Promise<boolean> => {
  try {
    await insertImage(board, imageFile, startPoint, isDrop);
    return true;
  } catch (error) {
    console.error('Failed to insert the image:', error);
    const { t } = i18nInsidePlaitHook(board);
    (board as DrawnixBoard).showToast?.({
      type: 'error',
      message: t('toast.imageInsertFailed'),
    });
    return false;
  }
};

export const addImage = async (board: PlaitBoard): Promise<boolean> => {
  const imageFile = await pickFile({ accept: IMAGE_ACCEPT });
  if (!imageFile) {
    return false;
  }
  return insertImageFile(board, imageFile);
};
