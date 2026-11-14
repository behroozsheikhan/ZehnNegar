/**
 * تست‌های دیتابیس واقعی (better-sqlite3).
 * با `npm run test:db` درون Node خودِ Electron اجرا می‌شوند تا ماژول نیتیو با همان ABI برنامه
 * بارگذاری شود. (`npm run test:db:node` همین‌ها را با Node معمولی اجرا می‌کند.)
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { describeRepositoryContract } from '../core/repository.contract';
import { RecentFilesService } from '../core/recent-files';
import { SettingsService } from '../core/settings';
import { LATEST_SCHEMA_VERSION, MIGRATIONS } from './migrations';
import { migrate, SqliteRepository } from './sqlite-repository';

describeRepositoryContract('SqliteRepository (:memory:)', () => new SqliteRepository(':memory:'));

describe('SqliteRepository on disk', () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'zehnnegar-db-'));
    file = join(dir, 'zehnnegar.db');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('داده‌ها پس از بستن و بازکردن دوباره باقی می‌مانند', () => {
    const first = new SqliteRepository(file);
    new SettingsService(first).update({ language: 'en', exportTransparent: true });
    new RecentFilesService(first, { now: () => new Date('2026-03-21T08:00:00.000Z') }).add(
      'C:\\Users\\Sara\\Documents\\برنامهٔ سفر نوروزی.drawnix'
    );
    first.saveSession({
      filePath: null,
      content: '{"type":"drawnix","elements":[],"viewport":{"zoom":1}}',
      dirty: true,
      updatedAt: '2026-03-21T08:00:01.000Z',
    });
    first.close();

    const second = new SqliteRepository(file);
    expect(new SettingsService(second).get()).toMatchObject({ language: 'en', exportTransparent: true });
    expect(second.listRecentFiles()).toEqual([
      {
        path: 'C:\\Users\\Sara\\Documents\\برنامهٔ سفر نوروزی.drawnix',
        name: 'برنامهٔ سفر نوروزی.drawnix',
        openedAt: '2026-03-21T08:00:00.000Z',
      },
    ]);
    expect(second.getSession()?.dirty).toBe(true);
    second.close();
  });

  it('تاریخ‌ها به‌صورت ISO-8601 UTC با ارقام لاتین ذخیره می‌شوند', () => {
    const repository = new SqliteRepository(file);
    new RecentFilesService(repository, { now: () => new Date('2026-03-21T08:00:00.000Z') }).add(
      'D:\\طرح.drawnix'
    );
    repository.close();

    const raw = new Database(file, { readonly: true });
    const row = raw.prepare('SELECT opened_at FROM recent_files').get() as { opened_at: string };
    raw.close();
    expect(row.opened_at).toBe('2026-03-21T08:00:00.000Z');
  });

  it('بستنِ دوباره خطا نمی‌دهد', () => {
    const repository = new SqliteRepository(file);
    repository.close();
    expect(() => repository.close()).not.toThrow();
  });
});

describe('migrations', () => {
  it('نسخه‌ها یکتا و صعودی‌اند', () => {
    const versions = MIGRATIONS.map((migration) => migration.version);
    expect(versions).toEqual([...versions].sort((a, b) => a - b));
    expect(new Set(versions).size).toBe(versions.length);
    expect(LATEST_SCHEMA_VERSION).toBe(versions[versions.length - 1]);
  });

  it('دیتابیس تازه به آخرین نسخه می‌رسد و جدول schema_version پر می‌شود', () => {
    const repository = new SqliteRepository(':memory:');
    expect(repository.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    repository.close();
  });

  it('اجرای دوبارهٔ migrate بی‌اثر است (idempotent)', () => {
    const db = new Database(':memory:');
    expect(migrate(db)).toBe(LATEST_SCHEMA_VERSION);
    expect(migrate(db)).toBe(LATEST_SCHEMA_VERSION);
    const rows = db.prepare('SELECT version, applied_at FROM schema_version ORDER BY version').all() as {
      version: number;
      applied_at: string;
    }[];
    expect(rows.map((row) => row.version)).toEqual(MIGRATIONS.map((migration) => migration.version));
    expect(rows[0].applied_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    db.close();
  });

  it('جدول‌های نسخهٔ ۱ ساخته شده‌اند', () => {
    const db = new Database(':memory:');
    migrate(db);
    const tables = (
      db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[]
    ).map((row) => row.name);
    expect(tables).toEqual(expect.arrayContaining(['recent_files', 'schema_version', 'session', 'settings']));
    db.close();
  });

  it('جدول session فقط یک ردیف می‌پذیرد', () => {
    const db = new Database(':memory:');
    migrate(db);
    const insert = db.prepare(
      "INSERT INTO session (id, file_path, content, dirty, updated_at) VALUES (?, NULL, '{}', 0, '2026-01-01T00:00:00.000Z')"
    );
    insert.run(1);
    expect(() => insert.run(2)).toThrow();
    db.close();
  });
});
