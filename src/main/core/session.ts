import type { DraftInput } from '../../shared/ipc';
import type { Repository, SessionRow } from './repository';

/**
 * «نشست»: آخرین وضعیت تخته که خودکار ذخیره می‌شود تا با بستن ناگهانی برنامه چیزی از دست نرود
 * و اجرای بعدی از همان‌جا ادامه پیدا کند.
 */
export class SessionService {
  constructor(
    private readonly repository: Repository,
    private readonly now: () => Date = () => new Date()
  ) {}

  load(): SessionRow | undefined {
    return this.repository.getSession();
  }

  saveDraft(input: unknown): void {
    const draft = sanitizeDraft(input);
    if (!draft) {
      throw new TypeError('invalid draft');
    }
    this.repository.saveSession({ ...draft, updatedAt: this.now().toISOString() });
  }

  clear(): void {
    this.repository.clearSession();
  }
}

export function sanitizeDraft(input: unknown): DraftInput | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }
  const raw = input as Record<string, unknown>;
  if (typeof raw.content !== 'string') {
    return null;
  }
  const filePath = typeof raw.filePath === 'string' && raw.filePath.length > 0 ? raw.filePath : null;
  return { filePath, content: raw.content, dirty: raw.dirty === true };
}
