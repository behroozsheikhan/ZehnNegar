/**
 * پیاده‌سازی `Repository` با better-sqlite3.
 * نسخهٔ ۱۳ این کتابخانه روی N-API است و باینری آماده برای هر سکو را همراه دارد؛
 * بنابراین همان بسته هم در Node معمولی و هم در Node الکترون بدون rebuild بارگذاری می‌شود.
 */
import Database from 'better-sqlite3';
import type { RecentFile } from '../../shared/ipc';
import type { Repository, SessionRow } from '../core/repository';
import { MIGRATIONS } from './migrations';

type Db = InstanceType<typeof Database>;

export class SqliteRepository implements Repository {
  private readonly db: Db;

  /** `filename` مسیر پروندهٔ دیتابیس است؛ `:memory:` برای تست. */
  constructor(filename: string) {
    this.db = new Database(filename);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');
    migrate(this.db);
  }

  get schemaVersion(): number {
    return currentVersion(this.db);
  }

  getSetting(key: string): string | undefined {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
      | { value: string }
      | undefined;
    return row?.value;
  }

  setSetting(key: string, value: string): void {
    this.db
      .prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
      )
      .run(key, value);
  }

  listRecentFiles(): RecentFile[] {
    return this.db
      .prepare(
        'SELECT path, name, opened_at AS openedAt FROM recent_files ORDER BY opened_at DESC, path ASC'
      )
      .all() as RecentFile[];
  }

  upsertRecentFile(file: RecentFile): void {
    this.db
      .prepare(
        `INSERT INTO recent_files (path, name, opened_at) VALUES (@path, @name, @openedAt)
         ON CONFLICT(path) DO UPDATE SET name = excluded.name, opened_at = excluded.opened_at`
      )
      .run(file);
  }

  removeRecentFile(path: string): void {
    this.db.prepare('DELETE FROM recent_files WHERE path = ?').run(path);
  }

  clearRecentFiles(): void {
    this.db.prepare('DELETE FROM recent_files').run();
  }

  trimRecentFiles(limit: number): void {
    this.db
      .prepare(
        `DELETE FROM recent_files WHERE path NOT IN (
           SELECT path FROM recent_files ORDER BY opened_at DESC, path ASC LIMIT ?
         )`
      )
      .run(Math.max(0, Math.floor(limit)));
  }

  getSession(): SessionRow | undefined {
    const row = this.db
      .prepare('SELECT file_path, content, dirty, updated_at FROM session WHERE id = 1')
      .get() as
      | { file_path: string | null; content: string; dirty: number; updated_at: string }
      | undefined;
    if (!row) {
      return undefined;
    }
    return {
      filePath: row.file_path,
      content: row.content,
      dirty: row.dirty === 1,
      updatedAt: row.updated_at,
    };
  }

  saveSession(row: SessionRow): void {
    this.db
      .prepare(
        `INSERT INTO session (id, file_path, content, dirty, updated_at)
         VALUES (1, @filePath, @content, @dirty, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           file_path = excluded.file_path,
           content = excluded.content,
           dirty = excluded.dirty,
           updated_at = excluded.updated_at`
      )
      .run({ ...row, dirty: row.dirty ? 1 : 0 });
  }

  clearSession(): void {
    this.db.prepare('DELETE FROM session').run();
  }

  close(): void {
    if (this.db.open) {
      this.db.close();
    }
  }
}

function currentVersion(db: Db): number {
  const row = db.prepare('SELECT MAX(version) AS version FROM schema_version').get() as
    | { version: number | null }
    | undefined;
  return row?.version ?? 0;
}

/** مهاجرت‌های اجرانشده را به‌ترتیب و هرکدام در یک تراکنش اجرا می‌کند. */
export function migrate(db: Db): number {
  db.exec(
    'CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)'
  );
  let version = currentVersion(db);
  const record = db.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)');
  for (const migration of MIGRATIONS) {
    if (migration.version <= version) {
      continue;
    }
    db.transaction(() => {
      db.exec(migration.sql);
      record.run(migration.version, new Date().toISOString());
    })();
    version = migration.version;
  }
  return version;
}
