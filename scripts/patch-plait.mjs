#!/usr/bin/env node
/**
 * وصلهٔ کوچک روی ‎@plait/common (پس از npm install/ci اجرا می‌شود؛ idempotent).
 *
 * چرا: Plait پهنای متن را «حرف‌به‌حرف» با canvas اندازه می‌گیرد. در خط فارسی/عربی حروف
 * به هم می‌چسبند و شکل جدا‌ی هر حرف پهن‌تر از شکل چسبیدهٔ آن است؛ در نتیجه کادر گره‌ها
 * بزرگ‌تر از متن فارسی می‌شد. این وصله پهنای هر حرف را از تفاضل پهنای پیشوندها می‌گیرد
 * (جمع آن‌ها دقیقاً پهنای واقعیِ متنِ شکل‌گرفته است) و برای متن لاتین نتیجه تغییری نمی‌کند.
 *
 * اگر الگو در نسخهٔ نصب‌شده پیدا نشود، با خطا متوقف می‌شود تا بی‌صدا نادیده گرفته نشود.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'node_modules/@plait/common/fesm2022/plait-common.mjs');

const ORIGINAL = 'const width = ctx.measureText(char).width;';
const PATCHED =
  'const width = ctx.measureText(textString.slice(0, i + 1)).width - ctx.measureText(textString.slice(0, i)).width; /* zehnnegar: shaped-width */';

if (!existsSync(target)) {
  // نصب بدون devDependencies (مثلاً هنگام بسته‌بندی) — چیزی برای وصله کردن نیست.
  console.log('[patch-plait] @plait/common not installed; skipped');
  process.exit(0);
}

const source = readFileSync(target, 'utf8');
if (source.includes(PATCHED)) {
  console.log('[patch-plait] already patched');
  process.exit(0);
}
const occurrences = source.split(ORIGINAL).length - 1;
if (occurrences !== 1) {
  console.error(
    `[patch-plait] expected exactly 1 occurrence of the measureText pattern, found ${occurrences}. ` +
      'The @plait/common version changed; review scripts/patch-plait.mjs.'
  );
  process.exit(1);
}
writeFileSync(target, source.replace(ORIGINAL, PATCHED));
console.log('[patch-plait] patched @plait/common text measurement for joined scripts');
