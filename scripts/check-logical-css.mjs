#!/usr/bin/env node
/**
 * نگهبان راست‌به‌چپ: در CSS/SCSS فقط ویژگی‌های «منطقی» مجازند
 * (margin-inline-start، inset-inline-end، text-align: start و …).
 * ویژگی‌های فیزیکی left/right رابط فارسی را می‌شکنند و این‌جا رد می‌شوند.
 *
 * استثنا: اگر خطی واقعاً باید فیزیکی بماند (مثلاً مختصات بوم که جهت ندارد)، در همان خط یا
 * خط قبلش بنویسید:  css-logical-ignore: <دلیل>
 *
 * استفاده:  node scripts/check-logical-css.mjs [مسیر …]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DEFAULT_TARGETS = ['src/renderer', 'packages'];
const EXTENSIONS = new Set(['.css', '.scss']);
const IGNORED_DIRS = new Set(['node_modules', 'dist', 'out', 'release', 'fonts']);
const IGNORE_MARK = 'css-logical-ignore';

/** [الگو، پیشنهاد جایگزین] */
export const RULES = [
  [/(^|[\s;{])(left|right)\s*:/, 'inset-inline-start / inset-inline-end'],
  [/(^|[\s;{])(margin|padding)-(left|right)\s*:/, '$2-inline-start / $2-inline-end'],
  [/(^|[\s;{])border-(left|right)(-(width|style|color))?\s*:/, 'border-inline-start / border-inline-end'],
  [
    /(^|[\s;{])border-(top|bottom)-(left|right)-radius\s*:/,
    'border-start-start-radius / border-start-end-radius / border-end-start-radius / border-end-end-radius',
  ],
  [/(^|[\s;{])text-align\s*:\s*(left|right)\b/, 'text-align: start / end'],
  [/(^|[\s;{])(float|clear)\s*:\s*(left|right)\b/, 'float: inline-start / inline-end'],
];

/** متن یک پروندهٔ CSS/SCSS را بررسی می‌کند و فهرست خطاها را برمی‌گرداند. */
export function checkCss(source) {
  const problems = [];
  const lines = source.split(/\r?\n/);
  let inBlockComment = false;
  lines.forEach((rawLine, index) => {
    let line = rawLine;
    const ignored =
      rawLine.includes(IGNORE_MARK) || (index > 0 && lines[index - 1].includes(IGNORE_MARK));

    // حذف توضیح‌ها تا کلمهٔ left/right داخل توضیح خطا حساب نشود.
    if (inBlockComment) {
      const end = line.indexOf('*/');
      if (end === -1) {
        return;
      }
      line = line.slice(end + 2);
      inBlockComment = false;
    }
    line = line.replace(/\/\*.*?\*\//g, '');
    const start = line.indexOf('/*');
    if (start !== -1) {
      line = line.slice(0, start);
      inBlockComment = true;
    }
    line = line.replace(/(^|\s)\/\/.*$/, '');

    if (ignored) {
      return;
    }
    for (const [pattern, suggestion] of RULES) {
      const match = pattern.exec(line);
      if (match) {
        problems.push({ line: index + 1, text: rawLine.trim(), suggestion });
        break;
      }
    }
  });
  return problems;
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) {
      continue;
    }
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walk(full, files);
    } else if (EXTENSIONS.has(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  const targets = process.argv.slice(2);
  const roots = (targets.length > 0 ? targets : DEFAULT_TARGETS).map((target) => join(ROOT, target));
  const files = roots.flatMap((root) => (statSync(root).isDirectory() ? walk(root) : [root]));
  let count = 0;
  for (const file of files) {
    for (const problem of checkCss(readFileSync(file, 'utf8'))) {
      count += 1;
      console.error(
        `${relative(ROOT, file)}:${problem.line}  ${problem.text}\n    → use ${problem.suggestion}`
      );
    }
  }
  if (count > 0) {
    console.error(`\n[check-logical-css] ${count} physical CSS propert${count === 1 ? 'y' : 'ies'} found.`);
    process.exit(1);
  }
  console.log(`[check-logical-css] ok — ${files.length} files use logical properties only`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
