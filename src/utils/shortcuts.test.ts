import { describe, it, expect } from 'vitest';
import { ru } from 'date-fns/locale/ru';
import { createDefaultShortcuts, shortcutRanges } from './shortcuts';

describe('createDefaultShortcuts', () => {
  const now = new Date(2026, 4, 20, 12, 0); // 2026-05-20

  it('produces five labelled presets', () => {
    const result = createDefaultShortcuts(now);
    expect(result.map((s) => s.label)).toEqual([
      'Today', 'Last 7 days', 'Last 30 days', 'This week', 'This month',
    ]);
  });

  it('"Last 7 days" starts six days before today', () => {
    const last7 = createDefaultShortcuts(now).find((s) => s.label === 'Last 7 days')!;
    expect(last7.range[0]).toEqual(new Date(2026, 4, 14));
  });

  it('"This month" spans the full month', () => {
    const month = createDefaultShortcuts(now).find((s) => s.label === 'This month')!;
    expect(month.range[0]).toEqual(new Date(2026, 4, 1));
    expect(month.range[1]?.getDate()).toBe(31);
  });
});

describe('shortcutRanges', () => {
  const now = new Date(2026, 4, 20, 12, 0); // Wednesday, 2026-05-20

  it('carries no text at all', () => {
    // The whole point of the split: a host that needs its own wording should
    // not have to reimplement the arithmetic to get it. Anything returned here
    // that looked like a label would defeat that.
    for (const build of Object.values(shortcutRanges)) {
      const range = build(now);
      expect(Array.isArray(range)).toBe(true);
      expect(range).toHaveLength(2);
      range.forEach((d) => expect(d).toBeInstanceOf(Date));
    }
  });

  it('starts the week where the locale says, not always on Sunday', () => {
    // A calendar rendered with `ru` draws its weeks Monday-first. Computing
    // "this week" from date-fns' Sunday default put the shortcut one day out of
    // step with the grid beside it.
    const sundayDefault = shortcutRanges.thisWeek(now);
    const russian = shortcutRanges.thisWeek(now, ru);
    expect(sundayDefault[0].getDay()).toBe(0);
    expect(russian[0].getDay()).toBe(1);
    expect(russian[0]).toEqual(new Date(2026, 4, 18)); // Monday
  });

  it('is what createDefaultShortcuts is built from', () => {
    const presets = createDefaultShortcuts(now);
    expect(presets.map((s) => s.range[0])).toEqual([
      shortcutRanges.today(now)[0],
      shortcutRanges.last7Days(now)[0],
      shortcutRanges.last30Days(now)[0],
      shortcutRanges.thisWeek(now)[0],
      shortcutRanges.thisMonth(now)[0],
    ]);
  });

  it('lets a host relabel and reorder without touching the maths', () => {
    const mine = [
      { label: 'Сегодня', range: shortcutRanges.today(now) },
      { label: 'Этот месяц', range: shortcutRanges.thisMonth(now) },
    ];
    expect(mine.map((s) => s.label)).toEqual(['Сегодня', 'Этот месяц']);
    expect(mine[1].range[0]).toEqual(new Date(2026, 4, 1));
  });
});
