/**
 * خواندن/نوشتن پرونده‌ها. فقط به `node:fs` وابسته است (نه electron) تا در Vitest تست شود.
 */
import { promises as nodeFs } from 'node:fs';
import { dirname, join } from 'node:path';
import type { FileErrorCode } from '../../shared/ipc';
import { MAX_DOCUMENT_BYTES, baseName, parseDocument } from './document';

export interface FileSystemLike {
  stat(path: string): Promise<{ size: number; isFile(): boolean }>;
  readFile(path: string, encoding: 'utf8'): Promise<string>;
  writeFile(path: string, data: string | Uint8Array): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  unlink(path: string): Promise<void>;
}

export type ReadDocumentResult =
  | { ok: true; content: string }
  | { ok: false; code: FileErrorCode };

export type WriteResult = { ok: true } | { ok: false; code: FileErrorCode };

export class FileService {
  constructor(
    private readonly fs: FileSystemLike = nodeFs as unknown as FileSystemLike,
    private readonly maxBytes: number = MAX_DOCUMENT_BYTES
  ) {}

  /** پروندهٔ `.drawnix` را می‌خواند و قالبش را اعتبارسنجی می‌کند. */
  async readDocument(filePath: string): Promise<ReadDocumentResult> {
    let content: string;
    try {
      const info = await this.fs.stat(filePath);
      if (!info.isFile()) {
        return { ok: false, code: 'not-found' };
      }
      if (info.size > this.maxBytes) {
        return { ok: false, code: 'too-large' };
      }
      content = await this.fs.readFile(filePath, 'utf8');
    } catch (error) {
      return { ok: false, code: isNotFound(error) ? 'not-found' : 'io-error' };
    }
    const parsed = parseDocument(content);
    if (!parsed.ok) {
      return { ok: false, code: 'invalid-format' };
    }
    return { ok: true, content: content.replace(/^\uFEFF/, '') };
  }

  /**
   * نوشتن اتمی: اول در پروندهٔ موقت کنار مقصد، سپس rename؛
   * تا با قطع برق/خطا پروندهٔ قبلی کاربر خراب نشود.
   */
  async writeAtomic(filePath: string, data: string | Uint8Array): Promise<WriteResult> {
    const tempPath = join(dirname(filePath), `.${baseName(filePath)}.${process.pid}.tmp`);
    try {
      await this.fs.writeFile(tempPath, data);
      await this.fs.rename(tempPath, filePath);
      return { ok: true };
    } catch {
      try {
        await this.fs.unlink(tempPath);
      } catch {
        // پروندهٔ موقت ساخته نشده بود
      }
      return { ok: false, code: 'io-error' };
    }
  }

  /** فقط سندهای معتبر نوشته می‌شوند تا پروندهٔ خراب تولید نشود. */
  async writeDocument(filePath: string, content: string): Promise<WriteResult> {
    if (!parseDocument(content).ok) {
      return { ok: false, code: 'invalid-format' };
    }
    return this.writeAtomic(filePath, content);
  }
}

function isNotFound(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  return code === 'ENOENT' || code === 'ENOTDIR';
}
