import type { RecentFile } from '../../shared/ipc';
import { baseName } from './document';
import type { Repository } from './repository';

export const RECENT_FILES_LIMIT = 10;

export interface RecentFilesOptions {
  limit?: number;
  now?: () => Date;
}

/** فهرست «پرونده‌های اخیر»: بدون تکرار، جدیدترین اول، با سقف تعداد. */
export class RecentFilesService {
  private readonly limit: number;
  private readonly now: () => Date;

  constructor(
    private readonly repository: Repository,
    options: RecentFilesOptions = {}
  ) {
    this.limit = options.limit ?? RECENT_FILES_LIMIT;
    this.now = options.now ?? (() => new Date());
  }

  list(): RecentFile[] {
    return this.repository.listRecentFiles().slice(0, this.limit);
  }

  add(filePath: string): RecentFile[] {
    const path = filePath.trim();
    if (path.length === 0) {
      return this.list();
    }
    this.repository.upsertRecentFile({
      path,
      name: baseName(path),
      openedAt: this.now().toISOString(),
    });
    this.repository.trimRecentFiles(this.limit);
    return this.list();
  }

  remove(filePath: string): RecentFile[] {
    this.repository.removeRecentFile(filePath);
    return this.list();
  }

  clear(): RecentFile[] {
    this.repository.clearRecentFiles();
    return [];
  }
}
