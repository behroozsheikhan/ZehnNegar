import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildFontFaceCss,
  embedFontsInSvg,
  injectStyle,
  readDocumentFontFaces,
  readFontUsage,
  selectFontFaces,
  type FontFaceSource,
} from './export-fonts';

const STACK = `-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, sans-serif`;

const svg = (spanStyle: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><g><foreignObject>` +
  `<div xmlns="http://www.w3.org/1999/xhtml" style="position: static;">` +
  `<span data-slate-node="text" style="${spanStyle}">کتاب</span></div></foreignObject></g></svg>`;

const face = (family: string, weight: string, file: string): FontFaceSource => ({
  family,
  weight,
  style: 'normal',
  url: `https://app.test/fonts/${file}`,
  format: 'woff2',
});

const FACES = [
  face('Vazirmatn', '400', 'regular.woff2'),
  face('-apple-system', '400', 'regular.woff2'),
  face('-apple-system', '700', 'bold.woff2'),
  face('Segoe UI', '400', 'regular.woff2'),
  face('Segoe UI', '700', 'bold.woff2'),
];

describe('readFontUsage', () => {
  it('فهرست قلم را از style درون‌خطی می‌خواند، حتی با ‎&quot;‎ که خودش «;» دارد', () => {
    const usage = readFontUsage(svg(`font-size: 14px; font-family: ${STACK}; font-weight: 400;`));
    expect(usage.stacks).toEqual([
      ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    ]);
    expect(usage.bold).toBe(false);
  });

  it('متن ضخیم را تشخیص می‌دهد', () => {
    expect(readFontUsage(svg(`font-family: ${STACK}; font-weight: 700;`)).bold).toBe(true);
    expect(readFontUsage(svg(`font-family: ${STACK}; font-weight: bold;`)).bold).toBe(true);
    expect(readFontUsage(svg(`font-family: ${STACK}; font-weight: 500;`)).bold).toBe(false);
  });

  it('ویژگی font-family روی عنصرهای SVG را هم می‌خواند', () => {
    const usage = readFontUsage('<svg><text font-family="Vazirmatn, serif" font-weight="700">a</text></svg>');
    expect(usage.stacks).toEqual([['Vazirmatn', 'serif']]);
    expect(usage.bold).toBe(true);
  });

  it('بدون متن، قلمی لازم نیست', () => {
    expect(readFontUsage('<svg><rect width="1" height="1"/></svg>').stacks).toEqual([]);
  });
});

describe('selectFontFaces', () => {
  it('از هر فهرست فقط اولین قلمِ دارای ‎@font-face‎ را برمی‌دارد (بدون تکرار پرونده)', () => {
    const usage = readFontUsage(svg(`font-family: ${STACK}; font-weight: 400;`));
    expect(selectFontFaces(usage, FACES)).toEqual([face('-apple-system', '400', 'regular.woff2')]);
  });

  it('قلم ضخیم فقط وقتی می‌آید که متن ضخیم وجود داشته باشد', () => {
    const usage = readFontUsage(
      svg(`font-family: ${STACK}; font-weight: 400;`) + svg(`font-family: ${STACK}; font-weight: 700;`)
    );
    expect(selectFontFaces(usage, FACES).map((item) => item.weight)).toEqual(['400', '700']);
  });

  it('نام قلم را بدون توجه به بزرگی و کوچکی حروف تطبیق می‌دهد', () => {
    const usage = readFontUsage(svg(`font-family: Arial, vazirmatn;`));
    expect(selectFontFaces(usage, FACES)).toEqual([face('Vazirmatn', '400', 'regular.woff2')]);
  });

  it('اگر هیچ قلمی از فهرست ‎@font-face‎ نداشته باشد چیزی برنمی‌گرداند', () => {
    expect(selectFontFaces(readFontUsage(svg(`font-family: Arial, sans-serif;`)), FACES)).toEqual([]);
  });
});

/** jsdom ویژگی src را از ‎@font-face‎ دور می‌ریزد؛ پس برگه‌های سبک شبیه‌سازی می‌شوند. */
const fontFaceRule = (declarations: Record<string, string>) => ({
  type: 5,
  style: { getPropertyValue: (name: string) => declarations[name] ?? '' },
});

