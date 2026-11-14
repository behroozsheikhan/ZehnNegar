import { Translations } from '../types';

// نشانهٔ چپ‌به‌راست (LRM): میان‌برهایی مثل «Ctrl++» در متن راست‌به‌چپ به‌هم نریزند.
const LRM = '\u200E';

const faTranslations: Translations = {
  // Toolbar items
  'toolbar.hand': 'دست (جابه‌جایی صفحه) — H',
  'toolbar.selection': 'انتخاب — V',
  'toolbar.mind': 'نقشهٔ ذهنی — M',
  'toolbar.text': 'متن — T',
  'toolbar.arrow': 'پیکان — A',
  'toolbar.shape': 'شکل',
  'toolbar.image': 'تصویر — Ctrl+U',
  'toolbar.extraTools': 'ابزارهای بیشتر',

  'toolbar.pen': 'قلم — P',
  'toolbar.eraser': 'پاک‌کن — E',

  'toolbar.arrow.straight': 'پیکان مستقیم',
  'toolbar.arrow.elbow': 'پیکان شکسته',
  'toolbar.arrow.curve': 'پیکان خمیده',

  'toolbar.shape.rectangle': 'مستطیل — R',
  'toolbar.shape.ellipse': 'بیضی — O',
  'toolbar.shape.triangle': 'مثلث',
  'toolbar.shape.terminal': 'پایانه',
  'toolbar.shape.noteCurlyLeft': 'آکولاد یادداشت — چپ',
  'toolbar.shape.noteCurlyRight': 'آکولاد یادداشت — راست',
  'toolbar.shape.diamond': 'لوزی',
  'toolbar.shape.parallelogram': 'متوازی‌الاضلاع',
  'toolbar.shape.roundRectangle': 'مستطیل گوشه‌گرد',

  // Zoom controls
  'zoom.in': `بزرگ‌نمایی — Ctrl++${LRM}`,
  'zoom.out': `کوچک‌نمایی — Ctrl+-${LRM}`,
  'zoom.fit': 'جا دادن در صفحه',
  'zoom.100': 'بزرگ‌نمایی ۱۰۰٪',

  // Themes
  'theme.default': 'پیش‌فرض',
  'theme.colorful': 'رنگارنگ',
  'theme.soft': 'ملایم',
  'theme.retro': 'کلاسیک',
  'theme.dark': 'تیره',
  'theme.starry': 'شب پرستاره',

  // Colors
  'color.none': 'رنگ موضوع',
  'color.unknown': 'رنگ دیگر',
  'color.default': 'مشکی',
  'color.white': 'سفید',
  'color.gray': 'خاکستری',
  'color.deepBlue': 'آبی تیره',
  'color.red': 'قرمز',
  'color.green': 'سبز',
  'color.yellow': 'زرد',
  'color.purple': 'بنفش',
  'color.orange': 'نارنجی',
  'color.pastelPink': 'صورتی ملایم',
  'color.cyan': 'فیروزه‌ای',
  'color.brown': 'قهوه‌ای',
  'color.forestGreen': 'سبز جنگلی',
  'color.lightGray': 'خاکستری روشن',

  // General
  'general.undo': 'واگرد',
  'general.redo': 'ازنو',
  'general.menu': 'منوی برنامه',
  'general.moreOptions': 'گزینه‌های بیشتر',
  'general.duplicate': 'تکثیر',
  'general.delete': 'حذف',
  'general.copyToClipboard': 'کپی در کلیپ‌بورد',
  'general.copyToClipboard.svg': 'SVG',
  'general.copyToClipboard.png': 'PNG',
  'general.copyToClipboard.transparent': 'پس‌زمینهٔ شفاف',
  'toast.copyToClipboard.svg': 'موارد انتخاب‌شده به‌صورت SVG در کلیپ‌بورد کپی شد',
  'toast.copyToClipboard.png': 'موارد انتخاب‌شده به‌صورت PNG در کلیپ‌بورد کپی شد',
  'toast.copyToClipboard.mode.transparent': '(با پس‌زمینهٔ شفاف)',
  // Language
  'language.switcher': 'زبان',
  'language.persian': 'فارسی',
  'language.english': 'English',
  // Menu items
  'menu.new': 'پروندهٔ جدید',
  'menu.open': 'باز کردن…',
  'menu.recentFiles': 'پرونده‌های اخیر…',
  'menu.saveFile': 'ذخیره',
  'menu.saveAsFile': 'ذخیره با نام…',
  'menu.exportImage': 'برون‌بری تصویر',
  'menu.exportImage.svg': 'SVG',
  'menu.exportImage.png': 'PNG',
  'menu.exportImage.jpg': 'JPG',
  'menu.cleanBoard': 'پاک کردن تخته',
  'menu.github': 'GitHub',
  'menu.about': 'دربارهٔ ذهن‌نگار',

  // Dialog translations
  'dialog.mermaid.title': 'تبدیل Mermaid به نمودار',
  'dialog.mermaid.description': 'در حال حاضر پشتیبانی می‌شود:',
  'dialog.mermaid.flowchart': 'فلوچارت',
  'dialog.mermaid.sequence': 'نمودار توالی',
  'dialog.mermaid.class': 'نمودار کلاس',
  'dialog.mermaid.otherTypes': '؛ نمودارهای دیگر به‌صورت تصویر درج می‌شوند.',
  'dialog.mermaid.syntax': 'کد Mermaid',
  'dialog.mermaid.placeholder': 'تعریف نمودار Mermaid را اینجا بنویسید…',
  'dialog.mermaid.preview': 'پیش‌نمایش',
  'dialog.mermaid.insert': 'درج',
  'dialog.markdown.description': 'متن Markdown به‌طور خودکار به نقشهٔ ذهنی تبدیل می‌شود.',
  'dialog.markdown.syntax': 'متن Markdown',
  'dialog.markdown.placeholder': 'متن Markdown را اینجا بنویسید…',
  'dialog.markdown.preview': 'پیش‌نمایش',
  'dialog.markdown.insert': 'درج',
  'dialog.error.loadMermaid': 'بارگذاری کتابخانهٔ Mermaid ممکن نشد',

  // Extra tools menu items
  'extraTools.mermaidToDrawnix': 'تبدیل Mermaid به نمودار',
  'extraTools.markdownToDrawnix': 'تبدیل Markdown به نقشهٔ ذهنی',

  // Clean confirm dialog
  'cleanConfirm.title': 'پاک کردن تخته',
  'cleanConfirm.description': 'همهٔ محتوای تخته پاک می‌شود. ادامه می‌دهید؟',
  'cleanConfirm.cancel': 'انصراف',
  'cleanConfirm.ok': 'پاک کن',

  // Link popup items
  'popupLink.delLink': 'حذف پیوند',

  // Tool popup items
  'popupToolbar.fillColor': 'رنگ زمینه',
  'popupToolbar.fontSize': 'اندازهٔ قلم',
  'popupToolbar.fontColor': 'رنگ متن',
  'popupToolbar.link': 'درج پیوند',
  'popupToolbar.stroke': 'خط دور',
  'popupToolbar.opacity': 'میزان ماتی',

  // Text placeholders
  'textPlaceholders.link': 'پیوند',
  'textPlaceholders.text': 'متن',

  // Line tool
  'line.source': 'ابتدا',
  'line.target': 'انتها',
  'line.arrow': 'پیکان',
  'line.none': 'بدون نشانه',

  // Stroke style
  'stroke.solid': 'خط پیوسته',
  'stroke.dashed': 'خط‌چین',
  'stroke.dotted': 'نقطه‌چین',

  //markdown example
  'markdown.example': `# برنامهٔ سفر نوروزی

  - مقصدها 🧭
    - شیراز 🌸
      - حافظیه و باغ ارم
    - اصفهان 🕌
      - میدان نقش جهان و سی‌وسه‌پل

  - پیش از سفر 🧳
    - رزرو اقامتگاه
    - بازدید فنی خودرو 🚗
      - روغن، لاستیک و ترمز

  - بودجه 💰
    - اقامت
    - خوراک و سوغات 🍬

  ## یادآوری ⏰

  ### بلیت‌ها را زودتر بگیرید 🎫`,

  // Draw elements text
  'draw.lineText': 'متن',
  'draw.geometryText': 'متن',

  // Mind map elements text
  'mind.centralText': 'موضوع اصلی',
  'mind.abstractNodeText': 'خلاصه',

  'tutorial.title': 'ذهن‌نگار',
  'tutorial.description': 'تخته‌سفید همه‌کاره برای نقشهٔ ذهنی، فلوچارت، طراحی آزاد و …',
  'tutorial.dataDescription': 'همهٔ داده‌ها فقط روی رایانهٔ خودتان ذخیره می‌شود؛ بدون نیاز به اینترنت',
  'tutorial.appToolbar': 'پرونده، برون‌بری، زبان و …',
  'tutorial.creationToolbar': 'برای شروع، یک ابزار انتخاب کنید',
  'tutorial.themeDescription': 'جابه‌جایی بین پوسته‌های روشن و تیره',
};

export default faTranslations;
