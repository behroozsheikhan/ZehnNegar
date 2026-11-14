import { describe, expect, it } from 'vitest';
import { commandForShortcut, isEditableTarget, type ShortcutEvent } from './shortcuts';

const key = (code: string, modifiers: Partial<ShortcutEvent> = {}): ShortcutEvent => ({
  code,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...modifiers,
});

describe('commandForShortcut', () => {
  it('میان‌برهای پرونده', () => {
    expect(commandForShortcut(key('KeyN', { ctrlKey: true }), false)).toBe('file:new');
    expect(commandForShortcut(key('KeyO', { ctrlKey: true }), false)).toBe('file:open');
    expect(commandForShortcut(key('KeyS', { ctrlKey: true }), false)).toBe('file:save');
    expect(commandForShortcut(key('KeyS', { ctrlKey: true, shiftKey: true }), false)).toBe('file:saveAs');
    expect(commandForShortcut(key('KeyE', { ctrlKey: true, shiftKey: true }), false)).toBe('export:png');
  });

  it('به کلید فیزیکی وابسته است، نه حرفِ چیدمان فارسی', () => {
    // با صفحه‌کلید فارسی، کلید S حرف «س» می‌دهد ولی code همان KeyS است.
    const persianLayoutEvent = { ...key('KeyS', { ctrlKey: true }), key: 'س' };
    expect(commandForShortcut(persianLayoutEvent, false)).toBe('file:save');
  });

  it('بزرگ‌نمایی', () => {
    expect(commandForShortcut(key('Equal', { ctrlKey: true }), false)).toBe('view:zoomIn');
    expect(commandForShortcut(key('NumpadAdd', { ctrlKey: true }), false)).toBe('view:zoomIn');
    expect(commandForShortcut(key('Minus', { ctrlKey: true }), false)).toBe('view:zoomOut');
    expect(commandForShortcut(key('Digit0', { ctrlKey: true }), false)).toBe('view:zoomReset');
  });

  it('واگرد/ازنو هنگام ویرایش متن به ویرایشگر سپرده می‌شود', () => {
    expect(commandForShortcut(key('KeyZ', { ctrlKey: true }), false)).toBe('edit:undo');
    expect(commandForShortcut(key('KeyZ', { ctrlKey: true, shiftKey: true }), false)).toBe('edit:redo');
    expect(commandForShortcut(key('KeyY', { ctrlKey: true }), false)).toBe('edit:redo');
    expect(commandForShortcut(key('KeyZ', { ctrlKey: true }), true)).toBeNull();
    expect(commandForShortcut(key('KeyY', { ctrlKey: true }), true)).toBeNull();
    // ذخیره حتی هنگام ویرایش متن کار می‌کند.
    expect(commandForShortcut(key('KeyS', { ctrlKey: true }), true)).toBe('file:save');
  });

  it('F1 «درباره» را باز می‌کند', () => {
    expect(commandForShortcut(key('F1'), false)).toBe('help:about');
  });

  it('کلیدهای دیگر یا ترکیب با Alt نادیده گرفته می‌شوند', () => {
    expect(commandForShortcut(key('KeyS'), false)).toBeNull();
    expect(commandForShortcut(key('KeyS', { ctrlKey: true, altKey: true }), false)).toBeNull();
    expect(commandForShortcut(key('KeyQ', { ctrlKey: true }), false)).toBeNull();
    expect(commandForShortcut(key('KeyN', { ctrlKey: true, shiftKey: true }), false)).toBeNull();
  });
});

describe('isEditableTarget', () => {
  it('ورودی‌ها و ناحیهٔ contenteditable را تشخیص می‌دهد', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    const inner = document.createElement('span');
    editable.append(inner);
    const button = document.createElement('button');
    document.body.append(input, textarea, editable, button);

    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(textarea)).toBe(true);
    expect(isEditableTarget(inner)).toBe(true);
    expect(isEditableTarget(button)).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});
