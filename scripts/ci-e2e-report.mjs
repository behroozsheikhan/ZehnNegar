#!/usr/bin/env node
/**
 * گزارش JSON تست‌های e2e را به annotationهای GitHub Actions تبدیل می‌کند تا علت شکست
 * هر تست مستقیماً در صفحهٔ اجرا (و از راه API) دیده شود، بدون نیاز به دانلود لاگ.
 *
 * GitHub در هر گام فقط ۱۰ annotation از هر سطح را نگه می‌دارد؛ برای همین شکست‌های
 * یازدهم به بعد با سطح warning و سپس notice ثبت می‌شوند.
 */
import { existsSync, readFileSync } from 'node:fs';

const file = process.argv[2] ?? 'e2e-artifacts/report.json';
const LIMIT_PER_LEVEL = 10;
const MAX_MESSAGE = 4000;

/** متن را برای فرمان‌های گردش‌کار GitHub امن می‌کند. */
export function escapeData(text) {
  return text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

export function escapeProperty(text) {
  return escapeData(text).replace(/:/g, '%3A').replace(/,/g, '%2C');
}

// eslint-disable-next-line no-control-regex
const stripAnsi = (text) => text.replace(/\u001b\[[0-9;]*m/g, '');

/** همهٔ تست‌های ناموفق را از درخت suiteها بیرون می‌کشد. */
export function collectFailures(report) {
  const failures = [];
  const visit = (suite, path) => {
    const here = suite.title && !suite.title.endsWith('.ts') ? [...path, suite.title] : path;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        if (test.status !== 'unexpected' && test.status !== 'flaky') continue;
        const failed = [...(test.results ?? [])].reverse().find((result) => result.status !== 'passed');
        const errors = (failed?.errors ?? []).map((error) => stripAnsi(error.message ?? error.stack ?? ''));
        failures.push({
          title: [...here, spec.title].join(' › '),
          file: spec.file,
          line: spec.line,
          flaky: test.status === 'flaky',
          message: errors.join('\n---\n') || `status: ${failed?.status ?? 'unknown'}`,
          stderr: (failed?.stderr ?? []).map((chunk) => chunk.text ?? '').join(''),
          stdout: (failed?.stdout ?? []).map((chunk) => chunk.text ?? '').join(''),
        });
      }
    }
    for (const child of suite.suites ?? []) visit(child, here);
  };
  for (const suite of report.suites ?? []) visit(suite, []);
  return failures;
}

function main() {
  if (!existsSync(file)) {
    console.log(`::warning title=e2e::${escapeData(`report not found: ${file}`)}`);
    return;
  }
  const report = JSON.parse(readFileSync(file, 'utf8'));
  const failures = collectFailures(report);
  const stats = report.stats ?? {};
  console.log(
    `::notice title=e2e summary::${escapeData(
      `expected=${stats.expected ?? '?'} unexpected=${stats.unexpected ?? '?'} flaky=${stats.flaky ?? '?'} skipped=${stats.skipped ?? '?'}`
    )}`
  );
  for (const error of report.errors ?? []) {
    console.log(`::error title=e2e global error::${escapeData(stripAnsi(error.message ?? '').slice(0, MAX_MESSAGE))}`);
  }
  failures.forEach((failure, index) => {
    const level = index < LIMIT_PER_LEVEL ? 'error' : index < LIMIT_PER_LEVEL * 2 ? 'warning' : 'notice';
    const output = [failure.stderr && `stderr:\n${failure.stderr.slice(-800)}`, failure.stdout && `stdout:\n${failure.stdout.slice(-800)}`]
      .filter(Boolean)
      .join('\n');
    const body = `${failure.message.slice(0, MAX_MESSAGE)}${output ? `\n\n${output}` : ''}`;
    const title = `${failure.flaky ? '[flaky] ' : ''}${failure.title}`;
    console.log(`::${level} title=${escapeProperty(title)}::${escapeData(body)}`);
  });
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('ci-e2e-report.mjs')) {
  main();
}
