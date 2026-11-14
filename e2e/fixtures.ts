/**
 * ابزار مشترک تست‌های e2e: اجرای برنامهٔ واقعی با پوشهٔ دادهٔ موقت و جایگزینی
 * پنجره‌های گفت‌وگوی نیتیو (که Playwright نمی‌تواند با آن‌ها کار کند).
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  _electron as electron,
  test as base,
  expect,
  type ElectronApplication,
  type Page,
} from '@playwright/test';

const ROOT = resolve(__dirname, '..');

/**
 * به‌طور پیش‌فرض خروجی `npm run build` با Electron توسعه اجرا می‌شود.
 * با ZN_EXECUTABLE می‌توان همین تست‌ها را روی برنامهٔ بسته‌بندی‌شده اجرا کرد
 * (مثلاً release/win-unpacked/ZehnNegar.exe در CI ویندوز).
 */
const PACKAGED_EXECUTABLE = process.env.ZN_EXECUTABLE ? resolve(ROOT, process.env.ZN_EXECUTABLE) : undefined;

export interface LaunchOptions {
  /** آرگومان‌های اضافه (مثلاً مسیر پرونده‌ای که با دوبارکلیک باز شده). */
  args?: string[];
}

export interface RunningApp {
  app: ElectronApplication;
  page: Page;
  /** بستن عادی برنامه (پنجره بسته می‌شود و فرایند تمام می‌شود). */
  close(): Promise<void>;
}

export interface DialogCall {
  kind: 'open' | 'save' | 'message';
  title?: string;
  message?: string;
  defaultPath?: string;
  buttons?: string[];
}

interface Fixtures {
  /** پوشهٔ دادهٔ برنامه (دیتابیس)؛ برای هر تست تازه است. */
  userData: string;
  /** پوشهٔ موقت برای پرونده‌های کاربر. */
  workDir: string;
  launch: (options?: LaunchOptions) => Promise<RunningApp>;
}

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  userData: async ({}, use) => {
    const dir = mkdtempSync(join(tmpdir(), 'zehnnegar-data-'));
    await use(dir);
    rmSync(dir, { recursive: true, force: true });
  },

  // eslint-disable-next-line no-empty-pattern
  workDir: async ({}, use) => {
    // نام پوشه عمداً فارسی و فاصله‌دار است.
    const dir = mkdtempSync(join(tmpdir(), 'پرونده‌های من '));
    await use(dir);
    rmSync(dir, { recursive: true, force: true });
  },

  launch: async ({ userData }, use) => {
    const running: RunningApp[] = [];

    await use(async (options = {}) => {
      const env: Record<string, string> = {};
      for (const [key, value] of Object.entries(process.env)) {
        // NODE_OPTIONS محیط توسعه نباید به Electron برسد.
        if (value !== undefined && key !== 'NODE_OPTIONS' && key !== 'ELECTRON_RUN_AS_NODE') {
          env[key] = value;
        }
      }
      env.APP_USER_DATA = userData;

      const extraArgs = options.args ?? [];
      const app = await electron.launch(
        PACKAGED_EXECUTABLE
          ? { executablePath: PACKAGED_EXECUTABLE, args: extraArgs, env }
          : { cwd: ROOT, args: ['.', '--no-sandbox', '--disable-gpu', ...extraArgs], env }
      );

      // پیش‌فرض امن: هیچ پنجرهٔ نیتیوی باز نمی‌ماند (انصراف / «ذخیره نکن»).
      await app.evaluate(({ dialog }) => {
        const calls: unknown[] = [];
        const state = {
          calls,
          openPath: null as string | null,
          savePath: null as string | null,
          messageResponse: 1,
        };
        (globalThis as Record<string, unknown>).__dialogs = state;
        const optionsOf = (args: unknown[]): Record<string, unknown> =>
          (args.length > 1 ? args[1] : args[0]) as Record<string, unknown>;
        dialog.showOpenDialog = (async (...args: unknown[]) => {
          calls.push({ kind: 'open', title: optionsOf(args).title });
          return state.openPath
            ? { canceled: false, filePaths: [state.openPath] }
            : { canceled: true, filePaths: [] };
        }) as typeof dialog.showOpenDialog;
        dialog.showSaveDialog = (async (...args: unknown[]) => {
          const o = optionsOf(args);
          calls.push({ kind: 'save', title: o.title, defaultPath: o.defaultPath });
          return state.savePath ? { canceled: false, filePath: state.savePath } : { canceled: true, filePath: '' };
        }) as typeof dialog.showSaveDialog;
        dialog.showMessageBox = (async (...args: unknown[]) => {
          const o = optionsOf(args);
          calls.push({ kind: 'message', message: o.message, buttons: o.buttons });
          return { response: state.messageResponse, checkboxChecked: false };
        }) as typeof dialog.showMessageBox;
      });

      const page = await app.firstWindow();
      await page.getByTestId('app-root').waitFor({ timeout: 30_000 });

      const instance: RunningApp = {
        app,
        page,
        close: async () => {
          const exited = app.waitForEvent('close', { timeout: 20_000 }).catch(() => undefined);
          await app
            .evaluate(({ BrowserWindow }) => {
              BrowserWindow.getAllWindows()[0]?.close();
            })
            .catch(() => undefined);
          await exited;
        },
      };
      running.push(instance);
      return instance;
    });

    for (const instance of running) {
      // خروج قطعی (بدون پرسش «ذخیره شود؟»)؛ اگر برنامه قبلاً بسته شده باشد خطا نادیده گرفته می‌شود.
      await instance.app.evaluate(({ app }) => app.exit(0)).catch(() => undefined);
      await instance.app.close().catch(() => undefined);
    }
  },
});

