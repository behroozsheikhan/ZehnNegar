import { app, BrowserWindow, Menu, session, shell } from 'electron';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { IpcEvent, IpcInvoke, type AppCommand, type DocumentState } from '../shared/ipc';
import { AppService } from './core/app-service';
import { findDocumentArgument, isSafeExternalUrl } from './core/cli';
import { buildMenuModel } from './core/menu-model';
import { buildWindowTitle } from './core/window-title';
import { SqliteRepository } from './db/sqlite-repository';
import { confirmUnsavedChanges, createDialogPort } from './dialogs';
import { registerIpcHandlers, sendEvent } from './ipc';
import { buildNativeMenu } from './menu';

const APP_ID = 'ir.zehnnegar.app';

// مسیر دادهٔ کاربر از متغیر محیطی قابل تغییر است تا هر تست e2e دیتابیس تازه داشته باشد.
if (process.env.APP_USER_DATA) {
  app.setPath('userData', process.env.APP_USER_DATA);
}

const isDev = !app.isPackaged && !!process.env.ELECTRON_RENDERER_URL;

let mainWindow: BrowserWindow | null = null;
let forceClose = false;
let rendererReady = false;
let documentState: DocumentState = { filePath: null, dirty: false };
/** پرونده‌ای که برنامه با آن اجرا شده (دوبارکلیک)؛ فقط یک بار مصرف می‌شود. */
let pendingDocumentPath: string | null = findDocumentArgument(process.argv);

const repository = new SqliteRepository(join(app.getPath('userData'), 'zehnnegar.db'));
const service = new AppService({
  repository,
  dialogs: createDialogPort(() => mainWindow),
});

// زبان رابط Chromium (منوها و پنجره‌های نیتیو) — باید پیش از ready تنظیم شود.
app.commandLine.appendSwitch('lang', service.language === 'fa' ? 'fa' : 'en-US');

function runCommand(command: AppCommand): void {
  sendEvent(mainWindow?.webContents, IpcEvent.command, command);
}

function requestOpenPath(filePath: string): void {
  if (!mainWindow) {
    pendingDocumentPath = filePath;
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.focus();
  if (rendererReady) {
    sendEvent(mainWindow.webContents, IpcEvent.openPath, filePath);
  } else {
    pendingDocumentPath = filePath;
  }
}

function refreshMenu(): void {
  const model = buildMenuModel(service.language, service.listRecentFiles());
  Menu.setApplicationMenu(buildNativeMenu(model, { runCommand, openPath: requestOpenPath }));
}

function refreshTitle(): void {
  mainWindow?.setTitle(buildWindowTitle(documentState, service.language));
}

function createWindow(): void {
  const iconPath = join(__dirname, '../../resources-build/icon.png');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 720,
    minHeight: 520,
    show: false,
    backgroundColor: '#ffffff',
    title: buildWindowTitle(documentState, service.language),
    ...(process.platform === 'linux' && existsSync(iconPath) ? { icon: iconPath } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  });
  const win = mainWindow;
  const contents = win.webContents;

  win.once('ready-to-show', () => win.show());

  // عنوان را main تعیین می‌کند، نه <title> صفحه.
  win.on('page-title-updated', (event) => event.preventDefault());

  // بستن پنجره: اول از renderer می‌پرسیم (تغییرات ذخیره‌نشده).
  win.on('close', (event) => {
    if (forceClose || !rendererReady) {
      return;
    }
    event.preventDefault();
    sendEvent(contents, IpcEvent.closeRequested);
  });
  win.on('closed', () => {
    mainWindow = null;
  });
  contents.on('render-process-gone', () => {
    rendererReady = false;
  });
  win.on('unresponsive', () => {
    rendererReady = false;
  });

  // هیچ پنجرهٔ تازه یا ناوبری درون‌برنامه‌ای مجاز نیست؛ پیوندهای وب در مرورگر سیستم باز می‌شوند.
  contents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });
  contents.on('will-navigate', (event, url) => {
    if (url !== contents.getURL()) {
      event.preventDefault();
      if (isSafeExternalUrl(url)) {
        void shell.openExternal(url);
      }
    }
  });

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function registerHandlers(): void {
  registerIpcHandlers(
    {
      [IpcInvoke.appInfo]: () => ({
        name: app.getName(),
        version: app.getVersion(),
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
        platform: process.platform,
      }),
      [IpcInvoke.settingsGet]: () => service.getSettings(),
      [IpcInvoke.settingsUpdate]: (patch) => {
        const before = service.language;
        const next = service.updateSettings(patch);
        if (next.language !== before) {
          refreshMenu();
          refreshTitle();
        }
        return next;
      },
      [IpcInvoke.sessionLoad]: async () => {
        const argumentPath = pendingDocumentPath;
        pendingDocumentPath = null;
        const state = await service.loadSession(argumentPath);
        rendererReady = true;
        if (argumentPath) {
          refreshMenu();
        }
        return state;
      },
      [IpcInvoke.sessionSaveDraft]: (draft) => service.saveDraft(draft),
      [IpcInvoke.sessionClear]: () => service.clearSession(),
      [IpcInvoke.fileOpen]: async (filePath) => {
        const result = await service.openFile(filePath);
        refreshMenu();
        return result;
      },
      [IpcInvoke.fileSave]: async (request) => {
        const result = await service.saveFile(request);
        if (result.status === 'ok') {
          refreshMenu();
        }
        return result;
      },
      [IpcInvoke.fileExport]: (request) => service.exportFile(request),
      [IpcInvoke.recentList]: () => service.listRecentFiles(),
      [IpcInvoke.recentRemove]: (filePath) => {
        const list = service.removeRecentFile(filePath);
        refreshMenu();
        return list;
      },
      [IpcInvoke.recentClear]: () => {
        const list = service.clearRecentFiles();
        refreshMenu();
        return list;
      },
      [IpcInvoke.documentState]: (state) => {
        documentState = {
          filePath: typeof state?.filePath === 'string' ? state.filePath : null,
          dirty: state?.dirty === true,
        };
        refreshTitle();
      },
      [IpcInvoke.confirmUnsaved]: (documentName) =>
        confirmUnsavedChanges(mainWindow, service.language, String(documentName ?? '')),
      [IpcInvoke.windowClose]: () => {
        forceClose = true;
        mainWindow?.close();
      },
    },
    (event) => !!mainWindow && event.sender === mainWindow.webContents && event.senderFrame === event.sender.mainFrame
  );
}

if (!app.requestSingleInstanceLock()) {
  // نسخهٔ دیگری از برنامه باز است؛ همان نسخه پرونده را باز می‌کند.
  repository.close();
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const filePath = findDocumentArgument(argv);
    if (filePath) {
      requestOpenPath(filePath);
    } else if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  // macOS: باز کردن پرونده از Finder
  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    requestOpenPath(filePath);
  });

  void app.whenReady().then(() => {
    app.setAppUserModelId(APP_ID);

    // برنامه آفلاین است: همهٔ مجوزها رد می‌شوند به‌جز نوشتن/خواندن کلیپ‌بورد (رونوشت تصویر).
    const allowed = new Set(['clipboard-read', 'clipboard-sanitized-write']);
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      callback(allowed.has(permission));
    });
    session.defaultSession.setPermissionCheckHandler((_wc, permission) => allowed.has(permission));

    registerHandlers();
    refreshMenu();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        forceClose = false;
        rendererReady = false;
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('will-quit', () => {
    repository.close();
  });
}
