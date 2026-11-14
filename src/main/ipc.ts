/**
 * لایهٔ IPC — آداپتور نازک روی `AppService`. هیچ منطق کسب‌وکاری اینجا نیست.
 */
import { ipcMain, type IpcMainInvokeEvent, type WebContents } from 'electron';
import {
  IpcEvent,
  IpcInvoke,
  type IpcEventChannel,
  type IpcEventMap,
  type IpcInvokeChannel,
  type IpcInvokeMap,
} from '../shared/ipc';

type Handler<C extends IpcInvokeChannel> = (
  ...args: IpcInvokeMap[C]['args']
) => IpcInvokeMap[C]['result'] | Promise<IpcInvokeMap[C]['result']>;

export type IpcHandlers = { [C in IpcInvokeChannel]: Handler<C> };

/**
 * همهٔ کانال‌های invoke را ثبت می‌کند. فقط پیام‌هایی که از فریم اصلیِ
 * پنجرهٔ خود برنامه می‌آیند پذیرفته می‌شوند.
 */
export function registerIpcHandlers(
  handlers: IpcHandlers,
  isTrustedSender: (event: IpcMainInvokeEvent) => boolean
): void {
  for (const channel of Object.values(IpcInvoke) as IpcInvokeChannel[]) {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, (event, ...args: unknown[]) => {
      if (!isTrustedSender(event)) {
        throw new Error(`untrusted sender for ${channel}`);
      }
      const handler = handlers[channel] as (...a: unknown[]) => unknown;
      return handler(...args);
    });
  }
}

export function sendEvent<C extends IpcEventChannel>(
  target: WebContents | null | undefined,
  channel: C,
  ...args: IpcEventMap[C]
): void {
  if (target && !target.isDestroyed()) {
    target.send(channel, ...args);
  }
}

export { IpcEvent };
