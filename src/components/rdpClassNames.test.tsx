import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { UI, SelectionState, DayFlag, Animation } from 'react-day-picker';
import { rdpClassNames } from './rdpClassNames';
import { RangeCalendar } from './RangeCalendar';

/**
 * The package ships no react-day-picker stylesheet (docs/adr/0003), so every
 * class key react-day-picker can emit has to be replaced by one this package
 * styles. A key left on its default keeps an `rdp-*` class with nothing behind
 * it — invisible in review, visible only as a broken calendar.
 *
 * Asserted against react-day-picker's own enums rather than a hand-copied
 * list, so a key added by a future release fails here instead of shipping.
 */
describe('rdpClassNames', () => {
  const declaredKeys = [
    ...Object.values(UI),
    ...Object.values(SelectionState),
    ...Object.values(DayFlag),
    ...Object.values(Animation),
  ] as string[];

  it('maps every key react-day-picker declares', () => {
    const mapped = Object.keys(rdpClassNames());
    expect(declaredKeys.filter((k) => !mapped.includes(k))).toEqual([]);
  });

  it('maps no key react-day-picker does not declare', () => {
    // A typo'd key is silently ignored by react-day-picker, which would leave
    // the real node on its rdp default.
    const mapped = Object.keys(rdpClassNames());
    expect(mapped.filter((k) => !declaredKeys.includes(k))).toEqual([]);
  });

  it('gives every key a drp-* class and no rdp-* class', () => {
    for (const [key, value] of Object.entries(rdpClassNames())) {
      expect(value, key).toMatch(/(^|\s)drp-/);
      expect(value, key).not.toMatch(/(^|\s)rdp-/);
    }
  });

  it('leaves no rdp-* class anywhere in the rendered calendar', () => {
    const { container } = render(
      <RangeCalendar
        value={[new Date(2026, 4, 10), new Date(2026, 4, 20)]}
        onChange={vi.fn()}
        numberOfMonths={2}
        linked
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    const offenders = [...container.querySelectorAll('*')]
      .filter((el) => typeof el.className === 'string')
      .flatMap((el) => (el.className as string).split(/\s+/))
      .filter((c) => c.startsWith('rdp-'));
    expect([...new Set(offenders)]).toEqual([]);
  });
});
