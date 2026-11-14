<div dir="rtl">

# ذهن‌نگار (ZehnNegar)

تخته‌سفید و **نقشهٔ ذهنی** فارسی برای ویندوز — کاملاً آفلاین، با رابط راست‌به‌چپ و قلم وزیرمتن.

ذهن‌نگار نسخهٔ دسکتاپ و فارسی‌شدهٔ پروژهٔ متن‌باز [Drawnix](https://github.com/plait-board/drawnix) است
(مجوز MIT). همهٔ داده‌ها فقط روی رایانهٔ خودتان می‌ماند و برنامه هیچ ارتباطی با اینترنت ندارد.

## قابلیت‌ها

- نقشهٔ ذهنی با چیدمان خودکار؛ در رابط فارسی ریشه سمت راست است و شاخه‌ها به چپ باز می‌شوند.
- فلوچارت، شکل‌ها، پیکان، متن، تصویر و طراحی آزاد با قلم.
- تایپ مستقیم فارسی: گره را انتخاب کنید و بنویسید؛ `Tab` شاخهٔ تازه و `Enter` گرهٔ هم‌سطح می‌سازد.
- میان‌برها به **کلید فیزیکی** وابسته‌اند و با چیدمان صفحه‌کلید فارسی هم کار می‌کنند (مثلاً `Ctrl+S`).
- پرونده‌های `.drawnix` (سازگار با Drawnix اصلی)؛ با دوبارکلیک روی پرونده در ویندوز باز می‌شوند.
- برون‌بری PNG، JPG و SVG.
- ذخیرهٔ خودکار پیش‌نویس و بازیابی پس از بسته‌شدن ناگهانی؛ فهرست پرونده‌های اخیر.
- منوی ویندوز، پنجره‌های گفت‌وگو و همهٔ پیام‌ها به فارسی؛ اعداد با ارقام فارسی، تاریخ شمسی.
- زبان انگلیسی هم از منوی برنامه ← «زبان» در دسترس است.

## نصب (ویندوز ۱۰ و ۱۱، ۶۴ بیتی)

نصب‌کننده در هر اجرای موفق GitHub Actions ساخته می‌شود:

1. در صفحهٔ مخزن به زبانهٔ **Actions** بروید و آخرین اجرای موفق گردش‌کار `build` را باز کنید.
2. از بخش **Artifacts** بستهٔ `ZehnNegar-windows-x64` را دانلود و از حالت فشرده خارج کنید.
3. `ZehnNegar-Setup-1.0.0-x64.exe` را اجرا کنید.

نصب‌کننده امضای دیجیتال ندارد؛ ویندوز SmartScreen ممکن است هشدار بدهد
(«More info» ← «Run anyway»).

## میان‌برها

| کار | میان‌بر |
| --- | --- |
| پروندهٔ جدید / باز کردن / ذخیره / ذخیره با نام | `Ctrl+N` / `Ctrl+O` / `Ctrl+S` / `Ctrl+Shift+S` |
| برون‌بری PNG | `Ctrl+Shift+E` |
| واگرد / ازنو | `Ctrl+Z` / `Ctrl+Y` |
| بزرگ‌نمایی / کوچک‌نمایی / ۱۰۰٪ | `Ctrl+=` / `Ctrl+-` / `Ctrl+0` |
| دربارهٔ برنامه | `F1` |
| ابزارها (وقتی چیزی انتخاب نشده) | `V` انتخاب، `H` دست، `M` نقشهٔ ذهنی، `T` متن، `R` مستطیل، `O` بیضی، `A` پیکان، `P` قلم، `E` پاک‌کن |

## توسعه

پیش‌نیاز: **Node.js 22.12 یا جدیدتر** (Electron 45 به آن نیاز دارد).

```bash
npm ci

# ویندوز
npm run dev:win        # اجرای برنامه در حالت توسعه
npm run build          # ساخت خروجی در out/
npm run pack:win       # ساخت نصب‌کننده در release/

# لینوکس (محیط توسعهٔ کانتینری / CI)
bash scripts/bootstrap.sh   # کتابخانه‌های سیستم + xvfb + npm ci + آزمون ماژول نیتیو
npm run dev
```

پیش‌نمایش رابط در مرورگر، بدون Electron و با دادهٔ نمونهٔ فارسی:

```bash
npm run preview:web    # http://localhost:5173
```

### تست‌ها

| فرمان | چه چیزی را می‌آزماید |
| --- | --- |
| `npm run lint` | ESLint، نگهبان CSS منطقی (RTL) و بررسی تایپ |
| `npm test` | تست‌های واحد منطق برنامه و تست‌های رابط (Vitest + Testing Library) |
| `npm run test:db` | مخزن SQLite **درون Electron** (همان باینری که برنامه استفاده می‌کند) |
| `npm run test:db:node` | همان تست‌ها با Node معمولی (سریع، بدون Electron) |
| `npm run test:e2e` | برنامهٔ واقعی با Playwright (در لینوکس زیر xvfb؛ اول `npm run build`) |

در CI تست‌های e2e روی ویندوز هم روی **برنامهٔ بسته‌بندی‌شده** اجرا می‌شوند
(`ZN_EXECUTABLE=release/win-unpacked/ZehnNegar.exe npx playwright test`).

### ساختار

```
src/shared/          ارقام، تاریخ و قرارداد IPC (مشترک بین main و renderer)
src/main/core/       منطق برنامه بدون وابستگی به Electron (قابل تست با Node)
src/main/db/         مخزن SQLite (better-sqlite3) و مهاجرت‌ها
src/main/            پنجره، منوی نیتیو، پنجره‌های گفت‌وگو، IPC
src/preload/         پل امن window.api (contextIsolation)
src/renderer/        پوستهٔ فارسی برنامه (React) دور تختهٔ Drawnix
packages/            کد Drawnix 0.4.0 با ترجمهٔ فارسی، چیدمان RTL و پل میزبان دسکتاپ
e2e/                 تست‌های Playwright
scripts/             bootstrap، وصلهٔ Plait، نگهبان CSS منطقی
resources-build/     آیکن برنامه
```

داده‌های برنامه (تنظیمات، پرونده‌های اخیر، پیش‌نویس) در `zehnnegar.db` در پوشهٔ دادهٔ کاربر
(`%APPDATA%\ZehnNegar`) نگه‌داری می‌شود. تاریخ‌ها به‌صورت ISO-8601 (UTC) ذخیره و هنگام نمایش به
تقویم شمسی تبدیل می‌شوند.

### نکته‌های فنی و تصمیم‌ها

- **راست‌به‌چپ:** همهٔ CSS با ویژگی‌های منطقی (`inset-inline`، `margin-inline` و …) نوشته شده و
  `scripts/check-logical-css.mjs` در lint جلوی برگشت ویژگی‌های فیزیکی `left/right` را می‌گیرد.
  خودِ بوم (مختصات) چپ‌به‌راست می‌ماند و متن گره‌ها `dir="auto"` دارد.
- **اندازه‌گیری متن فارسی:** Plait پهنای متن را حرف‌به‌حرف اندازه می‌گرفت که برای حروف چسبان
  فارسی غلط است؛ `scripts/patch-plait.mjs` (در `postinstall`) آن را با اندازه‌گیری متنِ شکل‌گرفته
  جایگزین می‌کند.
- **قلم:** Vazirmatn نسخهٔ 33.003 (SIL OFL) درون برنامه بسته‌بندی شده است.
- **Node 22 به‌جای 20:** Electron 45، better-sqlite3 13 و `@electron/rebuild` 4 به Node ≥ 22.12
  نیاز دارند.
- **ماژول نیتیو:** better-sqlite3 13 باینری آمادهٔ N-API دارد که به نسخهٔ Electron وابسته نیست؛
  برای همین در بسته‌بندی `npmRebuild: false` است و فقط `win32-x64.node` در نصب‌کننده می‌آید.
  درستیِ آن با `test:db` (درون Electron، روی لینوکس و ویندوز) در CI سنجیده می‌شود.
- **زبان Chromium:** سوییچ `--lang` بر اساس زبان ذخیره‌شده (`fa` یا `en-US`) تنظیم می‌شود و فقط
  همین دو بستهٔ زبان در نصب‌کننده هست.
- **امنیت:** `contextIsolation` روشن، `nodeIntegration` خاموش، renderer در sandbox؛ پیوندهای
  بیرونی فقط در مرورگر سیستم باز می‌شوند و همهٔ مجوزهای وب (به‌جز کلیپ‌بورد) رد می‌شوند.

## قدردانی و مجوز

- بر پایهٔ [Drawnix](https://github.com/plait-board/drawnix) و چارچوب
  [Plait](https://github.com/worktile/plait) — مجوز MIT، © 2024 Drawnix
  (متن مجوز: [`packages/LICENSE-drawnix`](packages/LICENSE-drawnix)).
- قلم [Vazirmatn](https://github.com/rastikerdar/vazirmatn) اثر صابر راستی‌کردار — SIL Open Font
  License (متن مجوز: [`src/renderer/src/assets/fonts/LICENSE`](src/renderer/src/assets/fonts/LICENSE)).
- کد ذهن‌نگار با مجوز MIT منتشر می‌شود.

</div>

---

**ZehnNegar** is an offline Persian (RTL) desktop build of the open-source
[Drawnix](https://github.com/plait-board/drawnix) whiteboard / mind-map tool, packaged with Electron
for Windows. See the Persian section above for features, installation and development notes.
