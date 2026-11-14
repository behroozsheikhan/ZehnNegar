/**
 * پیاده‌سازی درون‌حافظه‌ایِ `window.api` با دادهٔ فارسی.
 * فقط برای پیش‌نمایش رابط در مرورگر (VITE_API_MOCK=1) و تست‌های Vitest؛
 * در برنامهٔ واقعی هرگز استفاده نمی‌شود (آن‌جا preload پل واقعی را می‌سازد).
 */
import {
  DEFAULT_SETTINGS,
  type AppCommand,
  type DraftInput,
  type RecentFile,
  type SessionState,
  type Settings,
  type UnsavedChoice,
  type ZehnApi,
} from '@shared/ipc';
import { createSampleDocument, SAMPLE_RECENT_FILES } from './sample-document';

export interface MockApiOptions {
  session?: Partial<SessionState>;
  recentFiles?: RecentFile[];
  settings?: Partial<Settings>;
  /** پاسخ پنجرهٔ «تغییرات ذخیره‌نشده». */
  unsavedChoice?: UnsavedChoice;
  /** مسیری که پنجرهٔ ذخیره برمی‌گرداند؛ null یعنی انصراف. */
  savePath?: string | null;
  /** مسیری که پنجرهٔ باز کردن برمی‌گرداند؛ null یعنی انصراف. */
  openPath?: string | null;
}

export interface MockApi extends ZehnApi {
  /** ابزار تست: شبیه‌سازی رویدادهای main. */
  emitCommand(command: AppCommand): void;
  emitOpenPath(filePath: string): void;
  emitCloseRequested(): void;
  /** وضعیت درونی برای بررسی در تست. */
  readonly state: {
    settings: Settings;
    recentFiles: RecentFile[];
    draft: DraftInput | null;
    files: Map<string, string>;
    exports: { format: string; size: number; suggestedName: string }[];
    documentState: { filePath: string | null; dirty: boolean };
    closed: boolean;
  };
}

const DEFAULT_SAVE_PATH = 'C:\\Users\\Sara\\Documents\\نقشهٔ ذهنی من.drawnix';

function baseName(filePath: string): string {
  // مثل main: نام پرونده با پسوند ذخیره می‌شود.
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

export function createMockApi(options: MockApiOptions = {}): MockApi {
  const commandListeners = new Set<(command: AppCommand) => void>();
  const openPathListeners = new Set<(filePath: string) => void>();
  const closeListeners = new Set<() => void>();

  const recentSeed = options.recentFiles ?? SAMPLE_RECENT_FILES;
  const files = new Map<string, string>(recentSeed.map((file) => [file.path, createSampleDocument()]));

  const state: MockApi['state'] = {
    settings: { ...DEFAULT_SETTINGS, ...options.settings },
    recentFiles: recentSeed.map((file) => ({ ...file })),
    draft: null,
    files,
    exports: [],
    documentState: { filePath: null, dirty: false },
    closed: false,
  };

  const touchRecent = (filePath: string): void => {
    state.recentFiles = [
      { path: filePath, name: baseName(filePath), openedAt: new Date().toISOString() },
      ...state.recentFiles.filter((file) => file.path !== filePath),
    ].slice(0, 10);
  };

  const subscribe = <T>(set: Set<T>, listener: T): (() => void) => {
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  };

  return {
    state,
    emitCommand: (command) => commandListeners.forEach((listener) => listener(command)),
    emitOpenPath: (filePath) => openPathListeners.forEach((listener) => listener(filePath)),
    emitCloseRequested: () => closeListeners.forEach((listener) => listener()),

    getAppInfo: async () => ({
      name: 'ذهن‌نگار',
      version: '1.0.0',
      electron: '45.3.2',
      chrome: '148.0.0.0',
      node: '22.22.0',
      platform: 'win32',
    }),
    getSettings: async () => ({ ...state.settings }),
    updateSettings: async (patch) => {
      state.settings = { ...state.settings, ...patch };
      return { ...state.settings };
    },
    loadSession: async () => ({
      filePath: null,
      content: null,
      dirty: false,
      openedFromArgs: false,
      ...options.session,
    }),
    saveDraft: async (draft) => {
      state.draft = { ...draft };
    },
    clearSession: async () => {
      state.draft = null;
    },
    openFile: async (filePath) => {
      const target = filePath ?? (options.openPath === undefined ? recentSeed[0]?.path : options.openPath);
      if (!target) {
        return { status: 'canceled' };
      }
      const content = files.get(target);
      if (content === undefined) {
        state.recentFiles = state.recentFiles.filter((file) => file.path !== target);
        return { status: 'error', code: 'not-found', filePath: target };
      }
      touchRecent(target);
      return { status: 'ok', filePath: target, content };
    },
    saveFile: async (request) => {
      let target = request.filePath;
      if (!target || request.saveAs) {
        target = options.savePath === undefined ? DEFAULT_SAVE_PATH : options.savePath;
        if (!target) {
          return { status: 'canceled' };
        }
      }
      files.set(target, request.content);
      touchRecent(target);
      return { status: 'ok', filePath: target };
    },
    exportFile: async (request) => {
      state.exports.push({
        format: request.format,
        size: request.data.byteLength,
        suggestedName: request.suggestedName,
      });
      return {
        status: 'ok',
        filePath: `C:\\Users\\Sara\\Pictures\\${request.suggestedName}.${request.format}`,
      };
    },
    listRecentFiles: async () => state.recentFiles.map((file) => ({ ...file })),
    removeRecentFile: async (filePath) => {
      state.recentFiles = state.recentFiles.filter((file) => file.path !== filePath);
      return state.recentFiles.map((file) => ({ ...file }));
    },
    clearRecentFiles: async () => {
      state.recentFiles = [];
      return [];
    },
    setDocumentState: async (documentState) => {
      state.documentState = { ...documentState };
    },
    confirmUnsaved: async () => options.unsavedChoice ?? 'discard',
    closeWindow: async () => {
      state.closed = true;
    },
    onCommand: (listener) => subscribe(commandListeners, listener),
    onOpenPath: (listener) => subscribe(openPathListeners, listener),
    onCloseRequested: (listener) => subscribe(closeListeners, listener),
  };
}
