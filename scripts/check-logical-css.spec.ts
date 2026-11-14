import { describe, expect, it } from 'vitest';
// @ts-expect-error — اسکریپت جاوااسکریپتِ بدون تایپ
import { checkCss } from './check-logical-css.mjs';

const lines = (source: string): number[] =>
  (checkCss(source) as { line: number }[]).map((problem) => problem.line);

describe('check-logical-css', () => {
  it('ویژگی‌های فیزیکی را پیدا می‌کند', () => {
    const source = [
      '.a { left: 0; }',
      '.b { margin-right: 4px; }',
      '.c { padding-left: 1rem }',
      '.d { text-align: left; }',
      '.e { border-top-left-radius: 4px; }',
      '.f { float: right; }',
      '.g { border-left: 1px solid red; }',
      '.h {',
      '  right: 36px;',
      '}',
    ].join('\n');
    expect(lines(source)).toEqual([1, 2, 3, 4, 5, 6, 7, 9]);
  });

  it('ویژگی‌های منطقی و موارد مشابه بی‌خطر را می‌پذیرد', () => {
    const source = [
      '.a { inset-inline-start: 0; margin-inline-end: 4px; }',
      '.b { text-align: start; border-start-start-radius: 4px; }',
      '.c { justify-content: left; }',
      '.d { transform-origin: left top; background-position: right; }',
      '.e { direction: ltr; }',
      '.tool--left { color: red; }',
      '$copyright: 1;',
    ].join('\n');
    expect(lines(source)).toEqual([]);
  });

  it('توضیح‌ها را نادیده می‌گیرد', () => {
    const source = [
      '// left: 0;',
      '/* margin-left: 1px; */',
      '/*',
      '  padding-right: 2px;',
      '*/',
      '.a { color: red; /* right: 0 */ }',
    ].join('\n');
    expect(lines(source)).toEqual([]);
  });

  it('استثنای صریح با css-logical-ignore', () => {
    const source = [
      '.a { left: 0; /* css-logical-ignore: مختصات بوم */ }',
      '/* css-logical-ignore: مختصات بوم */',
      '.b { right: 0; }',
      '.c { right: 0; }',
    ].join('\n');
    expect(lines(source)).toEqual([4]);
  });
});
