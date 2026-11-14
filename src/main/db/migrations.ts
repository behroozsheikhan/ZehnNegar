/**
 * مهاجرت‌های دیتابیس — ساده و ترتیبی با جدول `schema_version`.
 * برای تغییر طرح‌واره، یک مورد جدید به انتهای آرایه اضافه کنید (موارد قبلی را ویرایش نکنید).
 */
export interface Migration {
  version: number;
  description: string;
  sql: string;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    description: 'settings, recent_files, session',
    sql: `
      CREATE TABLE settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      ) WITHOUT ROWID;

      CREATE TABLE recent_files (
        path      TEXT PRIMARY KEY,
        name      TEXT NOT NULL,
        opened_at TEXT NOT NULL  -- ISO-8601 UTC
      ) WITHOUT ROWID;
      CREATE INDEX idx_recent_files_opened_at ON recent_files (opened_at DESC);

      CREATE TABLE session (
        id         INTEGER PRIMARY KEY CHECK (id = 1),
        file_path  TEXT,
        content    TEXT NOT NULL,
        dirty      INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL  -- ISO-8601 UTC
      );
    `,
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
