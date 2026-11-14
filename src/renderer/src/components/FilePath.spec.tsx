import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FilePath } from './FilePath';

describe('FilePath', () => {
  it('مسیر ویندوز با پوشه‌های فارسی را چپ‌به‌راست و بخش‌به‌بخش ایزوله نشان می‌دهد', () => {
    const path = 'C:\\Users\\Sara\\Documents\\کار\\جلسهٔ هفتگی.drawnix';
    render(<FilePath path={path} />);
    const element = screen.getByTestId('file-path');
    expect(element.getAttribute('dir')).toBe('ltr');
    expect(element.textContent).toBe(path);
    expect(element.getAttribute('title')).toBe(path);
    const parts = Array.from(element.querySelectorAll('bdi')).map((part) => part.textContent);
    expect(parts).toEqual(['C:', 'Users', 'Sara', 'Documents', 'کار', 'جلسهٔ هفتگی.drawnix']);
    // جهت پایهٔ هر بخش چپ‌به‌راست است تا پسوند در انتهای نام بماند، نه پیش از نام فارسی.
    for (const part of Array.from(element.querySelectorAll('bdi'))) {
      expect(part.getAttribute('dir')).toBe('ltr');
    }
  });

  it('مسیر یونیکس', () => {
    render(<FilePath path="/home/sara/نقشه‌ها" className="x" />);
    const element = screen.getByTestId('file-path');
    expect(element.className).toBe('x');
    expect(element.textContent).toBe('/home/sara/نقشه‌ها');
  });
});
