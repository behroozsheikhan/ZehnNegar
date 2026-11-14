/**
 * دادهٔ نمونهٔ فارسی برای حالت mock (پیش‌نمایش مرورگر و تست‌های Vitest).
 */
import type { RecentFile } from '@shared/ipc';

interface SampleNode {
  id: string;
  type: 'mindmap' | 'mind_child';
  data: { topic: { type: 'paragraph'; children: { text: string }[] } };
  children: SampleNode[];
  [key: string]: unknown;
}

let counter = 0;

function node(text: string, children: SampleNode[] = []): SampleNode {
  counter += 1;
  return {
    id: `zn${counter.toString(36).padStart(4, '0')}`,
    type: 'mind_child',
    data: { topic: { type: 'paragraph', children: [{ text }] } },
    children,
  };
}

export function createSampleElements(): SampleNode[] {
  counter = 0;
  const root: SampleNode = {
    ...node('برنامهٔ سفر نوروزی', [
      node('مقصد', [node('شیراز'), node('اصفهان'), node('یزد')]),
      node('بودجه', [node('اقامت: ۱۲ میلیون تومان'), node('خوراک و رفت‌وآمد')]),
      node('کارهای پیش از سفر', [node('رزرو هتل'), node('سرویس خودرو'), node('خرید بلیت')]),
      node('دیدنی‌ها', [node('تخت جمشید'), node('نقش جهان'), node('باغ دولت‌آباد')]),
    ]),
    type: 'mindmap',
    layout: 'standard',
    isRoot: true,
    rightNodeCount: 2,
    points: [[0, 0]],
  };
  return [root];
}

export function createSampleDocument(): string {
  return JSON.stringify(
    {
      type: 'drawnix',
      version: 1,
      source: 'web',
      elements: createSampleElements(),
      viewport: { zoom: 1 },
    },
    null,
    2
  );
}

export const SAMPLE_RECENT_FILES: RecentFile[] = [
  {
    path: 'C:\\Users\\Sara\\Documents\\نقشه‌های ذهنی\\برنامهٔ سفر نوروزی.drawnix',
    name: 'برنامهٔ سفر نوروزی.drawnix',
    openedAt: '2026-03-18T08:30:00.000Z',
  },
  {
    path: 'C:\\Users\\Sara\\Documents\\کار\\جلسهٔ هفتگی تیم محصول.drawnix',
    name: 'جلسهٔ هفتگی تیم محصول.drawnix',
    openedAt: '2026-03-11T14:05:00.000Z',
  },
  {
    path: 'D:\\دانشگاه\\پایان‌نامه\\فصل دوم - مرور پیشینهٔ پژوهش و چارچوب نظری.drawnix',
    name: 'فصل دوم - مرور پیشینهٔ پژوهش و چارچوب نظری.drawnix',
    openedAt: '2026-02-27T19:45:00.000Z',
  },
  {
    path: 'C:\\Users\\Sara\\Desktop\\Roadmap 2026 Q2.drawnix',
    name: 'Roadmap 2026 Q2.drawnix',
    openedAt: '2026-02-02T06:10:00.000Z',
  },
];
