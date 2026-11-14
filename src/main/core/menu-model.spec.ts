import { describe, expect, it } from 'vitest';
import type { AppCommand, RecentFile } from '../../shared/ipc';
import { buildMenuModel, flattenMenu } from './menu-model';

const recent: RecentFile[] = Array.from({ length: 10 }, (_, index) => ({
  path: `C:\\اسناد\\طرح ${index + 1}.drawnix`,
  name: `طرح ${index + 1}.drawnix`,
  openedAt: `2026-03-${String(20 - index).padStart(2, '0')}T08:00:00.000Z`,
}));

describe('buildMenuModel', () => {
  it('منوی فارسی: عنوان‌های اصلی', () => {
    const model = buildMenuModel('fa', []);
    expect(model.map((node) => node.label)).toEqual(['پرونده', 'ویرایش', 'نما', 'راهنما']);
  });

  it('هیچ برچسب فارسی حرف لاتین ندارد مگر نام قالب‌ها', () => {
    const labels = flattenMenu(buildMenuModel('fa', []))
      .map((node) => node.label)
      .filter((label): label is string => typeof label === 'string');
    expect(labels.length).toBeGreaterThan(15);
    for (const label of labels) {
      expect(label.replace(/PNG|JPG|SVG/g, '')).not.toMatch(/[A-Za-z]/);
    }
  });

  it('منوی انگلیسی همان ساختار را دارد', () => {
    const fa = flattenMenu(buildMenuModel('fa', recent));
    const en = flattenMenu(buildMenuModel('en', recent));
    expect(en.map((node) => node.id)).toEqual(fa.map((node) => node.id));
    expect(en.map((node) => node.command)).toEqual(fa.map((node) => node.command));
    expect(buildMenuModel('en', []).map((node) => node.label)).toEqual(['File', 'Edit', 'View', 'Help']);
  });

  it('همهٔ فرمان‌های برنامه در منو هستند', () => {
    const commands = new Set(
      flattenMenu(buildMenuModel('fa', []))
        .map((node) => node.command)
        .filter(Boolean)
    );
    const expected: AppCommand[] = [
      'file:new',
      'file:open',
      'file:recent',
      'file:save',
      'file:saveAs',
      'export:png',
      'export:jpg',
      'export:svg',
      'edit:undo',
      'edit:redo',
      'view:zoomIn',
      'view:zoomOut',
      'view:zoomReset',
      'view:zoomFit',
      'help:about',
    ];
    for (const command of expected) {
      expect(commands.has(command)).toBe(true);
    }
  });

  it('بدون پروندهٔ اخیر یک مورد غیرفعال نشان می‌دهد', () => {
    const nodes = flattenMenu(buildMenuModel('fa', []));
    const empty = nodes.find((node) => node.id === 'recent-empty');
    expect(empty?.enabled).toBe(false);
    expect(nodes.some((node) => node.openPath)).toBe(false);
  });

  it('حداکثر ۸ پروندهٔ اخیر با نام ایزوله‌شده و مسیر کامل', () => {
    const items = flattenMenu(buildMenuModel('fa', recent)).filter((node) => node.openPath);
    expect(items).toHaveLength(8);
    expect(items[0].label).toBe('\u2068طرح 1.drawnix\u2069');
    expect(items[0].openPath).toBe('C:\\اسناد\\طرح 1.drawnix');
  });

  it('شناسه‌ها یکتا هستند', () => {
    const ids = flattenMenu(buildMenuModel('fa', recent))
      .map((node) => node.id)
      .filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
