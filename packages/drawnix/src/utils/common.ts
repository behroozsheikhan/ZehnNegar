import {
  findElements,
  getRectangleByElements,
  IS_APPLE,
  IS_MAC,
  PlaitBoard,
  ToImageOptions,
  toSvgData,
} from '@plait/core';
import { embedFontsInSvg } from './export-fonts';
import type { ResolutionType } from './utility-types';

export const isPromiseLike = (value: any): value is Promise<ResolutionType<typeof value>> => {
  return (
    !!value &&
    typeof value === 'object' &&
    'then' in value &&
    'catch' in value &&
    'finally' in value
  );
};

// taken from Radix UI
// https://github.com/radix-ui/primitives/blob/main/packages/core/primitive/src/primitive.tsx
export const composeEventHandlers = <E>(
  originalEventHandler?: (event: E) => void,
  ourEventHandler?: (event: E) => void,
  { checkForDefaultPrevented = true } = {}
) => {
  return function handleEvent(event: E) {
    originalEventHandler?.(event);

    if (!checkForDefaultPrevented || !(event as unknown as Event)?.defaultPrevented) {
      return ourEventHandler?.(event);
    }
  };
};

export const base64ToBlob = (base64: string) => {
  const arr = base64.split(',');
  const fileType = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let l = bstr.length;
  const u8Arr = new Uint8Array(l);

  while (l--) {
    u8Arr[l] = bstr.charCodeAt(l);
  }
  return new Blob([u8Arr], {
    type: fileType,
  });
};

/**
 * SVG تخته با قلم‌های جاسازی‌شده (نگاه کنید به export-fonts.ts).
 */
export const boardToSvgData = async (board: PlaitBoard, options: ToImageOptions) => {
  return embedFontsInSvg(await toSvgData(board, options));
};

const loadSvgImage = (svgData: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
  });
};

/**
 * تخته را به PNG (data URL) تبدیل می‌کند. همان کار `toImage` در Plait است، با این تفاوت که
 * قلم‌های برنامه پیش از رسم داخل SVG جاسازی می‌شوند؛ وگرنه متن با قلم سیستم رسم می‌شد و در
 * کادرش جابه‌جا می‌افتاد.
 */
export const boardToImage = async (
  board: PlaitBoard,
  options: ToImageOptions = {}
): Promise<string | undefined> => {
  const merged: ToImageOptions = {
    fillStyle: 'transparent',
    inlineStyleClassNames: '.extend,.emojis,.text',
    padding: 20,
    ratio: 4,
    ...options,
  };
  const elements =
    merged.elements ||
    findElements(board, { match: () => true, recursion: () => true, isReverse: false });
  const { width, height } = getRectangleByElements(board, elements, false);
  const ratio = merged.ratio ?? 2;
  try {
    const svgData = await boardToSvgData(board, { ...merged, elements, fillStyle: '' });
    const image = await loadSvgImage(svgData);
    // decode صبر می‌کند تا قلم‌های جاسازی‌شده هم آماده شوند.
    await image.decode?.().catch(() => undefined);
    const canvas = document.createElement('canvas');
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }
    context.fillStyle = merged.fillStyle || 'transparent';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error converting SVG to image:', error);
    return undefined;
  }
};

export function download(blob: Blob | MediaSource, filename: string) {
  const a = document.createElement('a');
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

export const splitRows = <T>(shapes: T[], cols: number) => {
  const result = [];
  for (let i = 0; i < shapes.length; i += cols) {
    result.push(shapes.slice(i, i + cols));
  }
  return result;
};

export const getShortcutKey = (shortcut: string): string => {
  shortcut = shortcut
    .replace(/\bAlt\b/i, 'Alt')
    .replace(/\bShift\b/i, 'Shift')
    .replace(/\b(Enter|Return)\b/i, 'Enter');
  if (IS_APPLE || IS_MAC) {
    return shortcut.replace(/\bCtrlOrCmd\b/gi, 'Cmd').replace(/\bAlt\b/i, 'Option');
  }
  return shortcut.replace(/\bCtrlOrCmd\b/gi, 'Ctrl');
};
