import { describe, expect, it } from 'vitest';
import { RECENT_FILES_LIMIT, RecentFilesService } from './recent-files';
import { InMemoryRepository } from './repository';

function createClock(start = Date.UTC(2026, 2, 21, 8, 0, 0)): () => Date {
  let tick = 0;
  return () => new Date(start + 1000 * tick++);
}

describe('RecentFilesService', () => {
  it('جدیدترین پرونده اول می‌آید و نام از مسیر گرفته می‌شود', () => {
    const service = new RecentFilesService(new InMemoryRepository(), { now: createClock() });
    service.add('C:\\اسناد\\سفر.drawnix');
    const list = service.add('C:\\اسناد\\جلسه.drawnix');
    expect(list.map((file) => file.name)).toEqual(['جلسه.drawnix', 'سفر.drawnix']);
    expect(list[0].openedAt).toBe('2026-03-21T08:00:01.000Z');
  });

  it('باز کردن دوباره تکرار نمی‌سازد و پرونده را بالا می‌آورد', () => {
    const service = new RecentFilesService(new InMemoryRepository(), { now: createClock() });
    service.add('C:\\اسناد\\سفر.drawnix');
    service.add('C:\\اسناد\\جلسه.drawnix');
    const list = service.add('C:\\اسناد\\سفر.drawnix');
    expect(list.map((file) => file.name)).toEqual(['سفر.drawnix', 'جلسه.drawnix']);
  });

  it(`بیش از ${RECENT_FILES_LIMIT} مورد نگه نمی‌دارد`, () => {
    const repository = new InMemoryRepository();
    const service = new RecentFilesService(repository, { now: createClock() });
    for (let index = 1; index <= RECENT_FILES_LIMIT + 4; index += 1) {
      service.add(`D:\\طرح‌ها\\طرح ${index}.drawnix`);
    }
    expect(service.list()).toHaveLength(RECENT_FILES_LIMIT);
    expect(repository.listRecentFiles()).toHaveLength(RECENT_FILES_LIMIT);
    expect(service.list()[0].name).toBe(`طرح ${RECENT_FILES_LIMIT + 4}.drawnix`);
  });

  it('مسیر خالی اضافه نمی‌شود؛ حذف و پاک‌سازی کار می‌کنند', () => {
    const service = new RecentFilesService(new InMemoryRepository(), { now: createClock(), limit: 3 });
    expect(service.add('   ')).toEqual([]);
    service.add('a.drawnix');
    service.add('b.drawnix');
    expect(service.remove('a.drawnix').map((file) => file.path)).toEqual(['b.drawnix']);
    expect(service.clear()).toEqual([]);
    expect(service.list()).toEqual([]);
  });
});
