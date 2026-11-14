/**
 * آداپتور پنجره‌های گفت‌وگوی نیتیو ویندوز برای `DialogPort`.
 * توجه: توابع همیشه به شکل `dialog.showXxx(...)` صدا زده می‌شوند (بدون destructure)
 * تا تست‌های e2e بتوانند آن‌ها را جایگزین کنند.
 */
import { BrowserWindow, dialog, type FileFilter } from 'electron';
import { DOCUMENT_EXTENSION, type UiLanguage, type UnsavedChoice } from '../shared/ipc';
import type { DialogPort, SaveKind } from './core/app-service';
import { EXPORT_FORMATS } from './core/document';
import { getMessages } from './core/messages';

export function createDialogPort(getWindow: () => BrowserWindow | null): DialogPort {
  return {
    async pickOpenPath(language: UiLanguage): Promise<string | null> {
      const m = getMessages(language);
      const options = {
        title: m.dialogOpenTitle,
        properties: ['openFile' as const],
        filters: [
          { name: m.filterDocument, extensions: [DOCUMENT_EXTENSION] },
          { name: m.filterAll, extensions: ['*'] },
        ],
      };
      const win = getWindow();
      const result = win
        ? await dialog.showOpenDialog(win, options)
        : await dialog.showOpenDialog(options);
      return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
    },

    async pickSavePath(
      language: UiLanguage,
      kind: SaveKind,
      suggestedName: string
    ): Promise<string | null> {
      const m = getMessages(language);
      const filters: FileFilter[] =
        kind === 'document'
          ? [{ name: m.filterDocument, extensions: [DOCUMENT_EXTENSION] }]
          : [{ name: `${m.filterImage} ${kind.toUpperCase()}`, extensions: EXPORT_FORMATS[kind].extensions }];
      const options = {
        title: kind === 'document' ? m.dialogSaveTitle : m.dialogExportTitle,
        defaultPath: suggestedName,
        filters,
      };
      const win = getWindow();
      const result = win
        ? await dialog.showSaveDialog(win, options)
        : await dialog.showSaveDialog(options);
      return result.canceled || !result.filePath ? null : result.filePath;
    },
  };
}

/** پرسش «تغییرات ذخیره شود؟» پیش از بستن/باز کردن سند دیگر. */
export async function confirmUnsavedChanges(
  win: BrowserWindow | null,
  language: UiLanguage,
  documentName: string
): Promise<UnsavedChoice> {
  const m = getMessages(language);
  const options = {
    type: 'warning' as const,
    title: m.appName,
    message: m.unsavedMessage(documentName),
    detail: m.unsavedDetail,
    buttons: [m.unsavedSave, m.unsavedDiscard, m.unsavedCancel],
    defaultId: 0,
    cancelId: 2,
    noLink: true,
  };
  const result = win ? await dialog.showMessageBox(win, options) : await dialog.showMessageBox(options);
  return result.response === 0 ? 'save' : result.response === 1 ? 'discard' : 'cancel';
}
