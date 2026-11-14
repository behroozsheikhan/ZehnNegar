import { describe, expect, it } from 'vitest';
import { buildWindowTitle, documentName } from './window-title';

const FSI = '\u2068';
const PDI = '\u2069';

describe('buildWindowTitle', () => {
  it('سند بی‌نام فارسی', () => {
    expect(buildWindowTitle({ filePath: null, dirty: false }, 'fa')).toBe(`${FSI}بی‌نام${PDI} — ذهن‌نگار`);
  });

  it('تغییر ذخیره‌نشده با ● نشان داده می‌شود', () => {
    expect(buildWindowTitle({ filePath: 'C:\\اسناد\\سفر نوروزی.drawnix', dirty: true }, 'fa')).toBe(
      `● ${FSI}سفر نوروزی${PDI} — ذهن‌نگار`
    );
  });

  it('نام لاتین درون عنوان فارسی ایزوله می‌شود', () => {
    const title = buildWindowTitle({ filePath: 'C:\\Docs\\Roadmap 2026.drawnix', dirty: false }, 'fa');
    expect(title).toContain(`${FSI}Roadmap 2026${PDI}`);
  });

  it('عنوان انگلیسی', () => {
    expect(buildWindowTitle({ filePath: null, dirty: false }, 'en')).toBe(`${FSI}Untitled${PDI} — ZehnNegar`);
    expect(documentName('/home/a/plan.drawnix', 'en')).toBe('plan');
  });
});
