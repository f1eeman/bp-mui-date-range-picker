import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RangeCalendar } from './RangeCalendar';

describe('RangeCalendar', () => {
  it('renders a single grid when contiguous', () => {
    const { container } = render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        numberOfMonths={2}
        linked
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    expect(container.querySelectorAll('.drp-calendar')).toHaveLength(1);
  });

  it('renders two grids when non-contiguous', () => {
    const { container } = render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        numberOfMonths={2}
        linked={false}
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    expect(container.querySelectorAll('.drp-calendar')).toHaveLength(2);
  });

  it('calls onChange with a tuple when a day is clicked', async () => {
    const onChange = vi.fn();
    render(
      <RangeCalendar
        value={[null, null]}
        onChange={onChange}
        numberOfMonths={2}
        linked
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    // A contiguous 2-month calendar renders "15" in both months; the first
    // occurrence in DOM order is the left (May) month.
    await userEvent.click(screen.getAllByText('15')[0]);
    expect(onChange).toHaveBeenCalled();
    const arg = onChange.mock.calls[0][0];
    expect(Array.isArray(arg)).toBe(true);
    expect(arg[0]).toEqual(new Date(2026, 4, 15));
    // rdp v9 represents a freshly-started range as { from: A, to: A }
    expect(arg[1]).toEqual(arg[0]);
  });

  /** Year-only option texts (4-digit), deduped and sorted ascending. */
  function visibleYearOptions(): number[] {
    const years = screen
      .getAllByRole('option')
      .map((o) => o.textContent ?? '')
      .filter((t) => /^\d{4}$/.test(t))
      .map(Number);
    return [...new Set(years)].sort((a, b) => a - b);
  }

  it('renders month and year dropdowns in the caption', () => {
    render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        numberOfMonths={2}
        linked
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(2);
  });

  it('bounds the year dropdown by minDate and maxDate', () => {
    render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        numberOfMonths={2}
        linked
        defaultMonth={new Date(2026, 4, 1)}
        minDate={new Date(2025, 0, 1)}
        maxDate={new Date(2027, 11, 31)}
      />,
    );
    expect(visibleYearOptions()).toEqual([2025, 2026, 2027]);
  });

  it('defaults the year dropdown to the current year +/- 10', () => {
    render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        numberOfMonths={2}
        linked
        defaultMonth={new Date()}
      />,
    );
    const currentYear = new Date().getFullYear();
    const years = visibleYearOptions();
    expect(years[0]).toBe(currentYear - 10);
    expect(years[years.length - 1]).toBe(currentYear + 10);
  });

  it('keeps a selected year applied (dropdown drives the displayed month)', async () => {
    render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        numberOfMonths={2}
        linked
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    const yearSelect = screen
      .getAllByRole('combobox')
      .find((el) =>
        Array.from((el as HTMLSelectElement).options).some((o) =>
          /^\d{4}$/.test(o.textContent ?? ''),
        ),
      ) as HTMLSelectElement;
    expect(yearSelect).toBeDefined();
    const opt2028 = Array.from(yearSelect.options).find(
      (o) => o.textContent === '2028',
    )!;
    await userEvent.selectOptions(yearSelect, opt2028);
    // The select is controlled by rdp via the `month` prop; the value sticks
    // only if onMonthChange round-tripped the change.
    expect(yearSelect.value).toBe(opt2028.value);
  });

  it('renders no standalone <nav> element (navLayout around)', () => {
    const { container } = render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        numberOfMonths={2}
        linked
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    expect(container.querySelector('nav')).toBeNull();
  });

  it('places the prev arrow before the first caption and the next arrow after the last', () => {
    const { container } = render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        numberOfMonths={2}
        linked
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    // nav buttons are the <button>s that are NOT day cells; day cells live
    // inside the month grid ([role="grid"]).
    const navButtons = Array.from(container.querySelectorAll('button')).filter(
      (b) => !b.closest('[role="grid"]'),
    );
    expect(navButtons).toHaveLength(2); // contiguous: exactly one prev + one next
    const [prevBtn, nextBtn] = navButtons;
    const selects = container.querySelectorAll('select');
    const firstSelect = selects[0];
    const lastSelect = selects[selects.length - 1];
    // the prev arrow comes before the first month's dropdowns
    expect(
      prevBtn.compareDocumentPosition(firstSelect) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // the next arrow comes after the last month's dropdowns
    expect(
      nextBtn.compareDocumentPosition(lastSelect) &
        Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
  });

  it('gives each calendar its own pair of arrows in non-contiguous mode', () => {
    const { container } = render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        numberOfMonths={2}
        linked={false}
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    const navButtons = Array.from(container.querySelectorAll('button')).filter(
      (b) => !b.closest('[role="grid"]'),
    );
    expect(navButtons).toHaveLength(4); // two calendars x (prev + next)
  });

  it('wraps the two non-contiguous calendars in a drp-panels element', () => {
    const { container } = render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        numberOfMonths={2}
        linked={false}
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    expect(container.querySelector('.drp-panels')).not.toBeNull();
  });

  it('suppresses the redundant rdp caption label (the styled selects are the only controls)', () => {
    const { container } = render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        numberOfMonths={2}
        linked
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    // rdp's dropdown caption hardcodes an aria-hidden <span> (label text +
    // chevron) next to each <select>. It must not carry rdp's visible
    // `rdp-caption_label` class — it gets `drp-caption-label` instead, which
    // styles.css hides via `display: none`.
    expect(container.querySelector('.rdp-caption_label')).toBeNull();
    const labels = container.querySelectorAll(
      '.drp-dropdown-root > span[aria-hidden="true"]',
    );
    expect(labels.length).toBeGreaterThan(0);
    labels.forEach((el) => {
      expect(el.className).toContain('drp-caption-label');
    });
    // the actual <select> dropdowns are still present
    expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(2);
  });
describe('following the selection', () => {
  // The view was read once at mount and never looked at `value` again, so a
  // shortcut or a typed date could set a range the user could not see:
  // navigate to December 2027, press a shortcut, and the grids stayed there.
  const monthsOnScreen = (container: HTMLElement) =>
    [...container.querySelectorAll('.drp-month')].map((m) => {
      const selects = m.querySelectorAll('select');
      return `${(selects[0] as HTMLSelectElement).value}/${(selects[1] as HTMLSelectElement).value}`;
    });

  const props = {
    onChange: vi.fn(),
    numberOfMonths: 2,
    defaultMonth: new Date(2027, 11, 1),
  };

  it('re-anchors a linked calendar onto a selection made off-screen', () => {
    const { container, rerender } = render(
      <RangeCalendar {...props} value={[null, null]} linked />,
    );
    expect(monthsOnScreen(container)).toEqual(['11/2027', '0/2028']);

    rerender(
      <RangeCalendar
        {...props}
        value={[new Date(2026, 7, 20), new Date(2026, 7, 27)]}
        linked
      />,
    );
    expect(monthsOnScreen(container)).toEqual(['7/2026', '8/2026']);
  });

  it('re-anchors every panel when navigation is unlinked', () => {
    const { container, rerender } = render(
      <RangeCalendar {...props} value={[null, null]} linked={false} />,
    );
    expect(monthsOnScreen(container)).toEqual(['11/2027', '0/2028']);

    rerender(
      <RangeCalendar
        {...props}
        value={[new Date(2026, 7, 20), new Date(2026, 7, 27)]}
        linked={false}
      />,
    );
    expect(monthsOnScreen(container)).toEqual(['7/2026', '8/2026']);
  });

  it('follows a selection off-screen even when its month has not changed', () => {
    // Keyed on the month, a shortcut landing in the month a day was already
    // picked from read as no change, so the off-screen check never ran: the
    // fields took the new range and the grids stayed a year out.
    const { container, rerender } = render(
      <RangeCalendar {...props} value={[new Date(2026, 7, 3), new Date(2026, 7, 5)]} linked />,
    );
    expect(monthsOnScreen(container)).toEqual(['11/2027', '0/2028']);

    rerender(
      <RangeCalendar
        {...props}
        value={[new Date(2026, 7, 1), new Date(2026, 7, 31)]}
        linked
      />,
    );
    expect(monthsOnScreen(container)).toEqual(['7/2026', '8/2026']);
  });

  it('leaves the view alone when only the clock on a boundary moves', () => {
    // Which is why the key is the anchor day and not its timestamp: a minute
    // bumped on the time picker would otherwise snap the grids back onto a
    // selection the user had deliberately paged away from.
    const { container, rerender } = render(
      <RangeCalendar {...props} value={[new Date(2026, 7, 3, 9, 0), null]} linked />,
    );
    const before = monthsOnScreen(container);

    rerender(
      <RangeCalendar {...props} value={[new Date(2026, 7, 3, 9, 30), null]} linked />,
    );
    expect(monthsOnScreen(container)).toEqual(before);
  });

  it('follows an end that lands off-screen, and puts it in the last grid', () => {
    // Anchored on the start alone this did nothing at all: a date typed into the
    // end field went to its time picker and the grids stayed on the start's
    // month, so the day just named was nowhere on screen.
    const may = { ...props, defaultMonth: new Date(2026, 4, 1) };
    const { container, rerender } = render(
      <RangeCalendar {...may} value={[new Date(2026, 4, 20), null]} linked />,
    );
    expect(monthsOnScreen(container)).toEqual(['4/2026', '5/2026']);

    rerender(
      <RangeCalendar
        {...may}
        value={[new Date(2026, 4, 20), new Date(2026, 11, 15)]}
        linked
      />,
    );
    // November and December — the run up to the end, not the months past it.
    expect(monthsOnScreen(container)).toEqual(['10/2026', '11/2026']);
  });

  it('moves only the end panel when unlinked, leaving the start on screen', () => {
    // Unlinked panels are the user's own windows. Moving them as a block took
    // the start's month off screen to reveal an end years away, which is the one
    // thing independent paging exists to avoid.
    const may = { ...props, defaultMonth: new Date(2026, 4, 1) };
    const { container, rerender } = render(
      <RangeCalendar {...may} value={[new Date(2026, 4, 20), null]} linked={false} />,
    );
    expect(monthsOnScreen(container)).toEqual(['4/2026', '5/2026']);

    rerender(
      <RangeCalendar
        {...may}
        value={[new Date(2026, 4, 20), new Date(2029, 11, 15)]}
        linked={false}
      />,
    );
    expect(monthsOnScreen(container)).toEqual(['4/2026', '11/2029']);
  });

  it('moves only the start panel when unlinked and only the start moves', () => {
    const may = { ...props, defaultMonth: new Date(2026, 4, 1) };
    const end = new Date(2026, 5, 10);
    const { container, rerender } = render(
      <RangeCalendar {...may} value={[new Date(2026, 4, 20), end]} linked={false} />,
    );
    expect(monthsOnScreen(container)).toEqual(['4/2026', '5/2026']);

    rerender(
      <RangeCalendar {...may} value={[new Date(2025, 0, 8), end]} linked={false} />,
    );
    expect(monthsOnScreen(container)).toEqual(['0/2025', '5/2026']);
  });

  it('re-derives every unlinked panel when both ends move at once', () => {
    // A whole new value — a shortcut, or a controlled range replaced from
    // outside — is not one boundary being edited, so the view re-derives rather
    // than half of it staying behind on a month nobody asked for.
    const { container, rerender } = render(
      <RangeCalendar {...props} value={[null, null]} linked={false} />,
    );
    expect(monthsOnScreen(container)).toEqual(['11/2027', '0/2028']);

    rerender(
      <RangeCalendar
        {...props}
        value={[new Date(2026, 7, 20), new Date(2026, 7, 27)]}
        linked={false}
      />,
    );
    expect(monthsOnScreen(container)).toEqual(['7/2026', '8/2026']);
  });

  it('keeps the two linked grids consecutive, whatever that costs the start', () => {
    // Linked means one window of consecutive months, so May 2026 and December
    // 2029 cannot both be on screen. Revealing the end moves the window off the
    // start; the alternative is not showing the day just typed at all.
    const may = { ...props, defaultMonth: new Date(2026, 4, 1) };
    const { container, rerender } = render(
      <RangeCalendar {...may} value={[new Date(2026, 4, 20), null]} linked />,
    );
    rerender(
      <RangeCalendar
        {...may}
        value={[new Date(2026, 4, 20), new Date(2029, 11, 15)]}
        linked
      />,
    );
    expect(monthsOnScreen(container)).toEqual(['10/2029', '11/2029']);
  });

  it('follows the start when both ends move at once', () => {
    const { container, rerender } = render(
      <RangeCalendar {...props} value={[null, null]} linked />,
    );
    rerender(
      <RangeCalendar
        {...props}
        value={[new Date(2026, 7, 20), new Date(2026, 11, 15)]}
        linked
      />,
    );
    // A range reads from its beginning, so the start takes the first grid.
    expect(monthsOnScreen(container)).toEqual(['7/2026', '8/2026']);
  });

  it('leaves the view alone when a new end is already on screen', () => {
    // Following the end must not mean chasing it: an end inside a visible month
    // has nothing to reveal.
    const may = { ...props, defaultMonth: new Date(2026, 4, 1) };
    const { container, rerender } = render(
      <RangeCalendar {...may} value={[new Date(2026, 4, 20), null]} linked />,
    );
    rerender(
      <RangeCalendar {...may} value={[new Date(2026, 4, 20), new Date(2026, 5, 3)]} linked />,
    );
    expect(monthsOnScreen(container)).toEqual(['4/2026', '5/2026']);
  });

  it('leaves the view alone when the selection is already on screen', () => {
    // Picking a day in a visible month must not yank the calendar around.
    const { container, rerender } = render(
      <RangeCalendar {...props} value={[null, null]} linked />,
    );
    const before = monthsOnScreen(container);

    rerender(
      <RangeCalendar {...props} value={[new Date(2028, 0, 9), null]} linked />,
    );
    expect(monthsOnScreen(container)).toEqual(before);
  });

  it('re-anchors on the end date when only the end is set', () => {
    const { container, rerender } = render(
      <RangeCalendar {...props} value={[null, null]} linked />,
    );
    rerender(
      <RangeCalendar {...props} value={[null, new Date(2025, 2, 4)]} linked />,
    );
    // February and March: an end closes the view wherever it arrives, alone or
    // not. The start it is still waiting for has to fall before it, so the
    // months to look in are the ones ahead of the end, not behind it.
    expect(monthsOnScreen(container)).toEqual(['1/2025', '2/2025']);
  });
});
});