export { expect };

// ---------- پنجره‌های نیتیو ----------

export async function setSavePath(app: ElectronApplication, filePath: string | null): Promise<void> {
  await app.evaluate((_electron, value) => {
    (globalThis as unknown as { __dialogs: { savePath: string | null } }).__dialogs.savePath = value;
  }, filePath);
}

export async function setOpenPath(app: ElectronApplication, filePath: string | null): Promise<void> {
  await app.evaluate((_electron, value) => {
    (globalThis as unknown as { __dialogs: { openPath: string | null } }).__dialogs.openPath = value;
  }, filePath);
}

/** پاسخ پنجرهٔ «تغییرات ذخیره شود؟»: ۰ = ذخیره، ۱ = ذخیره نکن، ۲ = انصراف. */
export async function setUnsavedResponse(app: ElectronApplication, response: 0 | 1 | 2): Promise<void> {
  await app.evaluate((_electron, value) => {
    (globalThis as unknown as { __dialogs: { messageResponse: number } }).__dialogs.messageResponse = value;
  }, response);
}

export async function dialogCalls(app: ElectronApplication): Promise<DialogCall[]> {
  return app.evaluate(
    () => (globalThis as unknown as { __dialogs: { calls: DialogCall[] } }).__dialogs.calls
  );
}

// ---------- پنجره و منو ----------

export async function windowTitle(app: ElectronApplication): Promise<string> {
  return app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.getTitle() ?? '');
}

/** برچسب‌های منوی نیتیو (سطح اول). */
export async function nativeMenuLabels(app: ElectronApplication): Promise<string[]> {
  return app.evaluate(({ Menu }) => (Menu.getApplicationMenu()?.items ?? []).map((item) => item.label));
}

/** همهٔ برچسب‌های یک زیرمنوی نیتیو. */
export async function nativeSubmenuLabels(app: ElectronApplication, index: number): Promise<string[]> {
  return app.evaluate(({ Menu }, i) => {
    const collect = (items: Electron.MenuItem[]): string[] =>
      items.flatMap((item) => [
        ...(item.type === 'separator' ? [] : [item.label]),
        ...(item.submenu ? collect(item.submenu.items) : []),
      ]);
    const top = Menu.getApplicationMenu()?.items[i];
    return top?.submenu ? collect(top.submenu.items) : [];
  }, index);
}

