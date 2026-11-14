/**
 * منطق اصلی برنامه (مستقل از electron). لایهٔ IPC فقط آداپتور نازکی روی این کلاس است.
 * پنجره‌های گفت‌وگوی سیستم از طریق `DialogPort` تزریق می‌شوند تا در تست جایگزین شوند.
 */
import type {
  DraftInput,
  ExportFileResult,
  OpenFileResult,
  RecentFile,
  SaveFileResult,
  SessionState,
  Settings,
  UiLanguage,
} from '../../shared/ipc';
import { DOCUMENT_EXTENSION } from '../../shared/ipc';
import {
  displayName,
  ensureExtension,
  isExportFormat,
  sanitizeFileName,
} from './document';
import { FileService } from './file-service';
import { getMessages } from './messages';
import { RecentFilesService } from './recent-files';
import type { Repository } from './repository';
import { SessionService } from './session';
import { SettingsService } from './settings';

export type SaveKind = 'document' | 'png' | 'jpg' | 'svg';

export interface DialogPort {
  /** مسیر انتخاب‌شده برای باز کردن، یا null اگر کاربر انصراف داد. */
  pickOpenPath(language: UiLanguage): Promise<string | null>;
  /** مسیر انتخاب‌شده برای ذخیره، یا null اگر کاربر انصراف داد. */
  pickSavePath(language: UiLanguage, kind: SaveKind, suggestedName: string): Promise<string | null>;
}

export interface AppServiceOptions {
  repository: Repository;
  dialogs: DialogPort;
  fileService?: FileService;
  now?: () => Date;
}

export class AppService {
  readonly settings: SettingsService;
  readonly recentFiles: RecentFilesService;
  readonly session: SessionService;
  private readonly files: FileService;
  private readonly dialogs: DialogPort;

  constructor(options: AppServiceOptions) {
    const now = options.now ?? (() => new Date());
    this.settings = new SettingsService(options.repository);
    this.recentFiles = new RecentFilesService(options.repository, { now });
    this.session = new SessionService(options.repository, now);
    this.files = options.fileService ?? new FileService();
    this.dialogs = options.dialogs;
  }

  getSettings(): Settings {
    return this.settings.get();
  }

  updateSettings(patch: unknown): Settings {
    return this.settings.update(patch);
  }

  get language(): UiLanguage {
    return this.settings.get().language;
  }

  /**
   * وضعیت آغازین renderer:
   * - اگر برنامه با یک پرونده اجرا شده (دوبارکلیک)، همان پرونده؛
   * - وگرنه آخرین نشستِ خودکار ذخیره‌شده.
   */
  async loadSession(argumentPath: string | null): Promise<SessionState> {
    if (argumentPath) {
      const result = await this.files.readDocument(argumentPath);
      if (result.ok) {
        this.recentFiles.add(argumentPath);
        return { filePath: argumentPath, content: result.content, dirty: false, openedFromArgs: true };
      }
      const previous = this.restoreSession();
      return { ...previous, openedFromArgs: true, error: result.code };
    }
    return this.restoreSession();
  }

  private restoreSession(): SessionState {
    const row = this.session.load();
    if (!row) {
      return { filePath: null, content: null, dirty: false, openedFromArgs: false };
    }
    return { filePath: row.filePath, content: row.content, dirty: row.dirty, openedFromArgs: false };
  }

  saveDraft(draft: DraftInput): void {
    this.session.saveDraft(draft);
  }

  clearSession(): void {
    this.session.clear();
  }

  async openFile(filePath?: unknown): Promise<OpenFileResult> {
    let target: string | null;
    if (typeof filePath === 'string' && filePath.length > 0) {
      target = filePath;
    } else {
      target = await this.dialogs.pickOpenPath(this.language);
    }
    if (!target) {
      return { status: 'canceled' };
    }
    const result = await this.files.readDocument(target);
    if (!result.ok) {
      if (result.code === 'not-found') {
        // پرونده‌ای که دیگر وجود ندارد از فهرست اخیر حذف می‌شود.
        this.recentFiles.remove(target);
      }
      return { status: 'error', code: result.code, filePath: target };
    }
    this.recentFiles.add(target);
    return { status: 'ok', filePath: target, content: result.content };
  }

  async saveFile(request: unknown): Promise<SaveFileResult> {
    const raw = (typeof request === 'object' && request !== null ? request : {}) as Record<
      string,
      unknown
    >;
    if (typeof raw.content !== 'string') {
      return { status: 'error', code: 'invalid-format' };
    }
    const currentPath = typeof raw.filePath === 'string' && raw.filePath.length > 0 ? raw.filePath : null;
    let target = currentPath;
    if (!target || raw.saveAs === true) {
      const language = this.language;
      const suggested = currentPath ? displayName(currentPath) : getMessages(language).untitled;
      const picked = await this.dialogs.pickSavePath(
        language,
        'document',
        `${sanitizeFileName(suggested, 'untitled')}.${DOCUMENT_EXTENSION}`
      );
      if (!picked) {
        return { status: 'canceled' };
      }
      target = ensureExtension(picked, DOCUMENT_EXTENSION);
    }
    const written = await this.files.writeDocument(target, raw.content);
    if (!written.ok) {
      return { status: 'error', code: written.code };
    }
    this.recentFiles.add(target);
    return { status: 'ok', filePath: target };
  }

  async exportFile(request: unknown): Promise<ExportFileResult> {
    const raw = (typeof request === 'object' && request !== null ? request : {}) as Record<
      string,
      unknown
    >;
    if (!isExportFormat(raw.format) || !(raw.data instanceof Uint8Array) || raw.data.byteLength === 0) {
      return { status: 'error', code: 'invalid-format' };
    }
    const baseName = sanitizeFileName(
      typeof raw.suggestedName === 'string' ? raw.suggestedName : '',
      'export'
    );
    const picked = await this.dialogs.pickSavePath(this.language, raw.format, `${baseName}.${raw.format}`);
    if (!picked) {
      return { status: 'canceled' };
    }
    const target = ensureExtension(picked, raw.format);
    const written = await this.files.writeAtomic(target, raw.data);
    return written.ok ? { status: 'ok', filePath: target } : { status: 'error', code: written.code };
  }

  listRecentFiles(): RecentFile[] {
    return this.recentFiles.list();
  }

  removeRecentFile(filePath: unknown): RecentFile[] {
    return typeof filePath === 'string' ? this.recentFiles.remove(filePath) : this.recentFiles.list();
  }

  clearRecentFiles(): RecentFile[] {
    return this.recentFiles.clear();
  }
}
