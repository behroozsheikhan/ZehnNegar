/**
 * مدل سند در renderer: تبدیل متن پرونده ↔ دادهٔ تخته، و نام نمایشی.
 * منطق خالص (بدون DOM) تا با Vitest آزموده شود.
 */
import type { PlaitElement, PlaitTheme, Viewport } from '@plait/core';

export interface BoardDocument {
  children: PlaitElement[];
  viewport?: Viewport;
  theme?: PlaitTheme;
}

export interface BoardSnapshot {
  children: PlaitElement[];
  viewport?: Viewport;
  theme?: PlaitTheme;
}

/** متن پرونده را می‌خواند؛ اگر قالب معتبر نباشد null. */
export function parseDocument(content: string): BoardDocument | null {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const raw = data as Record<string, unknown>;
  if (raw.type !== 'drawnix' || !Array.isArray(raw.elements)) {
    return null;
  }
  const viewport =
    typeof raw.viewport === 'object' && raw.viewport !== null ? (raw.viewport as Viewport) : undefined;
  const theme = typeof raw.theme === 'object' && raw.theme !== null ? (raw.theme as PlaitTheme) : undefined;
  return { children: raw.elements as PlaitElement[], viewport, theme };
}

/** همان قالب پروندهٔ Drawnix (سازگار با نسخهٔ وب). ارقام و کلیدها همیشه لاتین‌اند. */
export function serializeDocument(snapshot: BoardSnapshot): string {
  return JSON.stringify(
    {
      type: 'drawnix',
      version: 1,
      source: 'web',
      elements: snapshot.children,
      viewport: snapshot.viewport ?? { zoom: 1 },
      theme: snapshot.theme,
    },
    null,
    2
  );
}

/** نام پرونده بدون مسیر و پسوند؛ برای مسیرهای ویندوز و یونیکس. */
export function fileDisplayName(filePath: string | null, untitled: string): string {
  if (!filePath) {
    return untitled;
  }
  const base = filePath.split(/[\\/]/).pop() ?? '';
  const name = base.replace(/\.drawnix$/i, '');
  return name || untitled;
}

/** پوشهٔ دربرگیرندهٔ پرونده (برای نمایش در فهرست اخیر). */
export function fileDirectory(filePath: string): string {
  const index = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'));
  return index > 0 ? filePath.slice(0, index) : filePath;
}
