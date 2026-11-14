import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  boardCenter,
  boardTexts,
  clickNativeMenu,
  createMindMap,
  dialogCalls,
  expect,
  leaveEditing,
  nativeMenuLabels,
  nativeSubmenuLabels,
  openAppMenu,
  overflowingElements,
  setOpenPath,
  setSavePath,
  setUnsavedResponse,
  test,
  typeInEditor,
  windowTitle,
} from './fixtures';

const LATIN = /[A-Za-z]/;

function sampleDocument(topic: string): string {
  return JSON.stringify({
    type: 'drawnix',
    version: 1,
    source: 'web',
    elements: [
      {
        id: 'root1',
        type: 'mindmap',
        layout: 'left',
        isRoot: true,
        rightNodeCount: 0,
        width: 120,
        height: 28,
        points: [[0, 0]],
        data: { topic: { children: [{ text: topic }] } },
        children: [
          {
            id: 'child1',
            type: 'mind_child',
            width: 80,
            height: 24,
            data: { topic: { children: [{ text: 'گام نخست' }] } },
            children: [],
          },
        ],
      },
    ],
    viewport: { zoom: 1 },
  });
}

test.describe('شروع برنامه', () => {
  test('رابط فارسی و راست‌به‌چپ است', async ({ launch }) => {
    const { app, page } = await launch();

    await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(await page.evaluate(() => getComputedStyle(document.body).direction)).toBe('rtl');

    // عنوان پنجره و منوی نیتیو فارسی‌اند.
    await expect.poll(() => windowTitle(app)).toContain('ذهن‌نگار');
    expect(await windowTitle(app)).toContain('بی‌نام');
    expect(await nativeMenuLabels(app)).toEqual(['پرونده', 'ویرایش', 'نما', 'راهنما']);
    for (const index of [0, 1, 2, 3]) {
      for (const label of await nativeSubmenuLabels(app, index)) {
        expect(label.replace(/PNG|JPG|SVG/g, ''), label).not.toMatch(LATIN);
      }
    }

    // راهنمای آغازین روی تختهٔ خالی.
    await expect(page.locator('.drawnix-tutorial')).toContainText('ذهن‌نگار');
    await expect(page.locator('.drawnix-tutorial')).toContainText('بدون نیاز به اینترنت');

    // درصد بزرگ‌نمایی با ارقام فارسی.
    await expect(page.locator('.zoom-menu-trigger')).toHaveText('۱۰۰٪');
  });

  test('قلم وزیرمتن از درون برنامه بار می‌شود و هیچ درخواست شبکه‌ای وجود ندارد', async ({ launch }) => {
    const { page } = await launch();

    expect(await page.evaluate(() => document.fonts.check('16px Vazirmatn', 'ذهن‌نگار'))).toBe(true);
    const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(fontFamily).toContain('Vazirmatn');

    const resources = await page.evaluate(() =>
      performance.getEntriesByType('resource').map((entry) => entry.name)
    );
    expect(resources.length).toBeGreaterThan(0);
    expect(resources.filter((name) => !name.startsWith('file:'))).toEqual([]);
  });

  test('renderer به Node دسترسی ندارد و فقط window.api را می‌بیند', async ({ launch }) => {
    const { page } = await launch();
    const exposure = await page.evaluate(() => ({
      require: typeof (window as unknown as { require?: unknown }).require,
      process: typeof (window as unknown as { process?: unknown }).process,
      api: typeof (window as unknown as { api?: unknown }).api,
    }));
    expect(exposure).toEqual({ require: 'undefined', process: 'undefined', api: 'object' });
  });
});

