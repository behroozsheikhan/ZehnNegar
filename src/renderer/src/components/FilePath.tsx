/**
 * نمایش مسیر پرونده در متن راست‌به‌چپ.
 * مسیر همیشه چپ‌به‌راست است و هر بخش آن جداگانه ایزوله می‌شود تا نام‌های فارسیِ کنار هم
 * (مثل «کار\جلسهٔ هفتگی») ترتیبشان به‌هم نریزد. جهت پایهٔ هر بخش هم چپ‌به‌راست است تا پسوند
 * پرونده مثل Windows Explorer در انتهای نام بماند («نقشهٔ من.drawnix»، نه «drawnix.نقشهٔ من»).
 */
export function FilePath({ path, className }: { path: string; className?: string }): React.JSX.Element {
  const parts = path.split(/([\\/])/);
  return (
    <span className={className} dir="ltr" title={path} data-testid="file-path">
      {parts.map((part, index) =>
        part === '\\' || part === '/' ? (
          part
        ) : (
          <bdi key={index} dir="ltr">
            {part}
          </bdi>
        )
      )}
    </span>
  );
}
