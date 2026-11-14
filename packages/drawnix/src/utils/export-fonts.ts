/**
 * جاسازی قلم‌های وب در SVG برون‌بری‌شده.
 *
 * متنِ روی تخته با قلمی رسم و اندازه‌گیری می‌شود که برنامه با ‎@font-face بار کرده است
 * (وزیرمتن). ولی SVGای که به‌صورت «تصویر» رسم می‌شود (برای ساختن PNG/JPG) یا بیرون از برنامه
 * باز می‌شود به قلم‌های صفحه دسترسی ندارد و با قلم سیستم رسم می‌شود. پهنای قلم سیستم با پهنای
 * اندازه‌گیری‌شده یکی نیست؛ در نتیجه متن فارسی در کادرش به لبهٔ راست می‌چسبید و متن‌های
 * چندکلمه‌ای می‌شکستند و بخشی از آن‌ها بریده می‌شد.
 *
 * این‌جا همان قلم‌ها به‌صورت data URL داخل خود SVG گذاشته می‌شوند تا خروجی دقیقاً مثل تخته
 * باشد. فقط قلم‌هایی جاسازی می‌شوند که متنِ همان خروجی واقعاً از آن‌ها استفاده می‌کند.
 */

export interface FontFaceSource {
  family: string;
  weight: string;
  style: string;
  /** نشانی مطلق پروندهٔ قلم (یا data URL) */
  url: string;
  format?: string;
}

export type FontLoader = (url: string) => Promise<string>;

const stripQuotes = (value: string) => value.trim().replace(/^['"]|['"]$/g, '');

const decodeXmlAttribute = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const splitFamilies = (stack: string) =>
  stack
    .split(',')
    .map(stripQuotes)
    .filter((family) => family.length > 0);

const isBoldWeight = (weight: string) => {
  const value = weight.trim().toLowerCase();
  if (value === 'bold' || value === 'bolder') {
    return true;
  }
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) && numeric >= 600;
};

/** فهرست قلم‌ها (font-family) و این‌که متن ضخیم در SVG هست یا نه. */
export const readFontUsage = (svgData: string) => {
  const stacks = new Set<string>();
  let bold = false;
  const collect = (css: string) => {
    for (const declaration of css.split(';')) {
      const separator = declaration.indexOf(':');
      if (separator < 0) {
        continue;
      }
      const name = declaration.slice(0, separator).trim().toLowerCase();
      const value = declaration.slice(separator + 1).trim();
      if (name === 'font-family' && value) {
        stacks.add(value);
      } else if (name === 'font-weight' && isBoldWeight(value)) {
        bold = true;
      }
    }
  };
  for (const match of svgData.matchAll(/\sstyle="([^"]*)"/g)) {
    collect(decodeXmlAttribute(match[1]));
  }
  for (const match of svgData.matchAll(/\sfont-family="([^"]*)"/g)) {
    stacks.add(decodeXmlAttribute(match[1]));
  }
  if (/\sfont-weight="(bold|[6-9]00)"/.test(svgData)) {
    bold = true;
  }
  return { stacks: Array.from(stacks).map(splitFamilies), bold };
};

const FONT_FACE_RULE = 5;

