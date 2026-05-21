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
        contiguous
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    expect(container.querySelectorAll('.rdp-root')).toHaveLength(1);
  });

  it('renders two grids when non-contiguous', () => {
    const { container } = render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        contiguous={false}
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    expect(container.querySelectorAll('.rdp-root')).toHaveLength(2);
  });

  it('calls onChange with a tuple when a day is clicked', async () => {
    const onChange = vi.fn();
    render(
      <RangeCalendar
        value={[null, null]}
        onChange={onChange}
        contiguous
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
        contiguous
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
        contiguous
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
        contiguous
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
        contiguous
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

  it('suppresses the redundant rdp caption label (the styled selects are the only controls)', () => {
    const { container } = render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        contiguous
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    // rdp's dropdown caption hardcodes an aria-hidden <span> (label text +
    // chevron) next to each <select>. It must not carry rdp's visible
    // `rdp-caption_label` class — it gets the `hidden` utility instead.
    expect(container.querySelector('.rdp-caption_label')).toBeNull();
    const labels = container.querySelectorAll(
      '.rdp-dropdown_root > span[aria-hidden="true"]',
    );
    expect(labels.length).toBeGreaterThan(0);
    labels.forEach((el) => {
      expect(el.className).toContain('hidden');
    });
    // the actual <select> dropdowns are still present
    expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(2);
  });
});
