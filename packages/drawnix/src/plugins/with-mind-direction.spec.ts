import { describe, expect, it, vi } from 'vitest';
import type { PlaitBoard, PlaitOperation } from '@plait/core';
import { setBoardLanguage } from '../i18n';
import { isNewEmptyMind, withMindDirection } from './with-mind-direction';

const mind = (overrides: Record<string, unknown> = {}) => ({
  id: 'm1',
  type: 'mind',
  layout: 'right',
  isRoot: true,
  children: [],
  data: { topic: { children: [{ text: 'موضوع اصلی' }] } },
  points: [[0, 0]],
  ...overrides,
});

function setup(language: 'fa' | 'en') {
  const apply = vi.fn();
  const board = { apply } as unknown as PlaitBoard;
  setBoardLanguage(board, language);
  withMindDirection(board);
  return { board, apply };
}

const insert = (node: unknown, path = [0]): PlaitOperation => ({ type: 'insert_node', path, node }) as PlaitOperation;

describe('withMindDirection', () => {
  it('در فارسی، نقشهٔ ذهنی تازه به سمت چپ باز می‌شود', () => {
    const { board, apply } = setup('fa');
    board.apply(insert(mind()));
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply.mock.calls[0][0].node.layout).toBe('left');
    expect(apply.mock.calls[0][0].node.data.topic.children[0].text).toBe('موضوع اصلی');
  });

  it('در انگلیسی رفتار اصلی (سمت راست) می‌ماند', () => {
    const { board, apply } = setup('en');
    const operation = insert(mind());
    board.apply(operation);
    expect(apply).toHaveBeenCalledWith(operation);
  });

  it('نقشه‌های دارای شاخه، چیدمان‌های دیگر و عنصرهای غیر نقشه دست‌نخورده می‌مانند', () => {
    const { board, apply } = setup('fa');
    const operations = [
      insert(mind({ children: [mind({ id: 'c1', isRoot: false })] })),
      insert(mind({ layout: 'standard' })),
      insert({ id: 'g1', type: 'geometry', shape: 'rectangle' }),
      insert(mind(), [0, 1]),
      { type: 'set_node', path: [0], properties: {}, newProperties: { layout: 'right' } } as unknown as PlaitOperation,
    ];
    for (const operation of operations) {
      board.apply(operation);
    }
    expect(apply.mock.calls.map((call) => call[0])).toEqual(operations);
  });

  it('همان شیء وارد تخته می‌شود (Plait بلافاصله همان را انتخاب می‌کند)', () => {
    const { board, apply } = setup('fa');
    const node = mind();
    const operation = insert(node);
    board.apply(operation);
    expect(apply.mock.calls[0][0]).toBe(operation);
    expect(apply.mock.calls[0][0].node).toBe(node);
    expect(node.layout).toBe('left');
  });

  it('شیء منجمد (از تاریخچه) دست‌نخورده می‌ماند', () => {
    const { board, apply } = setup('fa');
    const node = Object.freeze(mind());
    board.apply(insert(node));
    expect(apply.mock.calls[0][0].node.layout).toBe('right');
  });
});

describe('isNewEmptyMind', () => {
  it('فقط نقشهٔ خالی با چیدمان پیش‌فرض', () => {
    expect(isNewEmptyMind(mind())).toBe(true);
    expect(isNewEmptyMind(mind({ children: undefined }))).toBe(true);
    expect(isNewEmptyMind(mind({ type: 'mindmap' }))).toBe(true);
    expect(isNewEmptyMind(mind({ type: 'mind_child' }))).toBe(false);
    expect(isNewEmptyMind(mind({ layout: 'left' }))).toBe(false);
    expect(isNewEmptyMind(null)).toBe(false);
    expect(isNewEmptyMind({ type: 'geometry' })).toBe(false);
  });
});
