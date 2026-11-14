/**
 * متن‌های پوستهٔ برنامه (بیرون از Drawnix): پنجره‌های «درباره» و «پرونده‌های اخیر» و پیام‌ها.
 */
import type { FileErrorCode, UiLanguage } from '@shared/ipc';

export interface AppStrings {
  appName: string;
  tagline: string;
  untitled: string;
  loading: string;
  close: string;
  about: {
    title: string;
    version: string;
    featuresTitle: string;
    features: string[];
    creditTitle: string;
    creditBefore: string;
    creditLink: string;
    creditAfter: string;
    license: string;
    fontCredit: string;
    tech: string;
  };
  recent: {
    title: string;
    empty: string;
    emptyHint: string;
    clear: string;
    remove: string;
    open: string;
  };
  notice: {
    saved: string;
    exported: string;
    opened: string;
    restored: string;
    emptyExport: string;
    exportFailed: string;
    errors: Record<FileErrorCode, string>;
  };
}

const fa: AppStrings = {
  appName: 'ذهن‌نگار',
  tagline: 'تختهٔ سفید و نقشهٔ ذهنی فارسی، کاملاً آفلاین',
  untitled: 'بی‌نام',
  loading: 'در حال آماده‌سازی…',
  close: 'بستن',
  about: {
    title: 'دربارهٔ ذهن‌نگار',
    version: 'نسخهٔ',
    featuresTitle: 'قابلیت‌ها',
    features: [
      'نقشهٔ ذهنی با چیدمان خودکار و شاخه‌های رنگی',
      'فلوچارت با شکل‌ها، پیکان‌ها و اتصال هوشمند',
      'طراحی آزاد با قلم و پاک‌کن',
      'متن فارسی راست‌به‌چپ، پیوند و تصویر',
      'تبدیل متن Markdown و Mermaid به نقشه و نمودار',
      'خروجی تصویر با قالب‌های PNG و JPG و SVG؛ ذخیره در پروندهٔ ‎.drawnix',
      'ذخیرهٔ خودکار پیش‌نویس و فهرست پرونده‌های اخیر',
      'بدون نیاز به اینترنت؛ هیچ داده‌ای از رایانهٔ شما بیرون نمی‌رود',
    ],
    creditTitle: 'قدردانی',
    creditBefore: 'ذهن‌نگار بر پایهٔ پروژهٔ متن‌باز',
    creditLink: 'Drawnix',
    creditAfter:
      'و چارچوب Plait ساخته شده است. از سازندگان و مشارکت‌کنندگان این پروژه سپاسگزاریم. قالب پرونده‌ها با Drawnix سازگار است.',
    license: 'مجوز: MIT — حق نشر © ۲۰۲۴ Drawnix',
    fontCredit: 'قلم رابط: وزیرمتن، اثر زنده‌یاد صابر راستی‌کردار (مجوز OFL)',
    tech: 'موتور',
  },
  recent: {
    title: 'پرونده‌های اخیر',
    empty: 'هنوز پرونده‌ای باز نکرده‌اید.',
    emptyHint: 'پرونده‌هایی که باز یا ذخیره می‌کنید این‌جا فهرست می‌شوند.',
    clear: 'پاک کردن فهرست',
    remove: 'حذف از فهرست',
    open: 'باز کردن',
  },
  notice: {
    saved: 'پرونده ذخیره شد.',
    exported: 'خروجی ذخیره شد.',
    opened: 'پرونده باز شد.',
    restored: 'پیش‌نویس ذخیره‌نشدهٔ قبلی بازیابی شد.',
    emptyExport: 'تخته خالی است؛ چیزی برای خروجی گرفتن نیست.',
    exportFailed: 'ساختن خروجی ناموفق بود.',
    errors: {
      'not-found': 'پرونده پیدا نشد. شاید جابه‌جا یا حذف شده باشد.',
      'invalid-format': 'این پرونده یک پروندهٔ معتبر ذهن‌نگار (‎.drawnix) نیست.',
      'too-large': 'حجم پرونده بیش از اندازهٔ مجاز است.',
      'io-error': 'خواندن یا نوشتن پرونده ناموفق بود. دسترسی پوشه را بررسی کنید.',
    },
  },
};

const en: AppStrings = {
  appName: 'ZehnNegar',
  tagline: 'An offline whiteboard and mind-map app with a Persian-first interface',
  untitled: 'Untitled',
  loading: 'Getting ready…',
  close: 'Close',
  about: {
    title: 'About ZehnNegar',
    version: 'Version',
    featuresTitle: 'Features',
    features: [
      'Mind maps with automatic layout and coloured branches',
      'Flowcharts with shapes, arrows and smart connectors',
      'Freehand drawing with pen and eraser',
      'Right-to-left Persian text, links and images',
      'Convert Markdown and Mermaid text into maps and diagrams',
      'Export to PNG, JPG and SVG; save as .drawnix files',
      'Automatic draft saving and a recent-files list',
      'Works fully offline; nothing leaves your computer',
    ],
    creditTitle: 'Credits',
    creditBefore: 'ZehnNegar is built on the open-source project',
    creditLink: 'Drawnix',
    creditAfter:
      'and the Plait framework. Many thanks to its authors and contributors. Files stay compatible with Drawnix.',
    license: 'License: MIT — Copyright © 2024 Drawnix',
    fontCredit: 'Interface font: Vazirmatn by the late Saber Rastikerdar (OFL)',
    tech: 'Engine',
  },
  recent: {
    title: 'Recent files',
    empty: 'You have not opened any files yet.',
    emptyHint: 'Files you open or save are listed here.',
    clear: 'Clear list',
    remove: 'Remove from list',
    open: 'Open',
  },
  notice: {
    saved: 'File saved.',
    exported: 'Export saved.',
    opened: 'File opened.',
    restored: 'Your previous unsaved draft was restored.',
    emptyExport: 'The board is empty; there is nothing to export.',
    exportFailed: 'Could not create the export.',
    errors: {
      'not-found': 'File not found. It may have been moved or deleted.',
      'invalid-format': 'This is not a valid ZehnNegar (.drawnix) file.',
      'too-large': 'The file is larger than the allowed size.',
      'io-error': 'Could not read or write the file. Check the folder permissions.',
    },
  },
};

const STRINGS: Record<UiLanguage, AppStrings> = { fa, en };

export function getStrings(language: UiLanguage): AppStrings {
  return STRINGS[language] ?? fa;
}
