/**
 * preload — تنها پل بین renderer (sandbox) و main.
 * فقط `contextBridge` و `ipcRenderer` از electron استفاده می‌شوند.
 */
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import {
  IpcEvent,
  IpcInvoke,
  type IpcEventChannel,
  type IpcEventMap,
  type IpcInvokeChannel,
  type IpcInvokeMap,
  type ZehnApi,
} from '../shared/ipc';

function invoke<C extends IpcInvokeChannel>(
  channel: C,
  ...args: IpcInvokeMap[C]['args']
): Promise<IpcInvokeMap[C]['result']> {
  return ipcRenderer.invoke(channel, ...args) as Promise<IpcInvokeMap[C]['result']>;
}

function subscribe<C extends IpcEventChannel>(
  channel: C,
  listener: (...args: IpcEventMap[C]) => void
): () => void {
  const wrapped = (_event: IpcRendererEvent, ...args: unknown[]): void => {
    listener(...(args as IpcEventMap[C]));
  };
  ipcRenderer.on(channel, wrapped);
  return () => {
    ipcRenderer.removeListener(channel, wrapped);
  };
}

const api: ZehnApi = {
  getAppInfo: () => invoke(IpcInvoke.appInfo),
  getSettings: () => invoke(IpcInvoke.settingsGet),
  updateSettings: (patch) => invoke(IpcInvoke.settingsUpdate, patch),
  loadSession: () => invoke(IpcInvoke.sessionLoad),
  saveDraft: (draft) => invoke(IpcInvoke.sessionSaveDraft, draft),
  clearSession: () => invoke(IpcInvoke.sessionClear),
  openFile: (filePath) => invoke(IpcInvoke.fileOpen, filePath),
  saveFile: (request) => invoke(IpcInvoke.fileSave, request),
  exportFile: (request) => invoke(IpcInvoke.fileExport, request),
  listRecentFiles: () => invoke(IpcInvoke.recentList),
  removeRecentFile: (filePath) => invoke(IpcInvoke.recentRemove, filePath),
  clearRecentFiles: () => invoke(IpcInvoke.recentClear),
  setDocumentState: (state) => invoke(IpcInvoke.documentState, state),
  confirmUnsaved: (documentName) => invoke(IpcInvoke.confirmUnsaved, documentName),
  closeWindow: () => invoke(IpcInvoke.windowClose),
  onCommand: (listener) => subscribe(IpcEvent.command, listener),
  onOpenPath: (listener) => subscribe(IpcEvent.openPath, listener),
  onCloseRequested: (listener) => subscribe(IpcEvent.closeRequested, listener),
};

contextBridge.exposeInMainWorld('api', api);
