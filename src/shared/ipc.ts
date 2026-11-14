/**
 * قرارداد مشترک IPC بین main، preload و renderer.
 * هر سه طرف از همین تایپ‌ها استفاده می‌کنند تا کانال‌ها type-safe بمانند.
 */

export type UiLanguage = 'fa' | 'en';
export type ExportFormat = 'png' | 'jpg' | 'svg';

/** فرمان‌هایی که از منوی نیتیو (main) به renderer فرستاده می‌شوند. */
export type AppCommand =
  | 'file:new'
  | 'file:open'
  | 'file:recent'
  | 'file:save'
  | 'file:saveAs'
  | 'export:png'
  | 'export:jpg'
  | 'export:svg'
  | 'edit:undo'
  | 'edit:redo'
  | 'view:zoomIn'
  | 'view:zoomOut'
  | 'view:zoomFit'
  | 'view:zoomReset'
  | 'help:about';

export interface AppInfo {
  name: string;
  version: string;
  electron: string;
  chrome: string;
  node: string;
  platform: string;
}

export interface Settings {
  language: UiLanguage;
  copyTransparent: boolean;
  exportTransparent: boolean;
  /** وضعیت ابزارها (قلم‌ها و …) — برای main مات است و فقط ذخیره/بازیابی می‌شود. */
  toolState: unknown;
}

export interface SessionState {
  /** مسیر پروندهٔ جاری یا null برای «بی‌نام». */
  filePath: string | null;
  /** محتوای سریال‌شدهٔ تخته (JSON قالب drawnix) یا null اگر نشستی نیست. */
  content: string | null;
  dirty: boolean;
  /** پرونده از خط فرمان / دوبارکلیک باز شده است. */
  openedFromArgs: boolean;
  /** اگر باز کردن پروندهٔ خط فرمان شکست خورده باشد. */
  error?: FileErrorCode;
}

export interface DraftInput {
  filePath: string | null;
  content: string;
  dirty: boolean;
}

export type FileErrorCode = 'not-found' | 'invalid-format' | 'too-large' | 'io-error';

export type OpenFileResult =
  | { status: 'ok'; filePath: string; content: string }
  | { status: 'canceled' }
  | { status: 'error'; code: FileErrorCode; filePath?: string };

export interface SaveFileRequest {
  /** مسیر فعلی؛ اگر null باشد یا saveAs درست باشد پنجرهٔ «ذخیره با نام» باز می‌شود. */
  filePath: string | null;
  content: string;
  saveAs?: boolean;
}

export type SaveFileResult =
  | { status: 'ok'; filePath: string }
  | { status: 'canceled' }
  | { status: 'error'; code: FileErrorCode };

export interface ExportFileRequest {
  format: ExportFormat;
  data: Uint8Array;
  suggestedName: string;
}

export type ExportFileResult =
  | { status: 'ok'; filePath: string }
  | { status: 'canceled' }
  | { status: 'error'; code: FileErrorCode };

export interface RecentFile {
  path: string;
  name: string;
  /** ISO-8601 (UTC) */
  openedAt: string;
}

export interface DocumentState {
  filePath: string | null;
  dirty: boolean;
}

export type UnsavedChoice = 'save' | 'discard' | 'cancel';

/** نام کانال‌ها — invoke (renderer → main، با پاسخ). */
export const IpcInvoke = {
  appInfo: 'app:info',
  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  sessionLoad: 'session:load',
  sessionSaveDraft: 'session:save-draft',
  sessionClear: 'session:clear',
  fileOpen: 'file:open',
  fileSave: 'file:save',
  fileExport: 'file:export',
  recentList: 'recent:list',
  recentRemove: 'recent:remove',
  recentClear: 'recent:clear',
  documentState: 'document:state',
  confirmUnsaved: 'dialog:confirm-unsaved',
  windowClose: 'window:close',
} as const;

/** نام کانال‌ها — رویداد (main → renderer). */
export const IpcEvent = {
  command: 'event:command',
  openPath: 'event:open-path',
  closeRequested: 'event:close-requested',
} as const;

/** امضای هر کانال invoke: آرگومان‌ها و نتیجه. */
export interface IpcInvokeMap {
  [IpcInvoke.appInfo]: { args: []; result: AppInfo };
  [IpcInvoke.settingsGet]: { args: []; result: Settings };
  [IpcInvoke.settingsUpdate]: { args: [patch: Partial<Settings>]; result: Settings };
  [IpcInvoke.sessionLoad]: { args: []; result: SessionState };
  [IpcInvoke.sessionSaveDraft]: { args: [draft: DraftInput]; result: void };
  [IpcInvoke.sessionClear]: { args: []; result: void };
  [IpcInvoke.fileOpen]: { args: [filePath?: string]; result: OpenFileResult };
  [IpcInvoke.fileSave]: { args: [request: SaveFileRequest]; result: SaveFileResult };
  [IpcInvoke.fileExport]: { args: [request: ExportFileRequest]; result: ExportFileResult };
  [IpcInvoke.recentList]: { args: []; result: RecentFile[] };
  [IpcInvoke.recentRemove]: { args: [filePath: string]; result: RecentFile[] };
  [IpcInvoke.recentClear]: { args: []; result: RecentFile[] };
  [IpcInvoke.documentState]: { args: [state: DocumentState]; result: void };
  [IpcInvoke.confirmUnsaved]: { args: [documentName: string]; result: UnsavedChoice };
  [IpcInvoke.windowClose]: { args: []; result: void };
}

export interface IpcEventMap {
  [IpcEvent.command]: [command: AppCommand];
  [IpcEvent.openPath]: [filePath: string];
  [IpcEvent.closeRequested]: [];
}

export type IpcInvokeChannel = keyof IpcInvokeMap;
export type IpcEventChannel = keyof IpcEventMap;

type Unsubscribe = () => void;

/**
 * API‌ای که preload با contextBridge در `window.api` قرار می‌دهد.
 * پیاده‌سازی mock (پیش‌نمایش مرورگر و تست‌های Vitest) هم همین interface را دارد.
 */
export interface ZehnApi {
  getAppInfo(): Promise<AppInfo>;
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
  loadSession(): Promise<SessionState>;
  saveDraft(draft: DraftInput): Promise<void>;
  clearSession(): Promise<void>;
  openFile(filePath?: string): Promise<OpenFileResult>;
  saveFile(request: SaveFileRequest): Promise<SaveFileResult>;
  exportFile(request: ExportFileRequest): Promise<ExportFileResult>;
  listRecentFiles(): Promise<RecentFile[]>;
  removeRecentFile(filePath: string): Promise<RecentFile[]>;
  clearRecentFiles(): Promise<RecentFile[]>;
  setDocumentState(state: DocumentState): Promise<void>;
  confirmUnsaved(documentName: string): Promise<UnsavedChoice>;
  closeWindow(): Promise<void>;
  onCommand(listener: (command: AppCommand) => void): Unsubscribe;
  onOpenPath(listener: (filePath: string) => void): Unsubscribe;
  onCloseRequested(listener: () => void): Unsubscribe;
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'fa',
  copyTransparent: false,
  exportTransparent: false,
  toolState: null,
};

export const DOCUMENT_EXTENSION = 'drawnix';
export const APP_NAME_FA = 'ذهن‌نگار';
export const APP_NAME_EN = 'ZehnNegar';
export const UPSTREAM_URL = 'https://github.com/plait-board/drawnix';
