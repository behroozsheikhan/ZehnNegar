/**
 * میان‌برهای سراسری برنامه. منوی نیتیو فقط آن‌ها را «نمایش» می‌دهد؛ اجرا این‌جاست
 * تا رفتار در ویرایش متن (مثلاً Ctrl+Z داخل یک گره) خراب نشود.
 * کلید فیزیکی (event.code) ملاک است تا با صفحه‌کلید فارسی هم کار کند.
 */
import type { AppCommand } from '@shared/ipc';

export interface ShortcutEvent {
  code: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/** فرمان متناظر با یک رویداد صفحه‌کلید؛ null اگر میان‌بر برنامه نباشد. */
export function commandForShortcut(event: ShortcutEvent, editingText: boolean): AppCommand | null {
  if (event.code === 'F1' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    return 'help:about';
  }
  const mod = event.ctrlKey || event.metaKey;
  if (!mod || event.altKey) {
    return null;
  }
  if (event.shiftKey) {
    switch (event.code) {
      case 'KeyS':
        return 'file:saveAs';
      case 'KeyE':
        return 'export:png';
      case 'KeyZ':
        return editingText ? null : 'edit:redo';
      default:
        return null;
    }
  }
  switch (event.code) {
    case 'KeyN':
      return 'file:new';
    case 'KeyO':
      return 'file:open';
    case 'KeyS':
      return 'file:save';
    case 'Equal':
    case 'NumpadAdd':
      return 'view:zoomIn';
    case 'Minus':
    case 'NumpadSubtract':
      return 'view:zoomOut';
    case 'Digit0':
    case 'Numpad0':
      return 'view:zoomReset';
    // واگرد/ازنو هنگام ویرایش متن به خود ویرایشگر سپرده می‌شود.
    case 'KeyZ':
      return editingText ? null : 'edit:undo';
    case 'KeyY':
      return editingText ? null : 'edit:redo';
    default:
      return null;
  }
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable ||
    target.closest('[contenteditable="true"]') !== null
  );
}