describe('readDocumentFontFaces', () => {
  it('قاعده‌های ‎@font-face‎ را با نشانی مطلق (نسبت به برگهٔ سبک) می‌خواند', () => {
    const doc = {
      baseURI: 'file:///C:/app/index.html',
      styleSheets: [
        {
          href: 'file:///C:/app/assets/index.css',
          cssRules: [
            fontFaceRule({
              'font-family': "'Vazirmatn'",
              src: "url('./Vazirmatn-Regular.woff2') format('woff2')",
              'font-weight': '400',
              'font-style': 'normal',
            }),
            { type: 1, style: { getPropertyValue: () => 'Vazirmatn' } },
            // درون ‎@media‎ / ‎@layer
            {
              type: 4,
              cssRules: [
                fontFaceRule({
                  'font-family': '"-apple-system"',
                  src: 'url(../fonts/Vazirmatn-Bold.woff2) format("woff2")',
                  'font-weight': '700',
                }),
              ],
            },
            // بدون نشانی پرونده (قلم محلی) نادیده گرفته می‌شود.
            fontFaceRule({ 'font-family': 'Local', src: 'local("Tahoma")' }),
          ],
        },
        {
          // برگهٔ درون‌خطی: نشانی نسبت به خود صفحه
          href: null,
          cssRules: [
            fontFaceRule({ 'font-family': 'Inline', src: 'url("fonts/inline.woff")' }),
            fontFaceRule({ 'font-family': 'Embedded', src: 'url(data:font/woff2;base64,AAAA)' }),
          ],
        },
        {
          href: 'https://other.test/a.css',
          get cssRules(): never {
            throw new DOMException('cross-origin', 'SecurityError');
          },
        },
      ],
    } as unknown as Document;

    expect(readDocumentFontFaces(doc)).toEqual([
      {
        family: 'Vazirmatn',
        weight: '400',
        style: 'normal',
        url: 'file:///C:/app/assets/Vazirmatn-Regular.woff2',
        format: 'woff2',
      },
      {
        family: '-apple-system',
        weight: '700',
        style: 'normal',
        url: 'file:///C:/app/fonts/Vazirmatn-Bold.woff2',
        format: 'woff2',
      },
      {
        family: 'Inline',
        weight: '400',
        style: 'normal',
        url: 'file:///C:/app/fonts/inline.woff',
        format: undefined,
      },
      {
        family: 'Embedded',
        weight: '400',
        style: 'normal',
        url: 'data:font/woff2;base64,AAAA',
        format: undefined,
      },
    ]);
  });
});

describe('buildFontFaceCss / injectStyle / embedFontsInSvg', () => {
  const loadFont = vi.fn(async (url: string) => `data:font/woff2;base64,${btoa(url.split('/').pop() ?? '')}`);

  afterEach(() => {
    loadFont.mockClear();
    vi.restoreAllMocks();
  });

  it('قلم را به‌صورت data URL داخل ‎@font-face‎ می‌گذارد', async () => {
    const css = await buildFontFaceCss([face('-apple-system', '400', 'regular.woff2')], loadFont);
    expect(css).toBe(
      `@font-face{font-family:"-apple-system";font-weight:400;font-style:normal;` +
        `src:url("data:font/woff2;base64,${btoa('regular.woff2')}") format("woff2");}`
    );
  });

  it('style را درست پس از برچسب آغازین svg می‌گذارد و SVG معتبر می‌ماند', async () => {
    const source = svg(`font-family: ${STACK}; font-weight: 400;`);
    const result = await embedFontsInSvg(source, { faces: FACES, loadFont });

    expect(result.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><style data-embedded-fonts="true">@font-face{')).toBe(true);
    expect(result.endsWith(source.slice(source.indexOf('<g>')))).toBe(true);
    expect(loadFont).toHaveBeenCalledTimes(1);
    expect(loadFont).toHaveBeenCalledWith('https://app.test/fonts/regular.woff2');

    const parsed = new DOMParser().parseFromString(result, 'image/svg+xml');
    expect(parsed.querySelector('parsererror')).toBeNull();
    expect(parsed.documentElement.firstElementChild?.tagName).toBe('style');
    expect(parsed.querySelector('span')?.textContent).toBe('کتاب');
  });

  it('نویسه‌های ویژهٔ XML در CSS گریز داده می‌شوند', () => {
    expect(injectStyle('<svg a="1"><g/></svg>', 'a{content:"<&"}')).toBe(
      '<svg a="1"><style data-embedded-fonts="true">a{content:"&lt;&amp;"}</style><g/></svg>'
    );
  });

  it('SVG بدون متن یا بدون قلم شناخته‌شده دست‌نخورده می‌ماند', async () => {
    const noText = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
    expect(await embedFontsInSvg(noText, { faces: FACES, loadFont })).toBe(noText);
    const unknown = svg('font-family: Arial;');
    expect(await embedFontsInSvg(unknown, { faces: FACES, loadFont })).toBe(unknown);
    expect(loadFont).not.toHaveBeenCalled();
  });

  it('اگر بارگذاری قلم شکست بخورد، برون‌بری بدون آن قلم ادامه پیدا می‌کند', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const source = svg(`font-family: ${STACK}; font-weight: 700;`);
    const failing = vi.fn(async (url: string) => {
      if (url.endsWith('bold.woff2')) {
        throw new Error('offline');
      }
      return 'data:font/woff2;base64,AAAA';
    });

    const result = await embedFontsInSvg(source, { faces: FACES, loadFont: failing });

    expect(result.match(/@font-face/g)).toHaveLength(1);
    expect(result).toContain('font-weight:400');
    expect(error).toHaveBeenCalled();

    const allFailing = await embedFontsInSvg(source, {
      faces: FACES,
      loadFont: async () => {
        throw new Error('offline');
      },
    });
    expect(allFailing).toBe(source);
  });
});
