/**
 * جهت پیش‌فرض نقشهٔ ذهنی تازه: در رابط فارسی، ریشه سمت راست می‌ماند و شاخه‌ها به سمت چپ
 * باز می‌شوند (جهت خواندن فارسی). Plait نقشهٔ تازه را همیشه با چیدمان «right» می‌سازد.
 *
 * فقط نقشهٔ *خالیِ تازه* تغییر می‌کند؛ نقشه‌های موجود، پرونده‌های بازشده و چیزهایی که
 * چسبانده می‌شوند (با شاخه) دست‌نخورده می‌مانند. در رابط انگلیسی رفتار اصلی حفظ می‌شود.
 */
import type { PlaitBoard, PlaitOperation } from '@plait/core';
import { MindLayoutType } from '@plait/layouts';
import { i18nInsidePlaitHook } from '../i18n';

interface MindLike {
  type?: string;
  layout?: string;
  isRoot?: boolean;
  children?: unknown[];
}

export const isNewEmptyMind = (node: unknown): node is MindLike => {
  const mind = node as MindLike | null;
  return (
    !!mind &&
    // ریشهٔ نقشه در Plait نوع «mind» دارد («mindmap» نام قدیمی‌تر آن است).
    (mind.type === 'mind' || mind.type === 'mindmap') &&
    mind.layout === MindLayoutType.right &&
    (!Array.isArray(mind.children) || mind.children.length === 0)
  );
};

export const withMindDirection = (board: PlaitBoard) => {
  const { apply } = board;
  const i18n = i18nInsidePlaitHook(board);

  board.apply = (operation: PlaitOperation) => {
    if (
      operation.type === 'insert_node' &&
      operation.path.length === 1 &&
      i18n.language === 'fa' &&
      isNewEmptyMind(operation.node) &&
      !Object.isFrozen(operation.node)
    ) {
      // درجا تغییر می‌دهیم: Plait بلافاصله همین شیء را انتخاب می‌کند و اگر نسخهٔ دیگری
      // وارد تخته شود آن را پیدا نمی‌کند.
      operation.node.layout = MindLayoutType.left;
    }
    apply(operation);
  };

  return board;
};