/** همهٔ قاعده‌های ‎@font-face صفحه که نشانی پرونده دارند. */
export const readDocumentFontFaces = (doc: Document = document): FontFaceSource[] => {
  const faces: FontFaceSource[] = [];
  const visit = (rules: CSSRuleList | undefined, baseUrl: string) => {
    if (!rules) {
      return;
    }
    for (const rule of Array.from(rules)) {
      if (rule.type === FONT_FACE_RULE) {
        const style = (rule as CSSFontFaceRule).style;
        const family = stripQuotes(style.getPropertyValue('font-family'));
        const source = /url\(\s*(['"]?)(.*?)\1\s*\)(?:\s*format\(\s*(['"]?)(.*?)\3\s*\))?/.exec(
          style.getPropertyValue('src')
        );
        if (!family || !source) {
          continue;
        }
        let url = source[2];
        try {
          url = new URL(url, baseUrl).href;
        } catch {
          continue;
        }
        faces.push({
          family,
          weight: style.getPropertyValue('font-weight').trim() || '400',
          style: style.getPropertyValue('font-style').trim() || 'normal',
          url,
          format: source[4] || undefined,
        });
      } else if ('cssRules' in rule) {
        visit((rule as CSSGroupingRule).cssRules, baseUrl);
      }
    }
  };
  for (const sheet of Array.from(doc.styleSheets)) {
    let rules: CSSRuleList | undefined;
    try {
      rules = sheet.cssRules;
    } catch {
      // برگهٔ سبکِ بیگانه (cross-origin) خواندنی نیست.
      continue;
    }
    visit(rules, sheet.href || doc.baseURI);
  }
  return faces;
};

/**
 * مرورگر از هر فهرست font-family اولین قلمِ در دسترس را برمی‌دارد؛ پس از هر فهرست فقط اولین
 * نامی که ‎@font-face دارد لازم است. قلم ضخیم فقط وقتی می‌آید که متن ضخیم وجود داشته باشد.
 */
export const selectFontFaces = (
  usage: ReturnType<typeof readFontUsage>,
  faces: FontFaceSource[]
): FontFaceSource[] => {
  const known = new Map<string, FontFaceSource[]>();
  for (const face of faces) {
    const key = face.family.toLowerCase();
    known.set(key, [...(known.get(key) ?? []), face]);
  }
  const selected: FontFaceSource[] = [];
  const seen = new Set<string>();
  for (const stack of usage.stacks) {
    const family = stack.find((name) => known.has(name.toLowerCase()));
    if (!family || seen.has(family.toLowerCase())) {
      continue;
    }
    seen.add(family.toLowerCase());
    const candidates = known.get(family.toLowerCase()) ?? [];
    const regular = candidates.filter((face) => !isBoldWeight(face.weight));
    const wanted = usage.bold || regular.length === 0 ? candidates : regular;
    selected.push(...wanted);
  }
  return selected;
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read the font file'));
    reader.readAsDataURL(blob);
  });

const requestBlob = (url: string) =>
  new Promise<Blob>((resolve, reject) => {
    // XMLHttpRequest، نه fetch: در برنامهٔ دسکتاپ قلم‌ها با ‎file:// بار می‌شوند و fetch این
    // طرح را نمی‌پذیرد.
    const request = new XMLHttpRequest();
    request.open('GET', url);
    request.responseType = 'blob';
    request.onload = () => {
      // پاسخ ‎file:// وضعیت 0 دارد.
      const ok = request.status === 0 || (request.status >= 200 && request.status < 300);
      const blob = request.response as Blob | null;
      if (ok && blob && blob.size > 0) {
        resolve(blob);
      } else {
        reject(new Error(`Failed to load the font file (${request.status})`));
      }
    };
    request.onerror = () => reject(new Error('Failed to load the font file'));
    request.send();
  });

const FONT_MIME_BY_EXTENSION: Record<string, string> = {
  woff2: 'font/woff2',
  woff: 'font/woff',
  ttf: 'font/ttf',
  otf: 'font/otf',
};

const dataUrlCache = new Map<string, Promise<string>>();

export const loadFontAsDataUrl: FontLoader = (url) => {
  if (url.startsWith('data:')) {
    return Promise.resolve(url);
  }
  let pending = dataUrlCache.get(url);
  if (!pending) {
    pending = requestBlob(url).then((blob) => {
      const extension = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(url)?.[1]?.toLowerCase() ?? '';
      const type = FONT_MIME_BY_EXTENSION[extension] ?? blob.type;
      // نوع پرونده را خودمان می‌گذاریم؛ پاسخ ‎file:// نوع ندارد.
      return blobToDataUrl(type && type !== blob.type ? new Blob([blob], { type }) : blob);
    });
    pending.catch(() => dataUrlCache.delete(url));
    dataUrlCache.set(url, pending);
  }
  return pending;
};

const cssString = (value: string) => `"${value.replace(/[\\"]/g, '\\$&')}"`;

export const buildFontFaceCss = async (
  faces: FontFaceSource[],
  loadFont: FontLoader = loadFontAsDataUrl
): Promise<string> => {
  const rules = await Promise.all(
    faces.map(async (face) => {
      try {
        const dataUrl = await loadFont(face.url);
        const format = face.format ? ` format(${cssString(face.format)})` : '';
        return (
          `@font-face{font-family:${cssString(face.family)};font-weight:${face.weight};` +
          `font-style:${face.style};src:url(${cssString(dataUrl)})${format};}`
        );
      } catch (error) {
        console.error('Failed to embed a font in the exported image:', error);
        return '';
      }
    })
  );
  return rules.join('');
};

export const EMBEDDED_FONTS_ATTRIBUTE = 'data-embedded-fonts';

/** قاعده‌های ‎@font-face را بلافاصله پس از برچسب آغازین ‎<svg> می‌گذارد. */
export const injectStyle = (svgData: string, css: string): string => {
  if (!css) {
    return svgData;
  }
  const start = svgData.indexOf('<svg');
  const end = start < 0 ? -1 : svgData.indexOf('>', start);
  if (end < 0) {
    return svgData;
  }
  // CSS داخل SVG متن XML است؛ نویسه‌های ویژه باید گریز داده شوند.
  const escaped = css.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return (
    svgData.slice(0, end + 1) +
    `<style ${EMBEDDED_FONTS_ATTRIBUTE}="true">${escaped}</style>` +
    svgData.slice(end + 1)
  );
};

export const embedFontsInSvg = async (
  svgData: string,
  options: { faces?: FontFaceSource[]; loadFont?: FontLoader } = {}
): Promise<string> => {
  try {
    const usage = readFontUsage(svgData);
    if (usage.stacks.length === 0) {
      return svgData;
    }
    const faces = selectFontFaces(usage, options.faces ?? readDocumentFontFaces());
    const css = await buildFontFaceCss(faces, options.loadFont);
    return injectStyle(svgData, css);
  } catch (error) {
    // برون‌بری نباید به‌خاطر قلم شکست بخورد؛ در بدترین حالت با قلم سیستم رسم می‌شود.
    console.error('Failed to embed fonts in the exported image:', error);
    return svgData;
  }
};
