/**
 * جهت شاخه‌های نقشهٔ ذهنی.
 *
 * جهت فقط روی گرهٔ ریشه (اولین گره) تعیین می‌شود و برای همهٔ شاخه‌ها و زیرشاخه‌های آن به کار
 * می‌رود: چپ، راست یا پایین. در Plait هر گره می‌تواند چیدمان خودش را داشته باشد؛ هنگام عوض
 * کردن جهت ریشه، چیدمانِ اختصاصی زیرشاخه‌ها پاک می‌شود تا همه از ریشه پیروی کنند.
 */
import {
  getSelectedElements,
  PlaitBoard,
  PlaitElement,
  Transforms,
  type Path,
} from "@plait/core";
import { MindLayoutType } from "@plait/layouts";
import { PlaitMind } from "@plait/mind";

export type MindTreeDirection = "left" | "right" | "down";

export const MIND_TREE_DIRECTIONS: readonly MindTreeDirection[] = [
  "left",
  "right",
  "down",
];

const LAYOUT_BY_DIRECTION: Record<MindTreeDirection, MindLayoutType> = {
  left: MindLayoutType.left,
  right: MindLayoutType.right,
  down: MindLayoutType.downward,
};

interface LayoutNode {
  layout?: string | null;
  children?: LayoutNode[];
}

/** گرهٔ ریشه، اگر دقیقاً همان (و فقط همان) انتخاب شده باشد. */
export const getSelectedMindRoot = (board: PlaitBoard): PlaitMind | null => {
  const selected = getSelectedElements(board);
  if (selected.length !== 1) {
    return null;
  }
  const element = selected[0] as PlaitElement;
  // فقط ریشهٔ سطح اول تخته؛ PlaitMind.isMind تنها نوع گره را می‌سنجد.
  return PlaitMind.isMind(element) && board.children.includes(element)
    ? (element as PlaitMind)
    : null;
};

/** جهت کنونی ریشه؛ اگر چیدمان ریشه یکی از این سه نباشد (مثلاً «دوطرفه») نتیجه null است. */
export const getMindTreeDirection = (
  root: LayoutNode,
): MindTreeDirection | null => {
  return (
    MIND_TREE_DIRECTIONS.find(
      (direction) => LAYOUT_BY_DIRECTION[direction] === root.layout,
    ) ?? null
  );
};

const collectLayoutOverrides = (
  node: LayoutNode,
  path: Path,
  result: Path[],
) => {
  node.children?.forEach((child, index) => {
    const childPath = [...path, index];
    if (child.layout) {
      result.push(childPath);
    }
    collectLayoutOverrides(child, childPath, result);
  });
};

export const setMindTreeDirection = (
  board: PlaitBoard,
  root: PlaitMind,
  direction: MindTreeDirection,
) => {
  // ریشه همیشه عنصر سطح اول تخته است.
  const rootIndex = board.children.indexOf(root);
  if (rootIndex < 0) {
    return;
  }
  const rootPath: Path = [rootIndex];
  const overrides: Path[] = [];
  collectLayoutOverrides(root as LayoutNode, rootPath, overrides);
  for (const path of overrides) {
    Transforms.setNode(board, { layout: null }, path);
  }
  if (root.layout !== LAYOUT_BY_DIRECTION[direction]) {
    Transforms.setNode(
      board,
      { layout: LAYOUT_BY_DIRECTION[direction] },
      rootPath,
    );
  }
};
