import { describe, expect, it } from 'vitest';
// @ts-expect-error اسکریپت جاوااسکریپت ساده بدون تعریف نوع
import { collectFailures, escapeData, escapeProperty } from './ci-e2e-report.mjs';

describe('ci-e2e-report', () => {
  it('متن را برای فرمان‌های GitHub Actions امن می‌کند', () => {
    expect(escapeData('۵۰% انجام شد\nخط دوم')).toBe('۵۰%25 انجام شد%0Aخط دوم');
    expect(escapeProperty('شروع: الف, ب')).toBe('شروع%3A الف%2C ب');
  });

  it('تست‌های ناموفق و ناپایدار را با عنوان کامل و پیام خطا بیرون می‌کشد', () => {
    const report = {
      suites: [
        {
          title: 'app.e2e.ts',
          specs: [],
          suites: [
            {
              title: 'شروع برنامه',
              specs: [
                { title: 'سالم', file: 'app.e2e.ts', line: 1, tests: [{ status: 'expected', results: [{ status: 'passed' }] }] },
                {
                  title: 'خراب',
                  file: 'app.e2e.ts',
                  line: 9,
                  tests: [
                    {
                      status: 'unexpected',
                      results: [
                        {
                          status: 'failed',
                          errors: [{ message: '\u001b[31mExpected: 2\u001b[39m' }],
                          stderr: [{ text: '[main] boom\n' }],
                          stdout: [],
                        },
                      ],
                    },
                  ],
                },
                {
                  title: 'ناپایدار',
                  file: 'app.e2e.ts',
                  line: 20,
                  tests: [
                    {
                      status: 'flaky',
                      results: [{ status: 'timedOut', errors: [{ message: 'Timeout' }] }, { status: 'passed' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const failures = collectFailures(report);
    expect(failures.map((failure: { title: string }) => failure.title)).toEqual([
      'شروع برنامه › خراب',
      'شروع برنامه › ناپایدار',
    ]);
    expect(failures[0]).toMatchObject({ message: 'Expected: 2', stderr: '[main] boom\n', flaky: false, line: 9 });
    expect(failures[1]).toMatchObject({ message: 'Timeout', flaky: true });
  });

  it('گزارش بدون شکست فهرست خالی می‌دهد', () => {
    expect(collectFailures({ suites: [] })).toEqual([]);
  });
});
