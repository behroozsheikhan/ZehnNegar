/**
 * نمایش مسیر پرونده در متن راست‌به‌چپ.
 * مسیر همیشه چپ‌به‌راست است و هر بخش آن جداگانه ایزوله می‌شود تا نام‌های فارسیِ کنار هم
 * (مثل «کار\جلسهٔ هفتگی») ترتیبشان به‌هم نریزد.
 */
export function FilePath({ path, className }: { path: string; className?: string }): React.JSX.Element {
  const parts = path.split(/([\\/])/);
  return (
    <span className={className} dir="ltr" title={path} data-testid="file-path">
      {parts.map((part, index) =>
        part === '\\' || part === '/' ? part : <bdi key={index}>{part}</bdi>
      )}
    </span>
  );
}
