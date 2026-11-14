/**
 * «تایپ برای ویرایش»: وقتی عنصری انتخاب شده و کاربر شروع به نوشتن می‌کند، Plait ویرایش متن
 * را آغاز می‌کند ولی همان نویسهٔ اول (و هر چه تا فوکوس گرفتنِ ویرایشگر تایپ شود) را دور
 * می‌ریزد؛ «سلام» به «لام» تبدیل می‌شد. این‌جا آن نویسه‌ها نگه داشته می‌شوند تا پس از
 * فوکوس در ویرایشگر درج شوند.
 */
import type { PlaitBoard } from '@plait/core';

interface PendingText {
  text: string;
  startedAt: number;
}

/** اگر ویرایشگر به هر دلیل فوکوس نگیرد، صف پس از این مدت نادیده گرفته می‌شود. */
const PENDING_TTL_MS = 1000;

const PENDING = new WeakMap<PlaitBoard, PendingText>();

const NAMED_KEY = /^[A-Za-z][A-Za-z0-9]+$/;

/**
 * آیا این کلید متن تولید می‌کند؟ کلیدهای نام‌دار («Enter»، «ArrowLeft»، «Dead»، …) نه.
 * برخی کلیدهای صفحه‌کلید فارسی بیش از یک نویسه می‌دهند (مثل «لا»)، پس طول ملاک نیست.
 */
export const isPrintableKey = (event: KeyboardEvent): boolean => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) {
    return false;
  }
  const key = event.key;
  if (!key || key === ' ') {
    return false;
  }
  return key.length === 1 || !NAMED_KEY.test(key);
};

export const hasPendingTypedText = (board: PlaitBoard, now = Date.now()): boolean => {
  const pending = PENDING.get(board);
  if (!pending) {
    return false;
  }
  if (now - pending.startedAt > PENDING_TTL_MS) {
    PENDING.delete(board);
    return false;
  }
  return true;
};

export const queueTypedText = (board: PlaitBoard, text: string, now = Date.now()): void => {
  const pending = hasPendingTypedText(board, now) ? PENDING.get(board) : undefined;
  PENDING.set(board, { text: (pending?.text ?? '') + text, startedAt: pending?.startedAt ?? now });
};

/** متن در صف را برمی‌دارد و صف را خالی می‌کند. */
export const takeTypedText = (board: PlaitBoard, now = Date.now()): string => {
  const text = hasPendingTypedText(board, now) ? (PENDING.get(board)?.text ?? '') : '';
  PENDING.delete(board);
  return text;
};
