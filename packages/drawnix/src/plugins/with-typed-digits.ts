/**
 * در رابط فارسی، رقم‌هایی که کاربر روی تخته تایپ می‌کند فارسی می‌شوند (قاعده در
 * utils/typed-digits.ts). در رابط انگلیسی هیچ چیز تغییر نمی‌کند.
 *
 * تبدیل روی `insertText` ویرایشگر متن (Slate) انجام می‌شود: هم تایپ عادی و هم «تایپ برای شروع
 * ویرایش» از همین مسیر می‌گذرند. چسباندن و کشیدن‌ورهاکردن متن (`insertData`) مستثناست تا متنی
 * که از جای دیگر آمده همان‌طور که هست بماند.
 */
import type { PlaitBoard } from '@plait/core';
import type { PlaitTextBoard, TextProps } from '@plait/common';
import { Editor, Range } from 'slate';
import { i18nInsidePlaitHook } from '../i18n';
import { localizeTypedDigits } from '../utils/typed-digits';

const INSTALLED = new WeakSet<object>();

const textBeforeCursor = (editor: Editor): string => {
  const { selection } = editor;
  if (!selection) {
    return '';
  }
  try {
    return Editor.string(editor, {
      anchor: Editor.start(editor, []),
      // اگر متنی انتخاب شده باشد جایگزین می‌شود؛ آنچه پیش از آن است ملاک است.
      focus: Range.start(selection),
    });
  } catch {
    return '';
  }
};

export const installTypedDigits = (editor: Editor, isEnabled: () => boolean): Editor => {
  if (INSTALLED.has(editor)) {
    return editor;
  }
  INSTALLED.add(editor);

  const { insertText } = editor;
  const withData = editor as Editor & { insertData?: (data: DataTransfer) => void };
  const { insertData } = withData;
  let pasting = false;

  editor.insertText = (text, options) => {
    if (pasting || !isEnabled() || !/[0-9]/.test(text)) {
      insertText(text, options);
      return;
    }
    insertText(localizeTypedDigits(text, textBeforeCursor(editor)), options);
  };

  if (insertData) {
    withData.insertData = (data) => {
      pasting = true;
      try {
        insertData(data);
      } finally {
        pasting = false;
      }
    };
  }

  return editor;
};

export const withTypedDigits = (board: PlaitBoard) => {
  const textBoard = board as PlaitBoard & PlaitTextBoard;
  const { renderText } = textBoard;
  const i18n = i18nInsidePlaitHook(board);
  const isEnabled = () => i18n.language === 'fa';

  textBoard.renderText = (container, props: TextProps) => {
    return renderText(container, {
      ...props,
      afterInit: (editor) => {
        installTypedDigits(editor as Editor, isEnabled);
        props.afterInit?.(editor);
      },
    });
  };

  return board;
};
