import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Drawnix,
  exportBoardImage,
  type DrawnixHost,
  type DrawnixToolState,
} from '@drawnix/drawnix';
import type { BoardChangeData } from '@plait-board/react-board';
import { BoardTransforms, type PlaitBoard } from '@plait/core';
import {
  DEFAULT_SETTINGS,
  type AppCommand,
  type AppInfo,
  type ExportFormat,
  type FileErrorCode,
  type RecentFile,
  type Settings,
  type UiLanguage,
  type ZehnApi,
} from '@shared/ipc';
import { AboutDialog } from './components/AboutDialog';
import { Notice, type NoticeKind } from './components/Notice';
import { RecentFilesDialog } from './components/RecentFilesDialog';
import {
  fileDisplayName,
  parseDocument,
  serializeDocument,
  type BoardDocument,
  type BoardSnapshot,
} from './document';
import { commandForShortcut, isEditableTarget } from './shortcuts';
import { getStrings, type AppStrings } from './strings';

interface LoadedDocument extends BoardDocument {
  /** با هر بار باز کردن/ساختن سند عوض می‌شود تا تخته از نو ساخته شود (تاریخچهٔ واگرد هم پاک شود). */
  key: number;
}

type DialogKind = 'about' | 'recent' | null;

/** متن پیام تابعی از متن‌های زبان فعلی است، نه رشتهٔ ثابت. */
type NoticeMessage = (strings: AppStrings) => string;

interface PendingNotice {
  id: number;
  kind: NoticeKind;
  message: NoticeMessage;
  detail?: string;
}

const DRAFT_DELAY_MS = 600;
const SETTINGS_DELAY_MS = 400;
const NOTICE_DURATION_MS = 5000;
const ZOOM_STEP = 0.1;

const EMPTY_DOCUMENT: BoardDocument = { children: [] };

