import { describe, it, expect } from 'vitest';
import { createDefaultShortcuts } from './shortcuts';

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
