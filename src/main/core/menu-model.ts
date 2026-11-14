/**
 * مدل منوی نیتیو — خالص و بدون وابستگی به electron تا قابل تست باشد.
 * `src/main/menu.ts` این مدل را به `Menu` الکترون تبدیل می‌کند.
 */
import type { AppCommand, RecentFile, UiLanguage } from '../../shared/ipc';
import { getMessages } from './messages';

export type MenuRole = 'cut' | 'copy' | 'paste' | 'selectAll' | 'togglefullscreen' | 'quit';

export interface MenuNode {
  id?: string;
  label?: string;
  type?: 'normal' | 'separator' | 'submenu';
  /** کلید میان‌بر برای نمایش؛ خودِ میان‌بر را renderer مدیریت می‌کند. */
  accelerator?: string;
  command?: AppCommand;
  /** باز کردن یک پروندهٔ اخیر. */
  openPath?: string;
  role?: MenuRole;
  enabled?: boolean;
  submenu?: MenuNode[];
}

const RECENT_IN_MENU = 8;
const separator: MenuNode = { type: 'separator' };

export function buildMenuModel(language: UiLanguage, recentFiles: readonly RecentFile[]): MenuNode[] {
  const m = getMessages(language);

  const recentItems: MenuNode[] =
    recentFiles.length === 0
      ? [{ id: 'recent-empty', label: m.fileRecentEmpty, enabled: false }]
      : recentFiles.slice(0, RECENT_IN_MENU).map((file, index) => ({
          id: `recent-${index}`,
          // نام پرونده با FSI/PDI جدا می‌شود تا در منوی راست‌به‌چپ به‌هم نریزد.
          label: `\u2068${file.name}\u2069`,
          openPath: file.path,
        }));

  return [
    {
      id: 'file',
      label: m.menuFile,
      type: 'submenu',
      submenu: [
        { id: 'file-new', label: m.fileNew, accelerator: 'CmdOrCtrl+N', command: 'file:new' },
        { id: 'file-open', label: m.fileOpen, accelerator: 'CmdOrCtrl+O', command: 'file:open' },
        {
          id: 'file-recent',
          label: m.fileRecent,
          type: 'submenu',
          submenu: [
            ...recentItems,
            separator,
            { id: 'recent-more', label: m.fileRecentMore, command: 'file:recent' },
          ],
        },
        separator,
        { id: 'file-save', label: m.fileSave, accelerator: 'CmdOrCtrl+S', command: 'file:save' },
        {
          id: 'file-save-as',
          label: m.fileSaveAs,
          accelerator: 'CmdOrCtrl+Shift+S',
          command: 'file:saveAs',
        },
        separator,
        {
          id: 'file-export',
          label: m.fileExport,
          type: 'submenu',
          submenu: [
            { id: 'export-png', label: m.exportPng, command: 'export:png' },
            { id: 'export-jpg', label: m.exportJpg, command: 'export:jpg' },
            {
              id: 'export-svg',
              label: m.exportSvg,
              accelerator: 'CmdOrCtrl+Shift+E',
              command: 'export:svg',
            },
          ],
        },
        separator,
        { id: 'file-exit', label: m.fileExit, role: 'quit' },
      ],
    },
    {
      id: 'edit',
      label: m.menuEdit,
      type: 'submenu',
      submenu: [
        { id: 'edit-undo', label: m.editUndo, accelerator: 'CmdOrCtrl+Z', command: 'edit:undo' },
        {
          id: 'edit-redo',
          label: m.editRedo,
          accelerator: 'CmdOrCtrl+Shift+Z',
          command: 'edit:redo',
        },
        separator,
        { id: 'edit-cut', label: m.editCut, role: 'cut' },
        { id: 'edit-copy', label: m.editCopy, role: 'copy' },
        { id: 'edit-paste', label: m.editPaste, role: 'paste' },
        { id: 'edit-select-all', label: m.editSelectAll, role: 'selectAll' },
      ],
    },
    {
      id: 'view',
      label: m.menuView,
      type: 'submenu',
      submenu: [
        { id: 'view-zoom-in', label: m.viewZoomIn, accelerator: 'CmdOrCtrl+=', command: 'view:zoomIn' },
        {
          id: 'view-zoom-out',
          label: m.viewZoomOut,
          accelerator: 'CmdOrCtrl+-',
          command: 'view:zoomOut',
        },
        {
          id: 'view-zoom-reset',
          label: m.viewZoomReset,
          accelerator: 'CmdOrCtrl+0',
          command: 'view:zoomReset',
        },
        { id: 'view-zoom-fit', label: m.viewZoomFit, command: 'view:zoomFit' },
        separator,
        { id: 'view-fullscreen', label: m.viewFullscreen, role: 'togglefullscreen' },
      ],
    },
    {
      id: 'help',
      label: m.menuHelp,
      type: 'submenu',
      submenu: [{ id: 'help-about', label: m.helpAbout, command: 'help:about' }],
    },
  ];
}

/** همهٔ گره‌های منو را به‌صورت تخت برمی‌گرداند (برای تست و جست‌وجو). */
export function flattenMenu(nodes: readonly MenuNode[]): MenuNode[] {
  return nodes.flatMap((node) => [node, ...(node.submenu ? flattenMenu(node.submenu) : [])]);
}