test.describe('نقشهٔ ذهنی و پرونده', () => {
  test('ساخت نقشه با متن فارسی، ذخیره، و بازیابی پس از اجرای دوباره', async ({ launch, workDir }) => {
    const filePath = join(workDir, 'برنامهٔ سفر نوروزی.drawnix');
    const first = await launch();

    await createMindMap(first.page, 'سفر نوروزی ۱۴۰۵');
    await expect.poll(() => windowTitle(first.app)).toContain('●');

    // ذخیره از منوی برنامه؛ پنجرهٔ ذخیره نام فارسی «بی‌نام» را پیشنهاد می‌دهد.
    await setSavePath(first.app, filePath);
    await openAppMenu(first.page);
    await first.page.getByTestId('save-button').click();
    await expect(first.page.getByTestId('app-notice')).toContainText('پرونده ذخیره شد');
    const saveCall = (await dialogCalls(first.app)).find((call) => call.kind === 'save');
    expect(saveCall?.title).toBe('ذخیرهٔ پرونده');
    expect(saveCall?.defaultPath).toBe('بی‌نام.drawnix');

    // پرونده با قالب Drawnix و متن فارسیِ خوانا روی دیسک است.
    const saved = readFileSync(filePath, 'utf8');
    expect(saved).toContain('سفر نوروزی ۱۴۰۵');
    const data = JSON.parse(saved);
    expect(data.type).toBe('drawnix');
    expect(data.elements).toHaveLength(1);
    // نقشهٔ تازه در رابط فارسی به سمت چپ باز می‌شود.
    expect(data.elements[0].layout).toBe('left');

    await expect.poll(() => windowTitle(first.app)).toContain('برنامهٔ سفر نوروزی');
    expect(await windowTitle(first.app)).not.toContain('●');
    await first.close();

    // اجرای دوباره: همان سند از دیتابیس/دیسک برمی‌گردد و در فهرست اخیر هست.
    const second = await launch();
    await expect.poll(() => boardTexts(second.page)).toContain('سفر نوروزی ۱۴۰۵');
    await expect.poll(() => windowTitle(second.app)).toContain('برنامهٔ سفر نوروزی');
    expect(await nativeSubmenuLabels(second.app, 0)).toEqual(
      expect.arrayContaining([expect.stringContaining('برنامهٔ سفر نوروزی.drawnix')])
    );

    await openAppMenu(second.page);
    await second.page.getByTestId('recent-files-button').click();
    const dialog = second.page.getByTestId('recent-dialog');
    await expect(dialog.getByTestId('recent-item')).toHaveCount(1);
    await expect(dialog).toContainText('برنامهٔ سفر نوروزی');
    expect(await overflowingElements(second.page, '[data-testid="recent-dialog"]')).toEqual([]);
  });

  test('تایپ فارسی روی گرهٔ انتخاب‌شده ویرایش را شروع می‌کند و حرف اول گم نمی‌شود', async ({ launch }) => {
    const { page } = await launch();
    const center = await createMindMap(page, 'موضوع');
    await page.mouse.click(center.x, center.y);

    // شبیه‌سازی صفحه‌کلید فارسی: key حرف فارسی و code کلید فیزیکی است.
    const cdp = await page.context().newCDPSession(page);
    const keys: [string, string, number][] = [
      ['س', 'KeyS', 83],
      ['ل', 'KeyG', 71],
      ['ا', 'KeyH', 72],
      ['م', 'KeyL', 76],
    ];
    for (const [key, code, windowsVirtualKeyCode] of keys) {
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key,
        code,
        text: key,
        unmodifiedText: key,
        windowsVirtualKeyCode,
      });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode });
      await page.waitForTimeout(50);
    }
    await page.keyboard.press('Enter');
    await expect.poll(() => boardTexts(page)).toEqual(['سلام']);

    // شاخهٔ تازه با Tab؛ متن فارسی و ارقام فارسی همان‌طور که نوشته شده می‌ماند.
    await page.keyboard.press('Tab');
    await typeInEditor(page, 'هزینه: ۱۲ میلیون');
    await leaveEditing(page);
    await expect.poll(async () => (await boardTexts(page)).sort()).toEqual(['سلام', 'هزینه: ۱۲ میلیون'].sort());
  });

  test('باز کردن پرونده با دوبارکلیک (آرگومان خط فرمان)', async ({ launch, workDir }) => {
    const filePath = join(workDir, 'طرح پژوهش.drawnix');
    writeFileSync(filePath, sampleDocument('طرح پژوهش کارشناسی ارشد'));

    const { app, page } = await launch({ args: [filePath] });
    await expect.poll(() => boardTexts(page)).toEqual(
      expect.arrayContaining(['طرح پژوهش کارشناسی ارشد', 'گام نخست'])
    );
    await expect.poll(() => windowTitle(app)).toContain('طرح پژوهش');
    expect(await windowTitle(app)).not.toContain('●');
    await expect(page.locator('.drawnix-tutorial')).toHaveCount(0);
  });

  test('باز کردن از منو؛ پروندهٔ خراب پیام خطای فارسی می‌دهد', async ({ launch, workDir }) => {
    const good = join(workDir, 'جلسهٔ هفتگی.drawnix');
    const bad = join(workDir, 'خراب.drawnix');
    writeFileSync(good, sampleDocument('جلسهٔ هفتگی'));
    writeFileSync(bad, 'این یک پروندهٔ Drawnix نیست');

    const { app, page } = await launch();

    await setOpenPath(app, bad);
    await clickNativeMenu(app, 'file-open');
    await expect(page.getByRole('alert')).toContainText('معتبر');
    expect(await boardTexts(page)).toEqual([]);

    await setOpenPath(app, good);
    await openAppMenu(page);
    await page.getByTestId('open-button').click();
    await expect.poll(() => boardTexts(page)).toContain('جلسهٔ هفتگی');
    const openCall = (await dialogCalls(app)).find((call) => call.kind === 'open');
    expect(openCall?.title).toBe('باز کردن پرونده');
  });

  test('برون‌بری PNG', async ({ launch, workDir }) => {
    const filePath = join(workDir, 'خروجی نقشه.png');
    const { app, page } = await launch();
    await createMindMap(page, 'نقشهٔ نمونه');

    await setSavePath(app, filePath);
    await clickNativeMenu(app, 'export-png');
    await expect(page.getByTestId('app-notice')).toContainText('خروجی ذخیره شد');

    const bytes = readFileSync(filePath);
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(bytes.length).toBeGreaterThan(500);
    const exportCall = (await dialogCalls(app)).find((call) => call.kind === 'save');
    expect(exportCall?.title).toBe('برون‌بری تصویر');
  });
});

