/**
 * انتخاب پرونده با `<input type="file">`.
 *
 * چرا از File System Access API ‏(showOpenFilePicker) استفاده نمی‌شود: برنامهٔ دسکتاپ همهٔ
 * مجوزهای مرورگر را رد می‌کند (برنامه آفلاین است) و در Electron خواندن پرونده‌ای که با
 * showOpenFilePicker انتخاب شده مجوز «fileSystem» می‌خواهد؛ نتیجه این بود که پنجرهٔ انتخاب باز
 * می‌شد ولی پس از انتخاب تصویر هیچ اتفاقی نمی‌افتاد. `<input type="file">` به هیچ مجوزی نیاز
 * ندارد و در مرورگر و Electron یکسان کار می‌کند.
 *
 * اگر کاربر انصراف دهد، نتیجه `null` است.
 */
export interface PickFileOptions {
  /** مقدار ویژگی accept؛ مثلاً ‎`image/png,.png` */
  accept?: string;
}

export const pickFile = (options: PickFileOptions = {}): Promise<File | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (options.accept) {
      input.accept = options.accept;
    }
    input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');
    input.setAttribute('data-testid', 'file-picker-input');
    input.style.display = 'none';

    let settled = false;
    const finish = (file: File | null) => {
      if (settled) {
        return;
      }
      settled = true;
      input.remove();
      resolve(file);
    };
    input.addEventListener('change', () => finish(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => finish(null));

    document.body.appendChild(input);
    input.click();
  });
};
