#!/usr/bin/env node
/**
 * وصله‌های کوچک روی بسته‌های Plait (پس از npm install/ci اجرا می‌شود؛ idempotent).
 *
 * ۱) ‎@plait/common — اندازه‌گیری متن فارسی
 *    Plait پهنای متن را «حرف‌به‌حرف» با canvas اندازه می‌گیرد. در خط فارسی/عربی حروف به هم
 *    می‌چسبند و شکل جدا‌ی هر حرف پهن‌تر از شکل چسبیدهٔ آن است؛ در نتیجه کادر گره‌ها بزرگ‌تر
 *    از متن فارسی می‌شد. این وصله پهنای هر حرف را از تفاضل پهنای پیشوندها می‌گیرد (جمع آن‌ها
 *    دقیقاً پهنای واقعیِ متنِ شکل‌گرفته است) و برای متن لاتین نتیجه تغییری نمی‌کند.
 *
 * ۲) ‎@plait/mind — گرهٔ ناخواسته پس از انصراف از ابزار نقشهٔ ذهنی
 *    با ابزار نقشهٔ ذهنی پیش‌نمایش گره دنبال نشانگر می‌آید. اگر کاربر پیش از کلیک ابزار را
 *    عوض می‌کرد (مثلاً با V)، پیش‌نمایش پنهان می‌شد ولی اولین کلیک بعدی همچنان یک گره
 *    می‌ساخت. این وصله گرهٔ معلق را هنگام رها شدن کلیک، اگر ابزار دیگر «نقشهٔ ذهنی» نباشد،
 *    دور می‌ریزد.
 *
 * اگر الگویی در نسخهٔ نصب‌شده پیدا نشود، با خطا متوقف می‌شود تا بی‌صدا نادیده گرفته نشود.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const PATCHES = [
  {
    name: 'shaped-width',
    file: 'node_modules/@plait/common/fesm2022/plait-common.mjs',
    original: 'const width = ctx.measureText(char).width;',
    patched:
      'const width = ctx.measureText(textString.slice(0, i + 1)).width - ctx.measureText(textString.slice(0, i)).width; /* zehnnegar: shaped-width */',
  },
  {
    name: 'stale-mind',
    file: 'node_modules/@plait/mind/fesm2022/plait-mind.mjs',
    original: 'newBoard.pointerUp = (event) => {\n        if (emptyMind) {',
    patched:
      'newBoard.pointerUp = (event) => {\n' +
      '        if (emptyMind && !PlaitBoard.isPointer(board, MindPointerType.mind)) { emptyMind = null; destroy(); } /* zehnnegar: stale-mind */\n' +
      '        if (emptyMind) {',
  },
];

let failed = false;
for (const patch of PATCHES) {
  const target = join(root, patch.file);
  if (!existsSync(target)) {
    // نصب بدون devDependencies (مثلاً هنگام بسته‌بندی) — چیزی برای وصله کردن نیست.
    console.log(`[patch-plait] ${patch.name}: ${patch.file} not installed; skipped`);
    continue;
  }
  const source = readFileSync(target, 'utf8');
  if (source.includes(`/* zehnnegar: ${patch.name} */`)) {
    console.log(`[patch-plait] ${patch.name}: already patched`);
    continue;
  }
  const occurrences = source.split(patch.original).length - 1;
  if (occurrences !== 1) {
    console.error(
      `[patch-plait] ${patch.name}: expected exactly 1 occurrence of the pattern in ${patch.file}, found ${occurrences}. ` +
        'The Plait version changed; review scripts/patch-plait.mjs.'
    );
    failed = true;
    continue;
  }
  writeFileSync(target, source.replace(patch.original, patch.patched));
  console.log(`[patch-plait] ${patch.name}: patched`);
}

process.exit(failed ? 1 : 0);
