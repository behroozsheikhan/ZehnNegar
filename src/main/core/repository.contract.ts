/**
 * قرارداد مشترک `Repository`: هر پیاده‌سازی (درون‌حافظه‌ای و SQLite) باید همین رفتار را داشته باشد.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Repository } from './repository';

export function describeRepositoryContract(name: string, create: () => Repository): void {
  describe(`Repository contract — ${name}`, () => {
    let repository: Repository;

    beforeEach(() => {
      repository = create();
    });

    afterEach(() => {
      repository.close();
    });

    it('تنظیمات: مقدار نبوده undefined است و نوشتن دوباره جایگزین می‌کند', () => {
      expect(repository.getSetting('settings')).toBeUndefined();
      repository.setSetting('settings', '{"language":"fa"}');
      repository.setSetting('settings', '{"language":"en"}');
      expect(repository.getSetting('settings')).toBe('{"language":"en"}');
    });

    it('متن فارسی و نویسه‌های ویژه بدون تغییر ذخیره می‌شوند', () => {
      const value = 'نقشهٔ ذهنی «پایان‌نامه» — ۱۴۰۵ 🧠';
      repository.setSetting('note', value);
      expect(repository.getSetting('note')).toBe(value);
    });

    it('پرونده‌های اخیر: جدیدترین اول و بدون تکرار', () => {
      repository.upsertRecentFile({ path: 'C:\\اسناد\\الف.drawnix', name: 'الف.drawnix', openedAt: '2026-03-01T10:00:00.000Z' });
      repository.upsertRecentFile({ path: 'C:\\اسناد\\ب.drawnix', name: 'ب.drawnix', openedAt: '2026-03-02T10:00:00.000Z' });
      repository.upsertRecentFile({ path: 'C:\\اسناد\\الف.drawnix', name: 'الف.drawnix', openedAt: '2026-03-03T10:00:00.000Z' });

      const list = repository.listRecentFiles();
      expect(list.map((file) => file.name)).toEqual(['الف.drawnix', 'ب.drawnix']);
      expect(list[0].openedAt).toBe('2026-03-03T10:00:00.000Z');
    });

    it('پرونده‌های اخیر: حذف، کوتاه‌سازی و پاک‌سازی', () => {
      for (let day = 1; day <= 5; day += 1) {
        repository.upsertRecentFile({
          path: `D:\\طرح‌ها\\طرح ${day}.drawnix`,
          name: `طرح ${day}.drawnix`,
          openedAt: `2026-03-0${day}T08:00:00.000Z`,
        });
      }
      repository.trimRecentFiles(3);
      expect(repository.listRecentFiles().map((file) => file.name)).toEqual([
        'طرح 5.drawnix',
        'طرح 4.drawnix',
        'طرح 3.drawnix',
      ]);

      repository.removeRecentFile('D:\\طرح‌ها\\طرح 4.drawnix');
      expect(repository.listRecentFiles()).toHaveLength(2);

      repository.removeRecentFile('D:\\وجود-ندارد.drawnix');
      expect(repository.listRecentFiles()).toHaveLength(2);

      repository.clearRecentFiles();
      expect(repository.listRecentFiles()).toEqual([]);
    });

    it('نشست: فقط یک ردیف دارد و جایگزین می‌شود', () => {
      expect(repository.getSession()).toBeUndefined();
      repository.saveSession({ filePath: null, content: '{"a":1}', dirty: true, updatedAt: '2026-03-01T10:00:00.000Z' });
      repository.saveSession({
        filePath: 'C:\\اسناد\\سفر.drawnix',
        content: '{"متن":"سفر نوروزی"}',
        dirty: false,
        updatedAt: '2026-03-02T10:00:00.000Z',
      });
      expect(repository.getSession()).toEqual({
        filePath: 'C:\\اسناد\\سفر.drawnix',
        content: '{"متن":"سفر نوروزی"}',
        dirty: false,
        updatedAt: '2026-03-02T10:00:00.000Z',
      });

      repository.clearSession();
      expect(repository.getSession()).toBeUndefined();
    });

    it('نشست: مسیر null و پرچم dirty حفظ می‌شوند', () => {
      repository.saveSession({ filePath: null, content: '{}', dirty: true, updatedAt: '2026-03-05T00:00:00.000Z' });
      const session = repository.getSession();
      expect(session?.filePath).toBeNull();
      expect(session?.dirty).toBe(true);
    });
  });
}
