/**
 * متن‌های پروسهٔ اصلی (منوی نیتیو و پنجره‌های گفت‌وگوی سیستم) به فارسی و انگلیسی.
 */
import { APP_NAME_EN, APP_NAME_FA, type FileErrorCode, type UiLanguage } from '../../shared/ipc';

export interface MainMessages {
  appName: string;
  untitled: string;
  menuFile: string;
  menuEdit: string;
  menuView: string;
  menuHelp: string;
  fileNew: string;
  fileOpen: string;
  fileRecent: string;
  fileRecentEmpty: string;
  fileRecentMore: string;
  fileSave: string;
  fileSaveAs: string;
  fileExport: string;
  exportPng: string;
  exportJpg: string;
  exportSvg: string;
  fileExit: string;
  editUndo: string;
  editRedo: string;
  editCut: string;
  editCopy: string;
  editPaste: string;
  editSelectAll: string;
  viewZoomIn: string;
  viewZoomOut: string;
  viewZoomReset: string;
  viewZoomFit: string;
  viewFullscreen: string;
  helpAbout: string;
  dialogOpenTitle: string;
  dialogSaveTitle: string;
  dialogExportTitle: string;
  filterDocument: string;
  filterImage: string;
  filterAll: string;
  unsavedMessage: (name: string) => string;
  unsavedDetail: string;
  unsavedSave: string;
  unsavedDiscard: string;
  unsavedCancel: string;
  errorTitle: string;
  errors: Record<FileErrorCode, string>;
}

const fa: MainMessages = {
  appName: APP_NAME_FA,
  untitled: 'بی‌نام',
  menuFile: 'پرونده',
  menuEdit: 'ویرایش',
  menuView: 'نما',
  menuHelp: 'راهنما',
  fileNew: 'پروندهٔ جدید',
  fileOpen: 'باز کردن…',
  fileRecent: 'پرونده‌های اخیر',
  fileRecentEmpty: 'هنوز پرونده‌ای باز نشده است',
  fileRecentMore: 'همهٔ پرونده‌های اخیر…',
  fileSave: 'ذخیره',
  fileSaveAs: 'ذخیره با نام…',
  fileExport: 'برون‌بری تصویر',
  exportPng: 'تصویر PNG…',
  exportJpg: 'تصویر JPG…',
  exportSvg: 'تصویر SVG…',
  fileExit: 'خروج',
  editUndo: 'واگرد',
  editRedo: 'ازنو',
  editCut: 'برش',
  editCopy: 'رونوشت',
  editPaste: 'چسباندن',
  editSelectAll: 'انتخاب همه',
  viewZoomIn: 'بزرگ‌نمایی',
  viewZoomOut: 'کوچک‌نمایی',
  viewZoomReset: 'اندازهٔ واقعی (۱۰۰٪)',
  viewZoomFit: 'جا دادن در صفحه',
  viewFullscreen: 'تمام‌صفحه',
  helpAbout: `دربارهٔ ${APP_NAME_FA}`,
  dialogOpenTitle: 'باز کردن پرونده',
  dialogSaveTitle: 'ذخیرهٔ پرونده',
  dialogExportTitle: 'برون‌بری تصویر',
  filterDocument: `پروندهٔ ${APP_NAME_FA} / Drawnix`,
  filterImage: 'تصویر',
  filterAll: 'همهٔ پرونده‌ها',
  unsavedMessage: (name) => `تغییرات «${name}» ذخیره شود؟`,
  unsavedDetail: 'اگر ذخیره نکنید، تغییرات شما از بین می‌رود.',
  unsavedSave: 'ذخیره',
  unsavedDiscard: 'ذخیره نکن',
  unsavedCancel: 'انصراف',
  errorTitle: 'خطا',
  errors: {
    'not-found': 'پرونده پیدا نشد.',
    'invalid-format': 'این پرونده یک پروندهٔ معتبر Drawnix نیست.',
    'too-large': 'حجم پرونده بیش از حد مجاز است.',
    'io-error': 'خواندن یا نوشتن پرونده ممکن نشد.',
  },
};

const en: MainMessages = {
  appName: APP_NAME_EN,
  untitled: 'Untitled',
  menuFile: 'File',
  menuEdit: 'Edit',
  menuView: 'View',
  menuHelp: 'Help',
  fileNew: 'New File',
  fileOpen: 'Open…',
  fileRecent: 'Recent Files',
  fileRecentEmpty: 'No recent files',
  fileRecentMore: 'All Recent Files…',
  fileSave: 'Save',
  fileSaveAs: 'Save As…',
  fileExport: 'Export Image',
  exportPng: 'PNG Image…',
  exportJpg: 'JPG Image…',
  exportSvg: 'SVG Image…',
  fileExit: 'Exit',
  editUndo: 'Undo',
  editRedo: 'Redo',
  editCut: 'Cut',
  editCopy: 'Copy',
  editPaste: 'Paste',
  editSelectAll: 'Select All',
  viewZoomIn: 'Zoom In',
  viewZoomOut: 'Zoom Out',
  viewZoomReset: 'Actual Size (100%)',
  viewZoomFit: 'Fit to Screen',
  viewFullscreen: 'Full Screen',
  helpAbout: `About ${APP_NAME_EN}`,
  dialogOpenTitle: 'Open File',
  dialogSaveTitle: 'Save File',
  dialogExportTitle: 'Export Image',
  filterDocument: `${APP_NAME_EN} / Drawnix File`,
  filterImage: 'Image',
  filterAll: 'All Files',
  unsavedMessage: (name) => `Save changes to “${name}”?`,
  unsavedDetail: 'Your changes will be lost if you don’t save them.',
  unsavedSave: 'Save',
  unsavedDiscard: 'Don’t Save',
  unsavedCancel: 'Cancel',
  errorTitle: 'Error',
  errors: {
    'not-found': 'The file could not be found.',
    'invalid-format': 'This is not a valid Drawnix file.',
    'too-large': 'The file is too large.',
    'io-error': 'The file could not be read or written.',
  },
};

const MESSAGES: Record<UiLanguage, MainMessages> = { fa, en };

export function getMessages(language: UiLanguage): MainMessages {
  return MESSAGES[language] ?? fa;
}
