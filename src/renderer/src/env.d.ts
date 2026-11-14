/// <reference types="vite/client" />
import type { ZehnApi } from '@shared/ipc';

declare global {
  interface Window {
    /** در Electron توسط preload تزریق می‌شود؛ در پیش‌نمایش مرورگر وجود ندارد. */
    api?: ZehnApi;
  }

  interface ImportMetaEnv {
    readonly VITE_API_MOCK?: string;
  }
}

export {};
