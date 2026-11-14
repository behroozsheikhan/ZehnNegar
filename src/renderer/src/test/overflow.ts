/**
 * کمک‌تابع تست: عنصرهایی که متنشان از کادر بیرون زده است (scrollWidth > clientWidth).
 * در jsdom چیدمان واقعی وجود ندارد (همهٔ اندازه‌ها صفرند)، پس این بررسی آن‌جا همیشه
 * خالی برمی‌گردد؛ بررسی واقعیِ سرریز در تست‌های e2e روی برنامهٔ واقعی انجام می‌شود.
 */
export function findOverflowing(root: ParentNode): Element[] {
  return Array.from(root.querySelectorAll('*')).filter(
    (element) => element.scrollWidth > element.clientWidth + 1
  );
}