test.describe('تغییرات ذخیره‌نشده', () => {
  test('بستن پنجره می‌پرسد؛ «انصراف» برنامه را باز نگه می‌دارد و «ذخیره نکن» می‌بندد', async ({
    launch,
  }) => {
    const { app, page, close } = await launch();
    await createMindMap(page, 'کار نیمه‌تمام');

    await setUnsavedResponse(app, 2);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close());
    await expect
      .poll(async () => (await dialogCalls(app)).filter((call) => call.kind === 'message').length)
      .toBe(1);
    const question = (await dialogCalls(app)).find((call) => call.kind === 'message');
    expect(question?.message).toBe('تغییرات «بی‌نام» ذخیره شود؟');
    expect(question?.buttons).toEqual(['ذخیره', 'ذخیره نکن', 'انصراف']);
    // پنجره هنوز باز است و سند سر جایش.
    expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(1);
    expect(await boardTexts(page)).toContain('کار نیمه‌تمام');

    await setUnsavedResponse(app, 1);
    await close();
  });

  test('پیش‌نویس ذخیره‌نشده پس از بسته‌شدن ناگهانی بازیابی می‌شود', async ({ launch }) => {
    const first = await launch();
    await createMindMap(first.page, 'یادداشت ذخیره‌نشده');
    // صبر برای ذخیرهٔ خودکار پیش‌نویس در دیتابیس.
    await first.page.waitForTimeout(1500);
    // بسته‌شدن ناگهانی (بدون پرسش).
    await first.app.evaluate(({ app }) => app.exit(0)).catch(() => undefined);

    const second = await launch();
    await expect.poll(() => boardTexts(second.page)).toContain('یادداشت ذخیره‌نشده');
    await expect(second.page.getByTestId('app-notice')).toContainText('بازیابی شد');
    await expect.poll(() => windowTitle(second.app)).toContain('●');
  });
});

