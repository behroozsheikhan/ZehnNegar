/**
 * لایهٔ دسترسی داده پشت یک interface.
 * - `InMemoryRepository`: برای تست‌های منطق در Node معمولی (Vitest).
 * - `SqliteRepository` (در src/main/db): پیاده‌سازی واقعی با better-sqlite3.
 */
import type { RecentFile } from '../../shared/ipc';

export interface SessionRow {
  filePath: string | null;
  content: string;
  dirty: boolean;
  /** ISO-8601 (UTC) */
  updatedAt: string;
}

export interface Repository {
  getSetting(key: string): string | undefined;
  setSetting(key: string, value: string): void;

  listRecentFiles(): RecentFile[];
  upsertRecentFile(file: RecentFile): void;
  removeRecentFile(path: string): void;
  clearRecentFiles(): void;
  /** فقط `limit` مورد جدیدتر را نگه می‌دارد. */
  trimRecentFiles(limit: number): void;

  getSession(): SessionRow | undefined;
  saveSession(row: SessionRow): void;
  clearSession(): void;

  close(): void;
}

export class InMemoryRepository implements Repository {
  private settings = new Map<string, string>();
  private recent = new Map<string, RecentFile>();
  private session: SessionRow | undefined;

  getSetting(key: string): string | undefined {
    return this.settings.get(key);
  }

  setSetting(key: string, value: string): void {
    this.settings.set(key, value);
  }

  listRecentFiles(): RecentFile[] {
    return [...this.recent.values()].sort(compareRecent);
  }

  upsertRecentFile(file: RecentFile): void {
    this.recent.set(file.path, { ...file });
  }

  removeRecentFile(path: string): void {
    this.recent.delete(path);
  }

  clearRecentFiles(): void {
    this.recent.clear();
  }

  trimRecentFiles(limit: number): void {
    const keep = this.listRecentFiles().slice(0, Math.max(0, limit));
    this.recent = new Map(keep.map((file) => [file.path, file]));
  }

  getSession(): SessionRow | undefined {
    return this.session ? { ...this.session } : undefined;
  }

  saveSession(row: SessionRow): void {
    this.session = { ...row };
  }

  clearSession(): void {
    this.session = undefined;
  }

  close(): void {
    // چیزی برای بستن نیست
  }
}

/** جدیدترین اول؛ در تساوی زمان، بر اساس مسیر (برای ترتیب پایدار). */
export function compareRecent(a: RecentFile, b: RecentFile): number {
  if (a.openedAt !== b.openedAt) {
    return a.openedAt < b.openedAt ? 1 : -1;
  }
  return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
}
