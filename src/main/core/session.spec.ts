import { describe, expect, it } from 'vitest';
import { InMemoryRepository } from './repository';
import { sanitizeDraft, SessionService } from './session';

describe('SessionService', () => {
  const now = (): Date => new Date('2026-03-21T08:00:00.000Z');

  it('پیش‌نویس را با زمان UTC ذخیره و بازیابی می‌کند', () => {
    const service = new SessionService(new InMemoryRepository(), now);
    expect(service.load()).toBeUndefined();
    service.saveDraft({ filePath: null, content: '{"متن":"پیش‌نویس"}', dirty: true });
    expect(service.load()).toEqual({
      filePath: null,
      content: '{"متن":"پیش‌نویس"}',
      dirty: true,
      updatedAt: '2026-03-21T08:00:00.000Z',
    });
    service.clear();
    expect(service.load()).toBeUndefined();
  });

  it('ورودی نامعتبر renderer را رد می‌کند', () => {
    const service = new SessionService(new InMemoryRepository(), now);
    expect(() => service.saveDraft(null)).toThrow(TypeError);
    expect(() => service.saveDraft({ filePath: 'a', content: 42 })).toThrow(TypeError);
  });
});

describe('sanitizeDraft', () => {
  it('مسیر خالی null و dirty فقط با true درست می‌شود', () => {
    expect(sanitizeDraft({ filePath: '', content: '{}', dirty: 'yes' })).toEqual({
      filePath: null,
      content: '{}',
      dirty: false,
    });
    expect(sanitizeDraft({ filePath: 'C:\\a.drawnix', content: '{}', dirty: true })).toEqual({
      filePath: 'C:\\a.drawnix',
      content: '{}',
      dirty: true,
    });
    expect(sanitizeDraft('متن')).toBeNull();
  });
});