test.describe('زبان و پنجره‌ها', () => {
  test('تغییر زبان به انگلیسی جهت و منوها را عوض می‌کند و ماندگار است', async ({ launch }) => {
    const first = await launch();
    await openAppMenu(first.page);
    await first.page.getByTestId('language-switcher-button').hover();
    await first.page.getByTestId('language-en').click();

    await expect(first.page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(first.page.locator('html')).toHaveAttribute('lang', 'en');
    await expect.poll(() => nativeMenuLabels(first.app)).toEqual(['File', 'Edit', 'View', 'Help']);
    await expect.poll(() => windowTitle(first.app)).toContain('ZehnNegar');
    await expect(first.page.locator('.zoom-menu-trigger')).toHaveText('100%');
    await first.close();

    const second = await launch();
    await expect(second.page.locator('html')).toHaveAttribute('dir', 'ltr');
    expect(await nativeMenuLabels(second.app)).toEqual(['File', 'Edit', 'View', 'Help']);

    // برگشت به فارسی
    await openAppMenu(second.page);
    await second.page.getByTestId('language-switcher-button').hover();
    await second.page.getByTestId('language-fa').click();
    await expect(second.page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect.poll(() => nativeMenuLabels(second.app)).toEqual(['پرونده', 'ویرایش', 'نما', 'راهنما']);
  });

  test('«درباره»: نسخه با ارقام فارسی، قدردانی از Drawnix و پیوند در مرورگر سیستم', async ({ launch }) => {
    const { app, page } = await launch();
    await app.evaluate(({ shell }) => {
      const opened: string[] = [];
      (globalThis as Record<string, unknown>).__opened = opened;
      shell.openExternal = async (url: string) => {
        opened.push(url);
      };
    });

    await clickNativeMenu(app, 'help-about');
    const dialog = page.getByTestId('about-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('about-version')).toHaveText('نسخهٔ ۱.۰.۰');
    await expect(page.getByTestId('about-credit')).toContainText('Drawnix');
    await expect(dialog).toContainText('Electron');
    expect(await overflowingElements(page, '[data-testid="about-dialog"]')).toEqual([]);

    // پیوند بیرونی درون برنامه باز نمی‌شود.
    await dialog.getByRole('link', { name: 'Drawnix' }).click();
    await expect
      .poll(() => app.evaluate(() => (globalThis as unknown as { __opened: string[] }).__opened))
      .toEqual(['https://github.com/plait-board/drawnix']);
    expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(1);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('منوی برنامه فارسی است و متنی از کادر بیرون نمی‌زند', async ({ launch }) => {
    const { page } = await launch();
    await openAppMenu(page);
    const expected: [string, string][] = [
      ['new-file-button', 'پروندهٔ جدید'],
      ['open-button', 'باز کردن'],
      ['recent-files-button', 'پرونده‌های اخیر'],
      ['save-button', 'ذخیره'],
      ['save-as-button', 'ذخیره با نام'],
      ['about-button', 'دربارهٔ ذهن‌نگار'],
    ];
    for (const [testId, label] of expected) {
      await expect(page.getByTestId(testId)).toContainText(label);
    }
    expect(await overflowingElements(page, '.menu')).toEqual([]);

    // منو در سمت «شروع» (راست) صفحه باز می‌شود.
    const box = await page.locator('.menu').first().boundingBox();
    const width = await page.evaluate(() => window.innerWidth);
    expect(box && box.x + box.width / 2).toBeGreaterThan(width / 2);
  });

  test('بزرگ‌نمایی با میان‌بر و منوی نیتیو؛ درصد با ارقام فارسی', async ({ launch }) => {
    const { app, page } = await launch();
    const zoom = page.locator('.zoom-menu-trigger');
    await createMindMap(page, 'بزرگ‌نمایی');

    await clickNativeMenu(app, 'view-zoom-reset');
    await expect(zoom).toHaveText('۱۰۰٪');
    await clickNativeMenu(app, 'view-zoom-in');
    await expect(zoom).toHaveText('۱۱۰٪');

    const center = await boardCenter(page);
    await page.mouse.move(center.x, center.y);
    await page.keyboard.press('Control+Minus');
    await expect(zoom).toHaveText('۱۰۰٪');
    await page.keyboard.press('Control+Digit0');
    await expect(zoom).toHaveText('۱۰۰٪');
  });

  test('Ctrl+S با کلید فیزیکی ذخیره می‌کند (بدون پنجره برای سند دارای مسیر)', async ({
    launch,
    workDir,
  }) => {
    const filePath = join(workDir, 'میان‌بر.drawnix');
    const { app, page } = await launch();
    await createMindMap(page, 'ذخیره با میان‌بر');
    await setSavePath(app, filePath);

    await page.keyboard.press('Control+KeyS');
    await expect(page.getByTestId('app-notice')).toContainText('پرونده ذخیره شد');
    expect(existsSync(filePath)).toBe(true);

    // ذخیرهٔ دوباره پنجره باز نمی‌کند.
    const before = (await dialogCalls(app)).filter((call) => call.kind === 'save').length;
    await setSavePath(app, null);
    await page.keyboard.press('Control+KeyS');
    await page.waitForTimeout(500);
    expect((await dialogCalls(app)).filter((call) => call.kind === 'save').length).toBe(before);
    await expect.poll(() => windowTitle(app)).not.toContain('●');
  });
});