/** کلیک روی یک مورد منوی نیتیو با شناسه‌اش. */
export async function clickNativeMenu(app: ElectronApplication, id: string): Promise<void> {
  await app.evaluate(({ Menu, BrowserWindow }, itemId) => {
    const item = Menu.getApplicationMenu()?.getMenuItemById(itemId);
    if (!item) {
      throw new Error(`menu item not found: ${itemId}`);
    }
    item.click(undefined, BrowserWindow.getAllWindows()[0], undefined);
  }, id);
}

/** منوی درون‌برنامه‌ای (☰) را باز می‌کند. */
export async function openAppMenu(page: Page): Promise<void> {
  await page.locator('.app-toolbar button').first().click();
  await page.getByTestId('save-as-button').waitFor();
}

// ---------- تخته ----------

export async function boardCenter(page: Page): Promise<{ x: number; y: number }> {
  return page.evaluate(() => ({
    x: Math.round(window.innerWidth / 2),
    y: Math.round(window.innerHeight / 2),
  }));
}

/** متن همهٔ گره‌ها/متن‌های روی تخته. */
export async function boardTexts(page: Page): Promise<string[]> {
  return page
    .locator('.plait-text-container')
    .evaluateAll((elements) => elements.map((element) => (element.textContent ?? '').replace(/\uFEFF/g, '')));
}

/**
 * یک نقشهٔ ذهنی تازه در مرکز تخته می‌سازد و متن ریشه را می‌نویسد.
 * (ابزار نقشهٔ ذهنی با کلید M، کلیک برای ساخت، دوبارکلیک برای ویرایش.)
 */
export async function createMindMap(page: Page, text: string): Promise<{ x: number; y: number }> {
  const center = await boardCenter(page);
  // میان‌برهای ابزار فقط وقتی نشانگر روی تخته است کار می‌کنند.
  await page.mouse.move(center.x - 40, center.y - 20);
  await page.mouse.move(center.x, center.y);
  await page.keyboard.press('m');
  await page.mouse.click(center.x, center.y);
  await expect(page.locator('.plait-text-container')).toHaveCount(1);
  await page.keyboard.press('v');
  await page.mouse.dblclick(center.x, center.y);
  await typeInEditor(page, text);
  await leaveEditing(page);
  await expect.poll(() => boardTexts(page)).toContain(text);
  return center;
}

/** منتظر می‌ماند تا ویرایشگر متن فوکوس بگیرد و سپس متن را (جایگزین متن انتخاب‌شده) می‌نویسد. */
export async function typeInEditor(page: Page, text: string): Promise<void> {
  await expect(page.locator('[contenteditable="true"]')).toBeFocused();
  await page.keyboard.insertText(text);
}

/** کلیک روی جای خالی تخته: ویرایش متن تمام و انتخاب برداشته می‌شود. */
export async function leaveEditing(page: Page): Promise<void> {
  const size = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  await page.mouse.click(Math.round(size.w * 0.15), Math.round(size.h * 0.8));
  await expect(page.locator('[contenteditable="true"]')).toHaveCount(0);
}

/** عنصرهایی که متنشان از کادرشان بیرون زده است (نباید چیزی باشد). */
export async function overflowingElements(page: Page, rootSelector: string): Promise<string[]> {
  return page.evaluate((selector) => {
    const root = document.querySelector(selector);
    if (!root) {
      return [`root not found: ${selector}`];
    }
    return Array.from(root.querySelectorAll<HTMLElement>('*'))
      .filter((element) => {
        const style = getComputedStyle(element);
        // بریدن عمدی با سه‌نقطه (ellipsis) سرریز به حساب نمی‌آید.
        if (style.textOverflow === 'ellipsis' || style.overflowX === 'auto' || style.overflowX === 'scroll') {
          return false;
        }
        return element.scrollWidth > element.clientWidth + 1 && style.overflowX !== 'hidden';
      })
      .map((element) => `${element.tagName.toLowerCase()}.${element.className} «${(element.textContent ?? '').slice(0, 40)}»`);
  }, rootSelector);
}