export function App({ api }: { api: ZehnApi }): React.JSX.Element {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [doc, setDoc] = useState<LoadedDocument>({ key: 0, ...EMPTY_DOCUMENT });
  const [tutorial, setTutorial] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  // متن پیام هنگام نمایش از روی زبان فعلی ساخته می‌شود تا با تغییر زبان، پیامِ روی صفحه هم عوض شود.
  const [notice, setNotice] = useState<PendingNotice | null>(null);

  const language: UiLanguage = settings.language;
  const strings = useMemo(() => getStrings(language), [language]);
  const stringsRef = useRef(strings);
  stringsRef.current = strings;

  const boardRef = useRef<PlaitBoard | null>(null);
  const snapshotRef = useRef<BoardSnapshot>({ children: [] });
  const filePathRef = useRef<string | null>(null);
  const dirtyRef = useRef(false);
  /** محتوای آخرین نسخهٔ ذخیره‌شده روی دیسک (برای «ذخیره نکن» هنگام بستن). */
  const savedContentRef = useRef<string | null>(null);
  const docKeyRef = useRef(0);
  const busyRef = useRef(false);
  const dialogRef = useRef<DialogKind>(null);
  dialogRef.current = dialog;
  const draftTimerRef = useRef<number | undefined>(undefined);
  const settingsTimerRef = useRef<number | undefined>(undefined);
  const pendingSettingsRef = useRef<Partial<Settings>>({});
  const noticeIdRef = useRef(0);

  // ---------- پیام‌ها ----------
  const showNotice = useCallback((kind: NoticeKind, message: NoticeMessage, detail?: string) => {
    noticeIdRef.current += 1;
    setNotice({ id: noticeIdRef.current, kind, message, detail });
  }, []);

  const showFileError = useCallback(
    (code: FileErrorCode, filePath?: string) => {
      showNotice('error', (s) => s.notice.errors[code], filePath);
    },
    [showNotice]
  );

  useEffect(() => {
    if (!notice) {
      return undefined;
    }
    const timer = window.setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // ---------- وضعیت سند ----------
  const currentSnapshot = useCallback((): BoardSnapshot => {
    const board = boardRef.current;
    if (board) {
      return { children: board.children, viewport: board.viewport, theme: board.theme };
    }
    return snapshotRef.current;
  }, []);

  const syncDocumentState = useCallback(() => {
    void api.setDocumentState({ filePath: filePathRef.current, dirty: dirtyRef.current });
  }, [api]);

  const setDirty = useCallback(
    (dirty: boolean) => {
      if (dirtyRef.current !== dirty) {
        dirtyRef.current = dirty;
        syncDocumentState();
      }
    },
    [syncDocumentState]
  );

  const flushDraft = useCallback(async () => {
    window.clearTimeout(draftTimerRef.current);
    draftTimerRef.current = undefined;
    await api.saveDraft({
      filePath: filePathRef.current,
      content: serializeDocument(currentSnapshot()),
      dirty: dirtyRef.current,
    });
  }, [api, currentSnapshot]);

  const scheduleDraft = useCallback(() => {
    window.clearTimeout(draftTimerRef.current);
    draftTimerRef.current = window.setTimeout(() => {
      void flushDraft();
    }, DRAFT_DELAY_MS);
  }, [flushDraft]);

  const loadDocument = useCallback(
    (
      document: BoardDocument,
      filePath: string | null,
      options: { dirty?: boolean; savedContent?: string | null } = {}
    ) => {
      window.clearTimeout(draftTimerRef.current);
      docKeyRef.current += 1;
      boardRef.current = null;
      snapshotRef.current = {
        children: document.children,
        viewport: document.viewport,
        theme: document.theme,
      };
      filePathRef.current = filePath;
      dirtyRef.current = options.dirty === true;
      savedContentRef.current = options.savedContent ?? null;
      setTutorial(document.children.length === 0);
      setDoc({ key: docKeyRef.current, ...document });
      syncDocumentState();
    },
    [syncDocumentState]
  );

  // ---------- عملیات پرونده ----------
  const save = useCallback(
    async (saveAs: boolean): Promise<boolean> => {
      const content = serializeDocument(currentSnapshot());
      const result = await api.saveFile({ filePath: filePathRef.current, content, saveAs });
      if (result.status === 'ok') {
        filePathRef.current = result.filePath;
        dirtyRef.current = false;
        savedContentRef.current = content;
        syncDocumentState();
        await flushDraft();
        showNotice('success', (s) => s.notice.saved, result.filePath);
        return true;
      }
      if (result.status === 'error') {
        showFileError(result.code);
      }
      return false;
    },
    [api, currentSnapshot, flushDraft, showFileError, showNotice, syncDocumentState]
  );

  /** اگر تغییر ذخیره‌نشده هست از کاربر می‌پرسد؛ false یعنی عملیات باید لغو شود. */
  const confirmDiscard = useCallback(async (): Promise<boolean> => {
    if (!dirtyRef.current) {
      return true;
    }
    const name = fileDisplayName(filePathRef.current, stringsRef.current.untitled);
    const choice = await api.confirmUnsaved(name);
    if (choice === 'cancel') {
      return false;
    }
    if (choice === 'save') {
      return save(false);
    }
    return true;
  }, [api, save]);

  const openDocument = useCallback(
    async (filePath?: string) => {
      if (!(await confirmDiscard())) {
        return;
      }
      const result = await api.openFile(filePath);
      if (result.status === 'canceled') {
        return;
      }
      if (result.status === 'error') {
        showFileError(result.code, result.filePath);
        if (dialogRef.current === 'recent') {
          setRecentFiles(await api.listRecentFiles());
        }
        return;
      }
      const parsed = parseDocument(result.content);
      if (!parsed) {
        showFileError('invalid-format', result.filePath);
        return;
      }
      setDialog(null);
      loadDocument(parsed, result.filePath, { savedContent: result.content });
      await api.saveDraft({ filePath: result.filePath, content: result.content, dirty: false });
    },
    [api, confirmDiscard, loadDocument, showFileError]
  );

  const newDocument = useCallback(async () => {
    if (!(await confirmDiscard())) {
      return;
    }
    loadDocument(EMPTY_DOCUMENT, null);
    await api.clearSession();
  }, [api, confirmDiscard, loadDocument]);

  const exportImage = useCallback(
    async (format: ExportFormat) => {
      const board = boardRef.current;
      if (!board || board.children.length === 0) {
        showNotice('info', (s) => s.notice.emptyExport);
        return;
      }
      let blob: Blob | null = null;
      try {
        blob = await exportBoardImage(board, format);
      } catch {
        blob = null;
      }
      if (!blob) {
        showNotice('error', (s) => s.notice.exportFailed);
        return;
      }
      const data = new Uint8Array(await blob.arrayBuffer());
      const suggestedName = fileDisplayName(filePathRef.current, stringsRef.current.untitled);
      const result = await api.exportFile({ format, data, suggestedName });
      if (result.status === 'ok') {
        showNotice('success', (s) => s.notice.exported, result.filePath);
      } else if (result.status === 'error') {
        showFileError(result.code);
      }
    },
    [api, showFileError, showNotice]
  );

  const showRecentFiles = useCallback(async () => {
    setRecentFiles(await api.listRecentFiles());
    setDialog('recent');
  }, [api]);

  const showAbout = useCallback(async () => {
    setDialog('about');
    if (!appInfo) {
      setAppInfo(await api.getAppInfo());
    }
  }, [api, appInfo]);

  const requestClose = useCallback(async () => {
    if (!(await confirmDiscard())) {
      return;
    }
    if (dirtyRef.current) {
      // کاربر «ذخیره نکن» را برگزید: پیش‌نویسِ تغییرات دور ریخته می‌شود.
      if (filePathRef.current && savedContentRef.current !== null) {
        await api.saveDraft({
          filePath: filePathRef.current,
          content: savedContentRef.current,
          dirty: false,
        });
      } else {
        await api.clearSession();
      }
      window.clearTimeout(draftTimerRef.current);
    } else {
      await flushDraft();
    }
    await api.closeWindow();
  }, [api, confirmDiscard, flushDraft]);

  // ---------- فرمان‌ها (منوی نیتیو، منوی برنامه، میان‌برها) ----------
  const runCommand = useCallback(
    async (command: AppCommand) => {
      const board = boardRef.current;
      switch (command) {
        case 'edit:undo':
          board?.undo();
          return;
        case 'edit:redo':
          board?.redo();
          return;
        case 'view:zoomIn':
          if (board) BoardTransforms.updateZoom(board, board.viewport.zoom + ZOOM_STEP);
          return;
        case 'view:zoomOut':
          if (board) BoardTransforms.updateZoom(board, board.viewport.zoom - ZOOM_STEP);
          return;
        case 'view:zoomReset':
          if (board) BoardTransforms.updateZoom(board, 1);
          return;
        case 'view:zoomFit':
          if (board) BoardTransforms.fitViewport(board);
          return;
        default:
          break;
      }
      // فرمان‌های پرونده پنجرهٔ سیستم باز می‌کنند؛ هم‌زمان فقط یکی اجرا می‌شود.
      if (busyRef.current) {
        return;
      }
      busyRef.current = true;
      try {
        switch (command) {
          case 'file:new':
            await newDocument();
            break;
          case 'file:open':
            await openDocument();
            break;
          case 'file:recent':
            await showRecentFiles();
            break;
          case 'file:save':
            await save(false);
            break;
          case 'file:saveAs':
            await save(true);
            break;
          case 'export:png':
            await exportImage('png');
            break;
          case 'export:jpg':
            await exportImage('jpg');
            break;
          case 'export:svg':
            await exportImage('svg');
            break;
          case 'help:about':
            await showAbout();
            break;
          default:
            break;
        }
      } finally {
        busyRef.current = false;
      }
    },
    [exportImage, newDocument, openDocument, save, showAbout, showRecentFiles]
  );

  const runCommandRef = useRef(runCommand);
  runCommandRef.current = runCommand;
  const openDocumentRef = useRef(openDocument);
  openDocumentRef.current = openDocument;
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  const host = useMemo<DrawnixHost>(
    () => ({
      newFile: () => void runCommandRef.current('file:new'),
      openFile: () => void runCommandRef.current('file:open'),
      showRecentFiles: () => void runCommandRef.current('file:recent'),
      saveFile: () => void runCommandRef.current('file:save'),
      saveFileAs: () => void runCommandRef.current('file:saveAs'),
      exportImage: (format) => void runCommandRef.current(`export:${format}`),
      showAbout: () => void runCommandRef.current('help:about'),
    }),
    []
  );

  // ---------- راه‌اندازی ----------
  useEffect(() => {
    let cancelled = false;
    const start = async (): Promise<void> => {
      const [loadedSettings, session] = await Promise.all([api.getSettings(), api.loadSession()]);
      if (cancelled) {
        return;
      }
      setSettings(loadedSettings);
      const parsed = session.content ? parseDocument(session.content) : null;

      if (session.openedFromArgs && !session.error && parsed) {
        loadDocument(parsed, session.filePath, { savedContent: session.content });
      } else if (parsed && session.dirty) {
        loadDocument(parsed, session.filePath, { dirty: true });
        if (parsed.children.length > 0) {
          showNotice('info', (s) => s.notice.restored);
        }
      } else if (session.filePath) {
        // سندِ ذخیره‌شده: نسخهٔ روی دیسک مرجع است.
        const result = await api.openFile(session.filePath);
        if (cancelled) {
          return;
        }
        const fromDisk = result.status === 'ok' ? parseDocument(result.content) : null;
        if (result.status === 'ok' && fromDisk) {
          loadDocument(fromDisk, result.filePath, { savedContent: result.content });
        } else if (parsed && parsed.children.length > 0) {
          // پرونده دیگر در دسترس نیست؛ آخرین پیش‌نویس تنها نسخهٔ موجود است.
          loadDocument(parsed, null, { dirty: true });
          showNotice('error', (s) => s.notice.errors['not-found'], session.filePath);
        } else {
          loadDocument(EMPTY_DOCUMENT, null);
        }
      } else if (parsed) {
        loadDocument(parsed, null);
      } else {
        loadDocument(EMPTY_DOCUMENT, null);
      }

      if (session.error) {
        const code = session.error;
        showNotice('error', (s) => s.notice.errors[code]);
      }
      setReady(true);
    };
    void start();
    return () => {
      cancelled = true;
    };
  }, [api, loadDocument, showNotice]);

  useEffect(() => {
    const offCommand = api.onCommand((command) => void runCommandRef.current(command));
    const offOpenPath = api.onOpenPath((filePath) => void openDocumentRef.current(filePath));
    const offClose = api.onCloseRequested(() => void requestCloseRef.current());
    return () => {
      offCommand();
      offOpenPath();
      offClose();
    };
  }, [api]);

  // زبان و جهت سند HTML از تنظیمات پیروی می‌کند (فارسی ← راست‌به‌چپ).
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
  }, [language]);

  // میان‌برهای سراسری (فاز capture تا پیش از تخته اجرا شوند).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (dialogRef.current) {
        return;
      }
      const command = commandForShortcut(event, isEditableTarget(event.target));
      if (!command) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      void runCommandRef.current(command);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(draftTimerRef.current);
      window.clearTimeout(settingsTimerRef.current);
    };
  }, []);

  // ---------- تنظیمات ----------
  const persistSettings = useCallback(
    (patch: Partial<Settings>, immediate = false) => {
      setSettings((current) => ({ ...current, ...patch }));
      pendingSettingsRef.current = { ...pendingSettingsRef.current, ...patch };
      window.clearTimeout(settingsTimerRef.current);
      const flush = (): void => {
        const pending = pendingSettingsRef.current;
        pendingSettingsRef.current = {};
        void api.updateSettings(pending);
      };
      if (immediate) {
        flush();
      } else {
        settingsTimerRef.current = window.setTimeout(flush, SETTINGS_DELAY_MS);
      }
    },
    [api]
  );

  const handleChange = useCallback(
    (data: BoardChangeData) => {
      snapshotRef.current = { children: data.children, viewport: data.viewport, theme: data.theme };
      const operations = data.operations ?? [];
      const contentChanged = operations.some(
        (operation) => operation.type !== 'set_selection' && operation.type !== 'set_viewport'
      );
      const viewportChanged = operations.some((operation) => operation.type === 'set_viewport');
      if (contentChanged) {
        if (data.children.length > 0) {
          setTutorial(false);
        }
        setDirty(true);
      }
      if (contentChanged || viewportChanged) {
        scheduleDraft();
      }
    },
    [scheduleDraft, setDirty]
  );

  if (!ready) {
    return (
      <div className="zn-loading" data-testid="app-loading">
        {strings.loading}
      </div>
    );
  }

  return (
    <div className="zn-app" data-testid="app-root" data-document-key={doc.key}>
      <Drawnix
        key={`document-${doc.key}`}
        value={doc.children}
        viewport={doc.viewport}
        theme={doc.theme}
        host={host}
        tutorial={tutorial}
        initialLanguage={settings.language}
        initialToolState={(settings.toolState ?? undefined) as Partial<DrawnixToolState> | undefined}
        initialPreference={{
          copyTransparent: settings.copyTransparent,
          exportTransparent: settings.exportTransparent,
        }}
        onChange={handleChange}
        onLanguageChange={(nextLanguage) => persistSettings({ language: nextLanguage }, true)}
        onPreferenceChange={(preference) => persistSettings(preference)}
        onToolStateChange={(toolState) => persistSettings({ toolState })}
        afterInit={(board) => {
          boardRef.current = board;
        }}
      />
      {dialog === 'about' && (
        <AboutDialog language={language} info={appInfo} onClose={() => setDialog(null)} />
      )}
      {dialog === 'recent' && (
        <RecentFilesDialog
          language={language}
          files={recentFiles}
          onOpen={(filePath) => void openDocument(filePath)}
          onRemove={(filePath) => void api.removeRecentFile(filePath).then(setRecentFiles)}
          onClear={() => void api.clearRecentFiles().then(setRecentFiles)}
          onClose={() => setDialog(null)}
        />
      )}
      {notice && (
        <Notice
          key={`notice-${notice.id}`}
          notice={{ id: notice.id, kind: notice.kind, message: notice.message(strings), detail: notice.detail }}
          closeLabel={strings.close}
          onDismiss={() => setNotice(null)}
        />
      )}
    </div>
  );
}
