import { describe, expect, it, vi } from 'vitest';
import { createEditor, Editor, Node, Transforms, type Descendant } from 'slate';
import type { PlaitBoard } from '@plait/core';
import type { PlaitTextBoard, TextProps } from '@plait/common';
import { setBoardLanguage } from '../i18n';
import { installTypedDigits, withTypedDigits } from './with-typed-digits';

type DataEditor = Editor & { insertData: (data: DataTransfer) => void };

const paragraph = (text: string): Descendant[] => [{ children: [{ text }] }] as unknown as Descendant[];

/** ویرایشگر Slate با متن اولیه و مکان‌نما در انتهای آن؛ insertData مثل برنامه متن ساده را درج می‌کند. */
function editorWith(text: string) {
  const editor = createEditor() as DataEditor;
  editor.children = paragraph(text);
  Transforms.select(editor, Editor.end(editor, []));
  editor.insertData = (data) => editor.insertText(data.getData('text/plain'));
  return editor;
}

const dataTransfer = (text: string) => ({ getData: () => text }) as unknown as DataTransfer;

const type = (editor: Editor, text: string) => {
  for (const char of text) {
    editor.insertText(char);
  }
};

describe('installTypedDigits', () => {
  it('رقم‌های تایپ‌شده پس از متن فارسی، فارسی می‌شوند', () => {
    const editor = installTypedDigits(editorWith('هزینه'), () => true);
    type(editor, ' 12.5');
    expect(Node.string(editor)).toBe('هزینه ۱۲.۵');
  });

  it('در نوشتهٔ خالی هم رقم فارسی می‌شود', () => {
    const editor = installTypedDigits(editorWith(''), () => true);
    type(editor, '2026');
    expect(Node.string(editor)).toBe('۲۰۲۶');
  });

  it('پس از متن لاتین رقم لاتین می‌ماند', () => {
    const editor = installTypedDigits(editorWith('iPhone'), () => true);
    type(editor, ' 15');
    expect(Node.string(editor)).toBe('iPhone 15');
  });

  it('متنِ پیش از مکان‌نما ملاک است، نه متنِ پس از آن', () => {
    const editor = installTypedDigits(editorWith('قیمت dollars'), () => true);
    Transforms.select(editor, { path: [0, 0], offset: 'قیمت '.length });
    type(editor, '20 ');
    expect(Node.string(editor)).toBe('قیمت ۲۰ dollars');
  });

  it('وقتی متن انتخاب‌شده جایگزین می‌شود، متنِ پیش از انتخاب ملاک است', () => {
    const editor = installTypedDigits(editorWith('Central Topic'), () => true);
    // «تایپ برای شروع ویرایش»: کل متن انتخاب شده و جایگزین می‌شود.
    Transforms.select(editor, { anchor: Editor.start(editor, []), focus: Editor.end(editor, []) });
    Editor.insertText(editor, '1404');
    expect(Node.string(editor)).toBe('۱۴۰۴');
  });

  it('متن چسبانده‌شده دست‌نخورده می‌ماند و تایپِ پس از آن دوباره تبدیل می‌شود', () => {
    const editor = installTypedDigits(editorWith('مدل '), () => true) as DataEditor;
    editor.insertData(dataTransfer('206'));
    expect(Node.string(editor)).toBe('مدل 206');
    type(editor, ' 7');
    expect(Node.string(editor)).toBe('مدل 206 ۷');
  });

  it('اگر چسباندن خطا بدهد، تبدیل هنگام تایپ از کار نمی‌افتد', () => {
    const editor = editorWith('مدل ');
    editor.insertData = () => {
      throw new Error('clipboard');
    };
    installTypedDigits(editor, () => true);
    expect(() => editor.insertData(dataTransfer('206'))).toThrow('clipboard');
    type(editor, '7');
    expect(Node.string(editor)).toBe('مدل ۷');
  });

  it('وقتی غیرفعال است (رابط انگلیسی) چیزی تبدیل نمی‌شود و با عوض شدن زبان فوراً فعال می‌شود', () => {
    let enabled = false;
    const editor = installTypedDigits(editorWith('هزینه '), () => enabled);
    type(editor, '12');
    expect(Node.string(editor)).toBe('هزینه 12');
    enabled = true;
    type(editor, '3');
    expect(Node.string(editor)).toBe('هزینه 12۳');
  });

  it('دو بار نصب شدن، تبدیل را دو بار انجام نمی‌دهد', () => {
    const editor = editorWith('');
    const isEnabled = vi.fn(() => true);
    installTypedDigits(editor, isEnabled);
    installTypedDigits(editor, isEnabled);
    type(editor, '1');
    expect(isEnabled).toHaveBeenCalledTimes(1);
    expect(Node.string(editor)).toBe('۱');
  });
});

describe('withTypedDigits', () => {
  function setup(language: 'fa' | 'en') {
    const ref = { destroy: vi.fn(), update: vi.fn() };
    const renderText = vi.fn((_container: Element | DocumentFragment, props: TextProps) => {
      // مثل کامپوننت متن: ویرایشگر ساخته و به afterInit داده می‌شود.
      props.afterInit?.(editor);
      return ref;
    });
    const editor = editorWith('هزینه ');
    const board = { renderText } as unknown as PlaitBoard & PlaitTextBoard;
    setBoardLanguage(board, language);
    withTypedDigits(board);
    return { board, editor, ref, renderText };
  }

  const props = (afterInit?: TextProps['afterInit']) =>
    ({ text: { children: [{ text: '' }] }, afterInit }) as unknown as TextProps;

  it('در رابط فارسی، ویرایشگر متنِ هر گره رقم‌ها را فارسی می‌کند', () => {
    const { board, editor, ref } = setup('fa');
    const afterInit = vi.fn();
    const container = document.createElement('div');

    expect(board.renderText(container, props(afterInit))).toBe(ref);
    expect(afterInit).toHaveBeenCalledWith(editor);

    type(editor, '12');
    expect(Node.string(editor)).toBe('هزینه ۱۲');
  });

  it('در رابط انگلیسی رقم‌ها همان‌طور که تایپ شده‌اند می‌مانند', () => {
    const { board, editor } = setup('en');
    board.renderText(document.createElement('div'), props());
    type(editor, '12');
    expect(Node.string(editor)).toBe('هزینه 12');
  });

  it('با عوض شدن زبان رابط، رفتار همان ویرایشگر هم عوض می‌شود', () => {
    const { board, editor } = setup('en');
    board.renderText(document.createElement('div'), props());
    setBoardLanguage(board, 'fa');
    type(editor, '5');
    expect(Node.string(editor)).toBe('هزینه ۵');
  });

  it('بقیهٔ ویژگی‌ها بدون تغییر به renderText اصلی می‌رسند', () => {
    const { board, renderText } = setup('fa');
    const container = document.createElement('div');
    const original = { ...props(), readonly: true } as TextProps;
    board.renderText(container, original);
    expect(renderText.mock.calls[0][0]).toBe(container);
    expect(renderText.mock.calls[0][1]).toMatchObject({ text: original.text, readonly: true });
  });
});
