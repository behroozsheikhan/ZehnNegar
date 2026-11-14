import { describe, expect, it } from 'vitest';
import { compareRecent, InMemoryRepository } from './repository';
import { describeRepositoryContract } from './repository.contract';

describeRepositoryContract('InMemoryRepository', () => new InMemoryRepository());

describe('compareRecent', () => {
  it('جدیدتر را جلوتر می‌گذارد', () => {
    const older = { path: 'a', name: 'a', openedAt: '2026-01-01T00:00:00.000Z' };
    const newer = { path: 'b', name: 'b', openedAt: '2026-02-01T00:00:00.000Z' };
    expect([older, newer].sort(compareRecent)).toEqual([newer, older]);
  });
});
