import React from "react";
import classNames from "classnames";
import { PlaitBoard } from "@plait/core";
import { PlaitMind } from "@plait/mind";
import { ToolButton } from "../../tool-button";
import {
  MindDirectionDownIcon,
  MindDirectionLeftIcon,
  MindDirectionRightIcon,
} from "../../icons";
import { useI18n } from "../../../i18n";
import type { Translations } from "../../../i18n";
import {
  getMindTreeDirection,
  MIND_TREE_DIRECTIONS,
  setMindTreeDirection,
  type MindTreeDirection,
} from "../../../utils/mind-direction";

const DIRECTION_ICONS: Record<MindTreeDirection, React.ReactNode> = {
  left: MindDirectionLeftIcon,
  right: MindDirectionRightIcon,
  down: MindDirectionDownIcon,
};

const DIRECTION_LABELS: Record<MindTreeDirection, keyof Translations> = {
  left: "mind.direction.left",
  right: "mind.direction.right",
  down: "mind.direction.down",
};

export type MindDirectionControlProps = {
  board: PlaitBoard;
  root: PlaitMind;
};

/**
 * انتخاب جهت شاخه‌ها (چپ، راست، پایین). فقط وقتی دیده می‌شود که گرهٔ ریشه انتخاب شده باشد؛
 * پس درست هنگام ساختن اولین گره در دسترس است و برای همهٔ زیرشاخه‌ها اعمال می‌شود.
 */
export const MindDirectionControl: React.FC<MindDirectionControlProps> = ({
  board,
  root,
}) => {
  const { t } = useI18n();
  const current = getMindTreeDirection(root);

  return (
    <div
      className="mind-direction-control"
      role="group"
      aria-label={t("mind.direction")}
      data-testid="mind-direction"
    >
      {/* جهت‌ها فیزیکی‌اند: «چپ» همیشه سمت چپ و «راست» سمت راست می‌نشیند. */}
      <div className="mind-direction-control__buttons" dir="ltr">
        {MIND_TREE_DIRECTIONS.map((direction) => {
          const label = t(DIRECTION_LABELS[direction]);
          const selected = current === direction;
          return (
            <ToolButton
              key={direction}
              className={classNames("property-button", "mind-direction-button")}
              visible={true}
              type="button"
              icon={DIRECTION_ICONS[direction]}
              title={label}
              aria-label={label}
              aria-pressed={selected}
              data-testid={`mind-direction-${direction}`}
              selected={selected}
              onPointerUp={() => {
                setMindTreeDirection(board, root, direction);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
