/**
 * «میزبان» دسکتاپ: برنامهٔ دربرگیرنده (Electron) عملیات پرونده را در اختیار Drawnix می‌گذارد.
 * اگر میزبان داده نشود، رفتار اصلی وب (browser-fs-access) حفظ می‌شود.
 */
import { createContext, useContext } from 'react';

export type DrawnixExportFormat = 'svg' | 'png' | 'jpg';

export interface DrawnixHost {
  newFile: () => void;
  openFile: () => void;
  showRecentFiles: () => void;
  saveFile: () => void;
  saveFileAs: () => void;
  exportImage: (format: DrawnixExportFormat) => void;
  showAbout: () => void;
}

export const DrawnixHostContext = createContext<DrawnixHost | null>(null);

export const useDrawnixHost = (): DrawnixHost | null => useContext(DrawnixHostContext);
