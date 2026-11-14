import { describe, expect, it, vi } from 'vitest';
import type { PlaitBoard, PlaitElement } from '@plait/core';
import type { PlaitMind } from '@plait/mind';
import {
  getMindTreeDirection,
  getSelectedMindRoot,
  MIND_TREE_DIRECTIONS,
  setMindTreeDirection,
} from './mind-direction';

const selection = vi.hoisted(() => ({ elements: [] as unknown[] }));
vi.mock('@plait/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@plait/core')>()),
  getSelectedElements: () => selection.elements,
}));

const node = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  data: { topic: { children: [{ text: id }] } },
  children: [] as unknown[],
  ...overrides,
});

const mindRoot = (overrides: Record<string, unknown> = {}) =>
  node('root', { type: 'mind', isRoot: true, layout: 'left', points: [[0, 0]], ...overrides });

function boardWith(children: unknown[]) {
  const apply = vi.fn();
  const board = { children, apply } as unknown as PlaitBoard;
  return { board, apply };
}

describe('getMindTreeDirection', () => {
  it('سه جهت چپ، راست و پایین را می‌شناسد', () => {
    expect(MIND_TREE_DIRECTIONS).toEqual(['left', 'right', 'down']);
    expect(getMindTreeDirection({ layout: 'left' })).toBe('left');
    expect(getMindTreeDirection({ layout: 'right' })).toBe('right');
    expect(getMindTreeDirection({ layout: 'downward' })).toBe('down');
  });

  it('برای چیدمان‌های دیگر (مثلاً دوطرفه) یا بدون چیدمان null می‌دهد', () => {
    expect(getMindTreeDirection({ layout: 'standard' })).toBeNull();
    expect(getMindTreeDirection({ layout: 'upward' })).toBeNull();
    expect(getMindTreeDirection({})).toBeNull();
  });
});

describe('getSelectedMindRoot', () => {
  it('فقط وقتی ریشه — و فقط ریشه — انتخاب شده باشد آن را برمی‌گرداند', () => {
    const child = node('child');
    const root = mindRoot({ children: [child] });
    const other = mindRoot({ id: 'other' });
    const shape = { id: 'g1', type: 'geometry' };
    const { board } = boardWith([root, other, shape]);

    selection.elements = [root];
    expect(getSelectedMindRoot(board)).toBe(root);

    selection.elements = [child];
    expect(getSelectedMindRoot(board)).toBeNull();

    selection.elements = [shape];
    expect(getSelectedMindRoot(board)).toBeNull();

    selection.elements = [root, other];
    expect(getSelectedMindRoot(board)).toBeNull();

    selection.elements = [];
    expect(getSelectedMindRoot(board)).toBeNull();
  });

  it('گره‌ای از نوع mind که عنصر سطح اول تخته نیست ریشه حساب نمی‌شود', () => {
    const detached = mindRoot({ id: 'detached' });
    const { board } = boardWith([mindRoot()]);
    selection.elements = [detached];
    expect(getSelectedMindRoot(board)).toBeNull();
  });
});

describe('setMindTreeDirection', () => {
  it('چیدمان ریشه را عوض می‌کند', () => {
    const root = mindRoot({ children: [node('a'), node('b')] });
    const { board, apply } = boardWith([{ id: 'g1', type: 'geometry' }, root]);

    setMindTreeDirection(board, root as unknown as PlaitMind, 'down');

    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply.mock.calls[0][0]).toMatchObject({
      type: 'set_node',
      path: [1],
      properties: { layout: 'left' },
      newProperties: { layout: 'downward' },
    });
  });

  it.each([
    ['left', 'left'],
    ['right', 'right'],
    ['down', 'downward'],
  ] as const)('جهت «%s» چیدمان «%s» را می‌گذارد', (direction, layout) => {
    const root = mindRoot({ layout: 'standard' });
    const { board, apply } = boardWith([root]);
    setMindTreeDirection(board, root as unknown as PlaitMind, direction);
    expect(apply.mock.calls.at(-1)?.[0].newProperties).toEqual({ layout });
  });

  it('چیدمان اختصاصی همهٔ زیرشاخه‌ها را پاک می‌کند تا از ریشه پیروی کنند', () => {
    const root = mindRoot({
      layout: 'right',
      children: [
        node('a', { layout: 'right-bottom-indented', children: [node('a1', { layout: 'left' })] }),
        node('b'),
        node('c', { children: [node('c1'), node('c2', { layout: 'downward' })] }),
      ],
    });
    const { board, apply } = boardWith([root]);

    setMindTreeDirection(board, root as unknown as PlaitMind, 'down');

    const operations = apply.mock.calls.map((call) => call[0]);
    // حذف یک ویژگی در Plait یعنی: در properties هست و در newProperties نیست.
    expect(
      operations.map((operation) => [operation.path, operation.properties, operation.newProperties])
    ).toEqual([
      [[0, 0], { layout: 'right-bottom-indented' }, {}],
      [[0, 0, 0], { layout: 'left' }, {}],
      [[0, 2, 1], { layout: 'downward' }, {}],
      [[0], { layout: 'right' }, { layout: 'downward' }],
    ]);
  });

  it('اگر جهت همان باشد و زیرشاخه‌ای چیدمان اختصاصی نداشته باشد، کاری نمی‌کند', () => {
    const root = mindRoot({ layout: 'right', children: [node('a')] });
    const { board, apply } = boardWith([root]);
    setMindTreeDirection(board, root as unknown as PlaitMind, 'right');
    expect(apply).not.toHaveBeenCalled();
  });

  it('گره‌ای که روی تخته نیست نادیده گرفته می‌شود', () => {
    const { board, apply } = boardWith([mindRoot()]);
    setMindTreeDirection(board, mindRoot({ id: 'x' }) as unknown as PlaitMind, 'down');
    expect(apply).not.toHaveBeenCalled();
  });

  it('عنصرهای دیگر تخته دست‌نخورده می‌مانند', () => {
    const other = mindRoot({ id: 'other', layout: 'left', children: [node('o1', { layout: 'left' })] });
    const root = mindRoot({ layout: 'left' });
    const { board, apply } = boardWith([other as PlaitElement, root]);
    setMindTreeDirection(board, root as unknown as PlaitMind, 'right');
    expect(apply.mock.calls.map((call) => call[0].path)).toEqual([[1]]);
  });
});
