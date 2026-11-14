import { BoardTransforms, getSelectedElements, PlaitBoard, PlaitPointerType } from '@plait/core';
import { isHotkey } from 'is-hotkey';
import { addImage, canCopySelectionAs, copySelectionAsSvg, saveAsSvg } from '../utils/image';
import { saveAsJSON, saveJSON } from '../data/json';
import {
  DrawnixBoard,
  DrawnixFreehandPointer,
  DrawnixPointerType,
  DrawnixState,
  DrawnixToolState,
} from '../hooks/use-drawnix';
import { BoardCreationMode, setCreationMode } from '@plait/common';
import { MindPointerType } from '@plait/mind';
import { FreehandShape } from './freehand/type';
import { ArrowLineShape, BasicShapes } from '@plait/draw';

/**
 * حرف لاتینِ کلید فیزیکی (مستقل از چیدمان صفحه‌کلید).
 * با چیدمان فارسی، کلید H حرف «ا» می‌دهد؛ این تابع همان 'h' را برمی‌گرداند.
 */
export const getLatinKey = (event: KeyboardEvent): string => {
  if (/^[a-z]$/i.test(event.key)) {
    return event.key.toLowerCase();
  }
  const match = /^Key([A-Z])$/.exec(event.code || '');
  return match ? match[1].toLowerCase() : event.key;
};

/** Ctrl (یا Cmd در مک) + کلید فیزیکی، بدون Alt. */
export const isModCode = (event: KeyboardEvent, code: string): boolean => {
  return (event.ctrlKey || event.metaKey) && !event.altKey && event.code === code;
};

export const buildDrawnixHotkeyPlugin = (
  updateAppState: (appState: Partial<DrawnixState>) => void
) => {
  const withDrawnixHotkey = (board: PlaitBoard) => {
    const { globalKeyDown, keyDown } = board;
    const updatePointer = (
      pointer: DrawnixPointerType,
      nextToolState: Partial<DrawnixToolState> = {}
    ) => {
      updateAppState({
        toolState: {
          ...(board as DrawnixBoard).appState.toolState,
          pointer,
          ...nextToolState,
        },
      });
    };
    board.globalKeyDown = (event: KeyboardEvent) => {
      const isTypingNormal =
        event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
      if (
        !isTypingNormal &&
        (PlaitBoard.getMovingPointInBoard(board) || PlaitBoard.isMovingPointInBoard(board)) &&
        !PlaitBoard.hasBeenTextEditing(board)
      ) {
        // در برنامهٔ دسکتاپ، میان‌برهای پرونده را میزبان به‌صورت سراسری مدیریت می‌کند.
        const hasHost = !!(board as DrawnixBoard).host;
        if (!hasHost && isHotkey(['mod+shift+e'], { byKey: true })(event)) {
          saveAsSvg(board);
          event.preventDefault();
          return;
        }
        if (!hasHost && isHotkey(['mod+shift+s'], { byKey: true })(event)) {
          saveAsJSON(board).then(({ fileHandle }) => {
            updateAppState({ fileHandle });
          });
          event.preventDefault();
          return;
        }
        if (!hasHost && isHotkey(['mod+s'], { byKey: true })(event)) {
          saveJSON(board, (board as DrawnixBoard).appState.fileHandle).then(({ fileHandle }) => {
            updateAppState({ fileHandle });
          });
          event.preventDefault();
          return;
        }
        if (isHotkey(['mod+backspace'])(event) || isHotkey(['mod+delete'])(event)) {
          updateAppState({
            openCleanConfirm: true,
          });
          event.preventDefault();
          return;
        }
        if (isModCode(event, 'KeyU') && !event.shiftKey) {
          addImage(board);
          event.preventDefault();
          return;
        }
        if (!event.altKey && !event.metaKey && !event.ctrlKey) {
          // با صفحه‌کلید فارسی، event.key حرف فارسی است؛ کلید فیزیکی را ملاک می‌گیریم.
          const key = getLatinKey(event);
          if (key === 'h') {
            BoardTransforms.updatePointerType(board, PlaitPointerType.hand);
            updatePointer(PlaitPointerType.hand);
            event.preventDefault();
            return;
          }
          if (key === 'v') {
            BoardTransforms.updatePointerType(board, PlaitPointerType.selection);
            updatePointer(PlaitPointerType.selection);
            event.preventDefault();
            return;
          }
          if (key === 'm') {
            setCreationMode(board, BoardCreationMode.dnd);
            BoardTransforms.updatePointerType(board, MindPointerType.mind);
            updatePointer(MindPointerType.mind);
            event.preventDefault();
            return;
          }
          if (key === 'e') {
            setCreationMode(board, BoardCreationMode.drawing);
            BoardTransforms.updatePointerType(board, FreehandShape.eraser);
            updatePointer(FreehandShape.eraser, {
              lastFreehandPointer: FreehandShape.eraser as DrawnixFreehandPointer,
            });
            event.preventDefault();
            return;
          }
          if (key === 'p') {
            setCreationMode(board, BoardCreationMode.drawing);
            BoardTransforms.updatePointerType(board, FreehandShape.feltTipPen);
            updatePointer(FreehandShape.feltTipPen, {
              lastFreehandPointer: FreehandShape.feltTipPen as DrawnixFreehandPointer,
            });
            event.preventDefault();
            return;
          }
          if (key === 'a' && !isHotkey(['mod+a'])(event)) {
            // will trigger editing text
            if (getSelectedElements(board).length === 0) {
              setCreationMode(board, BoardCreationMode.drawing);
              BoardTransforms.updatePointerType(board, ArrowLineShape.straight);
              updatePointer(ArrowLineShape.straight, {
                lastArrowPointer: ArrowLineShape.straight,
              });
              event.preventDefault();
              return;
            }
          }
          if (key === 'r' || key === 'o' || key === 't') {
            const keyToPointer = {
              r: BasicShapes.rectangle,
              o: BasicShapes.ellipse,
              t: BasicShapes.text,
            };
            if (keyToPointer[key] === BasicShapes.text) {
              setCreationMode(board, BoardCreationMode.dnd);
            } else {
              setCreationMode(board, BoardCreationMode.drawing);
            }
            BoardTransforms.updatePointerType(board, keyToPointer[key]);
            if (keyToPointer[key] === BasicShapes.text) {
              updatePointer(keyToPointer[key]);
            } else {
              updatePointer(keyToPointer[key], {
                lastShapePointer: keyToPointer[key],
              });
            }
            event.preventDefault();
            return;
          }
        }
        if (isHotkey('shift+alt+c')(event)) {
          const canCopySvg = canCopySelectionAs('svg');
          if (canCopySvg) {
            copySelectionAsSvg(board).catch(() => undefined);
            event.preventDefault();
          }

          return;
        }
      }
      globalKeyDown(event);
    };

    board.keyDown = (event: KeyboardEvent) => {
      if (isModCode(event, 'KeyZ') && !event.shiftKey) {
        board.undo();
        event.preventDefault();
        return;
      }

      if (isModCode(event, 'KeyZ') && event.shiftKey) {
        board.redo();
        event.preventDefault();
        return;
      }

      keyDown(event);
    };

    return board;
  };
  return withDrawnixHotkey;
};
