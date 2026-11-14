import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlaitBoard } from '@plait/core';
import type { PlaitMind } from '@plait/mind';
import { I18nProvider, type Language } from '../../../i18n';
import { MindDirectionControl } from './mind-direction-control';

const root = (layout: string | undefined) =>
  ({
    id: 'root',
    type: 'mind',
    isRoot: true,
    layout,
    children: [{ id: 'a', layout: 'left', children: [] }],
  }) as unknown as PlaitMind;

function renderControl(language: Language, layout: string | undefined) {
  const apply = vi.fn();
  const mind = root(layout);
  const board = { children: [mind], apply } as unknown as PlaitBoard;
  render(
    <I18nProvider initialLanguage={language}>
      <MindDirectionControl board={board} root={mind} />
    </I18nProvider>
  );
  return { apply };
}

const pressed = () =>
  (['left', 'right', 'down'] as const).map(
    (direction) => screen.getByTestId(`mind-direction-${direction}`).getAttribute('aria-pressed')
  );

describe('MindDirectionControl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('در رابط فارسی سه جهت چپ، راست و پایین را با برچسب فارسی نشان می‌دهد', () => {
    renderControl('fa', 'left');

    expect(screen.getByRole('group', { name: 'جهت شاخه‌ها' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'شاخه‌ها به سمت چپ' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'شاخه‌ها به سمت راست' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'شاخه‌ها به سمت پایین' })).toBeTruthy();
    expect(pressed()).toEqual(['true', 'false', 'false']);
  });

  it('در رابط انگلیسی هم همان سه انتخاب هست', () => {
    renderControl('en', 'right');

    expect(screen.getByRole('group', { name: 'Branch direction' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Branches to the left' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Branches to the right' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Branches downward' })).toBeTruthy();
    expect(pressed()).toEqual(['false', 'true', 'false']);
  });

  it('دکمه‌ها همیشه به ترتیب فیزیکی چپ، راست، پایین چیده می‌شوند', () => {
    renderControl('fa', 'downward');
    const group = screen.getByTestId('mind-direction');
    expect(group.querySelector('[dir="ltr"]')).toBeTruthy();
    expect(
      Array.from(group.querySelectorAll('button')).map((button) => button.getAttribute('data-testid'))
    ).toEqual(['mind-direction-left', 'mind-direction-right', 'mind-direction-down']);
    expect(pressed()).toEqual(['false', 'false', 'true']);
  });

  it('برای چیدمان دوطرفه هیچ‌کدام انتخاب‌شده نیست', () => {
    renderControl('fa', 'standard');
    expect(pressed()).toEqual(['false', 'false', 'false']);
  });

  it('انتخاب «پایین» چیدمان ریشه را عوض و چیدمان اختصاصی زیرشاخه‌ها را پاک می‌کند', () => {
    const { apply } = renderControl('fa', 'left');

    fireEvent.pointerUp(screen.getByTestId('mind-direction-down'));

    expect(
      apply.mock.calls.map((call) => [call[0].path, call[0].properties, call[0].newProperties])
    ).toEqual([
      [[0, 0], { layout: 'left' }, {}],
      [[0], { layout: 'left' }, { layout: 'downward' }],
    ]);
  });
});
