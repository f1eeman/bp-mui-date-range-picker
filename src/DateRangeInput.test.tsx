import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangeInput } from './DateRangeInput';

/** The month/year each grid on screen is showing, left to right. */
const monthsOnScreen = () =>
  [...document.querySelectorAll('.drp-month')].map((m) => {
    const selects = m.querySelectorAll('select');
    return `${(selects[0] as HTMLSelectElement).value}/${(selects[1] as HTMLSelectElement).value}`;
  });

describe('DateRangeInput', () => {
  it('opens a boundary day at the bound rather than outside it', () => {
    // A start with no clock yet opens its day at 00:00 and an end closes it at
    // 23:59. On the very day a bound falls that default is guaranteed to be
    // outside it, so picking today under `minDate = today 16:47` produced a
    // value the component itself would refuse. The default is pulled to the
    // bound instead.
    // The calendar opens on the current month, so the bound is placed there
    // too — a hardcoded month would only be visible for part of the year.
    const bound = new Date();
    bound.setHours(16, 47, 0, 0);
    const onChange = vi.fn();
    render(
      <DateRangeInput
        timePrecision="minute"
        minDate={bound}
        numberOfMonths={1}
        onChange={onChange}
        defaultOpen
      />,
    );
    const day = [...document.querySelectorAll('.drp-day')].find(
      (d) => d.textContent?.trim() === String(bound.getDate()),
    );
    fireEvent.click(day!);
    const [range] = onChange.mock.calls.at(-1)!;
    expect(range[0].getHours()).toBe(16);
    expect(range[0].getMinutes()).toBe(47);
  });

  it('refuses a clock earlier than minDate on the boundary day', () => {
    // Deadline "not before now" on a task form: minDate carries today's time,
    // and the start of the range must not fall before it. The whole day used
    // to be accepted, so 00:00 today passed a bound set at 16:47 today.
    const onChange = vi.fn();
    render(
      <DateRangeInput
        timePrecision="minute"
        minDate={new Date(2026, 7, 31, 16, 47)}
        value={[new Date(2026, 7, 31, 18, 0), null]}
        onChange={onChange}
        defaultOpen
      />,
    );
    const hours = document.querySelector('.drp-time-picker-input') as HTMLInputElement;
    fireEvent.change(hours, { target: { value: '9' } });
    fireEvent.blur(hours);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows a read-only value without letting it be changed', () => {
    // `disabled` is not a substitute: it greys the value out and drops the
    // field from the tab order, so a range the user is meant to read but not
    // edit had no representation at all.
    render(<DateRangeInput readOnly value={[new Date(2026, 7, 10), new Date(2026, 7, 20)]} />);
    const inputs = [...document.querySelectorAll('.drp-input')] as HTMLInputElement[];
    for (const input of inputs) {
      expect(input.readOnly).toBe(true);
      expect(input.disabled).toBe(false);
    }
    fireEvent.focus(inputs[0]);
    expect(document.querySelector('.drp-popover')).toBeNull();
  });

  it('lets the host declare the value invalid', () => {
    // The package marks a field invalid only when it cannot parse the text.
    // Every real form has rules the package knows nothing about — required,
    // no wider than 90 days, not overlapping another booking — and had no way
    // to say so: the error text showed under a field that stayed grey, and
    // aria-invalid kept telling a screen reader the opposite.
    render(<DateRangeInput invalid />);
    for (const input of document.querySelectorAll('.drp-input')) {
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input.className).toContain('drp-input-invalid');
    }
    expect(document.querySelector('.drp-input-group')!.className).toContain(
      'drp-input-group-invalid',
    );
  });

  it('keeps the popover open after a first click, even with allowSingleDayRange', () => {
    // The two props are documented apart and each behaves as written, but
    // together they trap: react-day-picker opens a range as { from: A, to: A },
    // allowSingleDayRange calls that complete, and closeOnSelection shuts the
    // popover before the second date can be picked. A two-day range became
    // unreachable by mouse. closeOnSelection now waits for two different days;
    // a single-day range is still a valid value, just not a reason to close.
    render(
      <DateRangeInput
        allowSingleDayRange
        closeOnSelection
        defaultOpen
        numberOfMonths={1}
      />,
    );
    const day = [...document.querySelectorAll('.drp-day')].find(
      (d) => d.textContent?.trim() === '10',
    );
    fireEvent.click(day!);
    expect(document.querySelector('.drp-popover')).not.toBeNull();
  });

  it('shows the time step arrows without being asked', () => {
    // A time field with no arrows looks like a plain text input and says
    // nothing about being a stepped value. Every host that mounted one asked
    // for them, which is the definition of a wrong default.
    render(<DateRangeInput timePrecision="minute" defaultOpen />);
    expect(document.querySelectorAll('.drp-time-picker-arrow-button').length).toBeGreaterThan(0);
  });

  it('renders two text inputs', () => {
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} />);
    expect(screen.getByPlaceholderText('from')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('to')).toBeInTheDocument();
  });

  it('captions each field with its own label, and floats the focused one', async () => {
    render(
      <DateRangeInput
        label={{ start: 'From', end: 'To' }}
        placeholder={{ start: 'yyyy-mm-dd', end: 'yyyy-mm-dd' }}
      />,
    );
    // Both fields carry the same placeholder here, so the label is the only
    // thing telling them apart — which is the point of the prop.
    const from = screen.getByLabelText('From');
    expect(screen.getByLabelText('To')).not.toBe(from);

    await userEvent.click(from);
    expect(screen.getByText('From')).toHaveClass('drp-input-label-floating');
    expect(screen.getByText('To')).not.toHaveClass('drp-input-label-floating');
  });

  it('opens the calendar popover on focus', async () => {
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} />);
    await userEvent.click(screen.getByPlaceholderText('from'));
    // react-day-picker v9 renders one grid per month; contiguous mode shows 2 months.
    const grids = await screen.findAllByRole('grid');
    expect(grids.length).toBeGreaterThanOrEqual(1);
  });

  it('commits a typed range via onChange', async () => {
    const onChange = vi.fn();
    render(
      <DateRangeInput placeholder={{ start: 'from', end: 'to' }} onChange={onChange} />,
    );
    await userEvent.type(screen.getByPlaceholderText('from'), '2026-05-10');
    await userEvent.type(screen.getByPlaceholderText('to'), '2026-05-20');
    await userEvent.tab();
    expect(onChange.mock.calls.at(-1)![0]).toEqual([
      new Date(2026, 4, 10),
      new Date(2026, 4, 20),
    ]);
    expect(onChange.mock.calls.at(-1)![1]).toBe('end');
  });

  it('reads and writes the fields in a date pattern the host names', async () => {
    const onChange = vi.fn();
    render(
      <DateRangeInput
        datePattern="dd/MM/yyyy"
        placeholder={{ start: 'from', end: 'to' }}
        onChange={onChange}
      />,
    );
    await userEvent.type(screen.getByPlaceholderText('from'), '10/05/2026');
    await userEvent.type(screen.getByPlaceholderText('to'), '20/05/2026');
    await userEvent.tab();
    expect(onChange.mock.calls.at(-1)![0]).toEqual([
      new Date(2026, 4, 10),
      new Date(2026, 4, 20),
    ]);
    // The committed value comes back through the same pattern, not the default.
    expect(screen.getByPlaceholderText('from')).toHaveValue('10/05/2026');
  });

  it('rejects a date typed outside minDate/maxDate and marks the field invalid', async () => {
    const onChange = vi.fn();
    render(
      <DateRangeInput
        minDate={new Date(2026, 4, 10)}
        maxDate={new Date(2026, 4, 25)}
        placeholder={{ start: 'from', end: 'to' }}
        onChange={onChange}
      />,
    );
    const fromInput = screen.getByPlaceholderText('from');
    // Type a date before minDate
    await userEvent.type(fromInput, '2026-05-01');
    await userEvent.tab();
    expect(onChange).not.toHaveBeenCalled();
    expect(fromInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('accepts an in-range date when minDate/maxDate are set', async () => {
    const onChange = vi.fn();
    render(
      <DateRangeInput
        minDate={new Date(2026, 4, 10)}
        maxDate={new Date(2026, 4, 25)}
        placeholder={{ start: 'from', end: 'to' }}
        onChange={onChange}
      />,
    );
    const fromInput = screen.getByPlaceholderText('from');
    const toInput = screen.getByPlaceholderText('to');
    await userEvent.type(fromInput, '2026-05-15');
    await userEvent.type(toInput, '2026-05-20');
    await userEvent.tab();
    expect(onChange.mock.calls.at(-1)![0]).toEqual([
      new Date(2026, 4, 15),
      new Date(2026, 4, 20),
    ]);
    expect(fromInput).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('moves the calendars onto a date typed into the end field', async () => {
    // The end used to reach its time picker and nothing else: the grids stayed
    // on the start's month, so pressing Enter showed the clock changing while
    // the day just typed stayed off screen.
    render(
      <DateRangeInput placeholder={{ start: 'from', end: 'to' }} timePrecision="minute" />,
    );
    await userEvent.type(screen.getByPlaceholderText('from'), '2026-05-20 09:00{Enter}');
    expect(monthsOnScreen()).toEqual(['4/2026', '5/2026']);

    await userEvent.type(screen.getByPlaceholderText('to'), '2026-12-15 18:00{Enter}');
    // The end takes the last grid, so the months running up to it stay visible.
    expect(monthsOnScreen()).toEqual(['10/2026', '11/2026']);
  });

  it('renders the shortcuts panel when shortcuts are enabled', async () => {
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} shortcuts />);
    await userEvent.click(screen.getByPlaceholderText('from'));
    expect(await screen.findByRole('button', { name: 'Last 7 days' })).toBeInTheDocument();
  });

  it('moves the calendars onto a shortcut that lands in the month already picked from', async () => {
    // Reported: pick days no shortcut covers, page the grids away, then press a
    // shortcut — the fields took the new range and the calendars did not follow.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 7, 31, 12, 0));
    try {
      render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} shortcuts />);
      await userEvent.click(screen.getByPlaceholderText('from'));
      await userEvent.click(screen.getAllByText('3')[0]);
      await userEvent.click(screen.getAllByText('5')[0]);
      // Page a year on, so the picked days and the shortcut share a month name
      // but not a month.
      await userEvent.selectOptions(screen.getAllByRole('combobox')[1], '2027');
      expect(monthsOnScreen()).toEqual(['7/2027', '8/2027']);

      await userEvent.click(screen.getByRole('button', { name: 'This month' }));
      expect(screen.getByPlaceholderText('from')).toHaveValue('2026-08-01');
      expect(monthsOnScreen()).toEqual(['7/2026', '8/2026']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the popover open after the first day click', async () => {
    const onChange = vi.fn();
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} onChange={onChange} />);
    await userEvent.click(screen.getByPlaceholderText('from'));
    expect(screen.queryAllByRole('grid').length).toBeGreaterThan(0); // open
    // first day click only STARTS the range — popover must stay open
    await userEvent.click(screen.getAllByText('10')[0]);
    expect(screen.queryAllByRole('grid').length).toBeGreaterThan(0); // still open
    // and the in-progress single-day range is committed, not discarded
    const lastCall = onChange.mock.calls.at(-1)![0];
    expect(lastCall[0]).not.toBeNull();
    expect(lastCall[1]).not.toBeNull();
  });

  it('closes the popover when a two-day range is completed', async () => {
    const onChange = vi.fn();
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        onChange={onChange}
        closeOnSelection
      />,
    );
    await userEvent.click(screen.getByPlaceholderText('from'));
    await userEvent.click(screen.getAllByText('10')[0]);
    await userEvent.click(screen.getAllByText('20')[0]);
    expect(screen.queryAllByRole('grid').length).toBe(0); // closed
    const last = onChange.mock.calls.at(-1)![0];
    expect(last[0]).not.toBeNull();
    expect(last[1]).not.toBeNull();
    expect(last[0].getDate()).toBe(10);
    expect(last[1].getDate()).toBe(20);
  });

  it('keeps the popover open after a complete range by default', async () => {
    const onChange = vi.fn();
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} onChange={onChange} />);
    await userEvent.click(screen.getByPlaceholderText('from'));
    await userEvent.click(screen.getAllByText('10')[0]);
    await userEvent.click(screen.getAllByText('20')[0]);
    // closeOnSelection defaults to false — the popover stays open
    expect(screen.queryAllByRole('grid').length).toBeGreaterThan(0);
  });

  it('shows month and year dropdowns once the calendar is open', async () => {
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} />);
    await userEvent.click(screen.getByPlaceholderText('from'));
    expect((await screen.findAllByRole('combobox')).length).toBeGreaterThanOrEqual(2);
  });

  it('wraps the time pickers in a drp-time-pickers element', async () => {
    render(
      <DateRangeInput placeholder={{ start: 'from', end: 'to' }} timePrecision="minute" />,
    );
    await userEvent.click(screen.getByPlaceholderText('from'));
    expect(document.querySelector('.drp-time-pickers')).not.toBeNull();
  });

  it('applies the drp-* base classes to its parts', () => {
    const { container } = render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} />);
    expect(container.querySelector('.drp-root')).not.toBeNull();
    expect(container.querySelector('.drp-input')).not.toBeNull();
  });

  it('appends a consumer slot class onto the base class', () => {
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        classNames={{ input: 'my-custom-input' }}
      />,
    );
    const input = screen.getByPlaceholderText('from');
    expect(input.className).toContain('drp-input');
    expect(input.className).toContain('my-custom-input');
  });
  describe('root passthrough', () => {
    // Without these a host had to wrap the component in an element of its own
    // just to position it — which is exactly what the first host to use the
    // package ended up doing — and
    // per-instance theming had nowhere to put its --drp-* declarations.
    it('merges className onto the root instead of replacing it', () => {
      const { container } = render(<DateRangeInput className="mt-4 w-full" />);
      const root = container.firstElementChild as HTMLElement;
      expect(root.className).toContain('drp-root');
      expect(root.className).toContain('mt-4');
      expect(root.className).toContain('w-full');
    });

    it('puts style on the root, so per-instance tokens have somewhere to go', () => {
      const { container } = render(
        <DateRangeInput style={{ '--drp-accent': 'rgb(1, 2, 3)' } as React.CSSProperties} />,
      );
      const root = container.firstElementChild as HTMLElement;
      expect(root.style.getPropertyValue('--drp-accent')).toBe('rgb(1, 2, 3)');
    });

    it('forwards id, data-* and aria-* to the root', () => {
      const { container } = render(
        <DateRangeInput id="range" data-testid="picker" aria-label="Reporting period" />,
      );
      const root = container.firstElementChild as HTMLElement;
      expect(root.id).toBe('range');
      expect(root.dataset.testid).toBe('picker');
      expect(root.getAttribute('aria-label')).toBe('Reporting period');
    });

    it('forwards a ref to the root element', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(<DateRangeInput ref={ref} />);
      expect(ref.current).toBe(container.firstElementChild);
      expect(ref.current?.className).toContain('drp-root');
    });
  });

  describe('separator', () => {
    it('renders an em dash by default', () => {
      const { container } = render(<DateRangeInput />);
      expect(container.querySelector('.drp-separator')?.textContent).toBe('—');
    });

    it('renders whatever node the host passes', () => {
      // An arrow — what the default used to be — so the assertion cannot pass
      // on the default alone.
      const { container } = render(<DateRangeInput separator="→" />);
      expect(container.querySelector('.drp-separator')?.textContent).toBe('→');
    });

    it('drops the separator entirely for null', () => {
      // A host blanked the glyph with `text-[0]` and drew its own with
      // an ::after pseudo-element, because there was no way to say "none".
      const { container } = render(<DateRangeInput separator={null} />);
      expect(container.querySelector('.drp-separator')).toBeNull();
    });
  });

  describe('open state', () => {
    it('reports opening and closing through onOpenChange', async () => {
      const onOpenChange = vi.fn();
      render(
        <DateRangeInput
          placeholder={{ start: 'from', end: 'to' }}
          onOpenChange={onOpenChange}
        />,
      );
      await userEvent.click(screen.getByPlaceholderText('from'));
      expect(onOpenChange).toHaveBeenCalledWith(true);

      await userEvent.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('starts open when defaultOpen is set', async () => {
      render(<DateRangeInput defaultOpen placeholder={{ start: 'from', end: 'to' }} />);
      expect(await screen.findAllByRole('grid')).not.toHaveLength(0);
    });

    it('obeys a controlled open prop and does not close itself', async () => {
      const onOpenChange = vi.fn();
      render(
        <DateRangeInput
          open
          onOpenChange={onOpenChange}
          placeholder={{ start: 'from', end: 'to' }}
        />,
      );
      expect(await screen.findAllByRole('grid')).not.toHaveLength(0);

      await userEvent.keyboard('{Escape}');
      // The host owns the state: it is told, and the popover stays until told back.
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(await screen.findAllByRole('grid')).not.toHaveLength(0);
    });
  });

  describe('numberOfMonths', () => {
    it('shows two months by default', async () => {
      render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} defaultOpen />);
      expect(await screen.findAllByRole('grid')).toHaveLength(2);
    });

    it('shows a single month, which the old boolean prop could not express', async () => {
      render(
        <DateRangeInput
          placeholder={{ start: 'from', end: 'to' }}
          numberOfMonths={1}
          defaultOpen
        />,
      );
      expect(await screen.findAllByRole('grid')).toHaveLength(1);
    });

    it('shows three independent grids when navigation is unlinked', async () => {
      render(
        <DateRangeInput
          placeholder={{ start: 'from', end: 'to' }}
          numberOfMonths={3}
          linkedNavigation={false}
          defaultOpen
        />,
      );
      expect(await screen.findAllByRole('grid')).toHaveLength(3);
    });
  });
});

describe('DateRangeInput range order', () => {
  it('refuses a date typed into the end field that falls before the start', async () => {
    // It used to be accepted and the two ends quietly changed places, so the
    // date the user typed appeared in the other field.
    const onChange = vi.fn();
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        defaultValue={[new Date(2026, 4, 10), null]}
        onChange={onChange}
      />,
    );
    const to = screen.getByPlaceholderText('to');
    await userEvent.type(to, '2026-05-05');
    await userEvent.tab();
    expect(to).toHaveAttribute('aria-invalid', 'true');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('refuses a date typed into the start field that falls after the end', async () => {
    const onChange = vi.fn();
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        defaultValue={[null, new Date(2026, 4, 10)]}
        onChange={onChange}
      />,
    );
    const from = screen.getByPlaceholderText('from');
    await userEvent.type(from, '2026-05-20');
    await userEvent.tab();
    expect(from).toHaveAttribute('aria-invalid', 'true');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('accepts an end on the same instant as the start', async () => {
    // Refusing is about reversing the range, not about collapsing it.
    const onChange = vi.fn();
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        defaultValue={[new Date(2026, 4, 10), null]}
        onChange={onChange}
      />,
    );
    const to = screen.getByPlaceholderText('to');
    await userEvent.type(to, '2026-05-10');
    await userEvent.tab();
    expect(to).toHaveAttribute('aria-invalid', 'false');
    expect(onChange.mock.calls.at(-1)![0]).toEqual([new Date(2026, 4, 10), new Date(2026, 4, 10)]);
  });

  it('refuses a clock dialled past the other end, and snaps the field back', async () => {
    const onChange = vi.fn();
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        timePrecision="minute"
        defaultValue={[new Date(2026, 4, 20, 9, 0), new Date(2026, 4, 20, 18, 0)]}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByPlaceholderText('from'));
    const hours = await screen.findByLabelText('start hours');
    await userEvent.clear(hours);
    await userEvent.type(hours, '20');
    await userEvent.tab();
    // Asserted on the value rather than on the spy staying silent: leaving the
    // text field commits the range it already held, which is a real call with
    // nothing new in it.
    for (const [range] of onChange.mock.calls) {
      expect(range[0]!.getHours()).toBe(9);
    }
    // Nothing accepted 20, so the field cannot go on showing it.
    expect(hours).toHaveValue(9);
  });

  it('orders the clocks a single calendar click carries onto one day', async () => {
    // The clocks here are inherited, not chosen: one click puts both ends on the
    // same day, and a start that carried 18:00 beside an end that carried 09:00
    // would reverse the range. Refusing a click is worse than ordering what it
    // inherited.
    const onChange = vi.fn();
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        timePrecision="minute"
        defaultValue={[new Date(2026, 4, 20, 18, 0), new Date(2026, 4, 25, 9, 0)]}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByPlaceholderText('from'));
    // Clicking the day a boundary already sits on is what collapses the range
    // onto one day, which is when the carried clocks can reverse it.
    await userEvent.click(screen.getAllByText('20')[0]);
    const [start, end] = onChange.mock.calls.at(-1)![0];
    expect(start!.getTime()).toBeLessThanOrEqual(end!.getTime());
    expect([start!.getDate(), end!.getDate()]).toEqual([20, 20]);
    expect([start!.getHours(), end!.getHours()]).toEqual([9, 18]);
  });
});

describe('DateRangeInput with a time precision', () => {
  it('shows the clock in the field', async () => {
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        timePrecision="minute"
        defaultValue={[new Date(2026, 4, 10, 9, 5), new Date(2026, 4, 20, 18, 30)]}
      />,
    );
    expect(screen.getByPlaceholderText('from')).toHaveValue('2026-05-10 09:05');
    expect(screen.getByPlaceholderText('to')).toHaveValue('2026-05-20 18:30');
  });

  it('gives each time picker fields named after its boundary', async () => {
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        timePrecision="second"
        defaultValue={[new Date(2026, 4, 10, 9, 5, 1), new Date(2026, 4, 20, 18, 30, 2)]}
      />,
    );
    await userEvent.click(screen.getByPlaceholderText('from'));
    expect(await screen.findByLabelText('start hours')).toHaveValue(9);
    expect(screen.getByLabelText('end seconds')).toHaveValue(2);
  });

  it('keeps the clock when a new day is picked in the calendar', async () => {
    // The whole point of the feature: the grid hands over a date at midnight,
    // and dropping that straight into the range wiped the time the user set.
    const onChange = vi.fn();
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        timePrecision="minute"
        onChange={onChange}
        defaultValue={[new Date(2026, 4, 10, 9, 15), new Date(2026, 4, 20, 18, 30)]}
      />,
    );
    await userEvent.click(screen.getByPlaceholderText('from'));
    await userEvent.click(screen.getAllByText('12')[0]);
    const [start, end] = onChange.mock.calls.at(-1)![0];
    // Which end rdp moves when a day inside the range is clicked is its
    // business; that both ends keep their clock is ours.
    expect([start!.getDate(), end!.getDate()]).toContain(12);
    expect([start!.getHours(), start!.getMinutes()]).toEqual([9, 15]);
    expect([end!.getHours(), end!.getMinutes()]).toEqual([18, 30]);
  });

  it('opens the day for a fresh start and closes it for a fresh end', async () => {
    const onChange = vi.fn();
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        timePrecision="second"
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByPlaceholderText('from'));
    await userEvent.click(screen.getAllByText('10')[0]);
    await userEvent.click(screen.getAllByText('20')[0]);
    const [start, end] = onChange.mock.calls.at(-1)![0];
    expect([start!.getHours(), start!.getMinutes(), start!.getSeconds()]).toEqual([0, 0, 0]);
    expect([end!.getHours(), end!.getMinutes(), end!.getSeconds()]).toEqual([23, 59, 59]);
  });

  it('keeps the clock when only the day is retyped', async () => {
    const onChange = vi.fn();
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        timePrecision="minute"
        onChange={onChange}
        defaultValue={[new Date(2026, 4, 10, 9, 15), new Date(2026, 4, 20, 18, 30)]}
      />,
    );
    const from = screen.getByPlaceholderText('from');
    await userEvent.clear(from);
    await userEvent.type(from, '2026-05-15');
    await userEvent.tab();
    expect(onChange.mock.calls.at(-1)![0]).toEqual([
      new Date(2026, 4, 15, 9, 15),
      new Date(2026, 4, 20, 18, 30),
    ]);
  });

  it('commits a clock edited on the time picker', async () => {
    const onChange = vi.fn();
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        timePrecision="minute"
        onChange={onChange}
        defaultValue={[new Date(2026, 4, 10, 9, 15), new Date(2026, 4, 20, 18, 30)]}
      />,
    );
    await userEvent.click(screen.getByPlaceholderText('from'));
    const hours = await screen.findByLabelText('start hours');
    await userEvent.clear(hours);
    await userEvent.type(hours, '7');
    await userEvent.tab();
    expect(onChange.mock.calls.at(-1)![0]).toEqual([
      new Date(2026, 4, 10, 7, 15),
      new Date(2026, 4, 20, 18, 30),
    ]);
  });

  it('lets a shortcut keep the whole-day clock it computed', async () => {
    // A shortcut is concrete on both ends by definition — "today" means the
    // whole of today, so it sets its own times rather than inheriting them.
    const onChange = vi.fn();
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        timePrecision="second"
        shortcuts
        onChange={onChange}
        defaultValue={[new Date(2026, 4, 10, 9, 15), new Date(2026, 4, 20, 18, 30)]}
      />,
    );
    await userEvent.click(screen.getByPlaceholderText('from'));
    await userEvent.click(await screen.findByText('Today'));
    const [start, end] = onChange.mock.calls.at(-1)![0];
    expect([start!.getHours(), start!.getMinutes(), start!.getSeconds()]).toEqual([0, 0, 0]);
    expect([end!.getHours(), end!.getMinutes(), end!.getSeconds()]).toEqual([23, 59, 59]);
  });

  describe('with an empty range', () => {
    it('leaves the time pickers editable', async () => {
      // They used to sit disabled until a day was picked, which made the
      // ordinary "9am to 6pm, whenever" edit impossible to start.
      render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} timePrecision="minute" />);
      await userEvent.click(screen.getByPlaceholderText('from'));
      expect(await screen.findByLabelText('start hours')).toBeEnabled();
      expect(screen.getByLabelText('end hours')).toBeEnabled();
    });

    it('picks today for a clock dialled before any day is', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.setSystemTime(new Date(2026, 7, 30, 12, 0));
      try {
        const onChange = vi.fn();
        render(
          <DateRangeInput
            placeholder={{ start: 'from', end: 'to' }}
            timePrecision="minute"
            onChange={onChange}
          />,
        );
        await userEvent.click(screen.getByPlaceholderText('from'));
        const hours = await screen.findByLabelText('start hours');
        await userEvent.clear(hours);
        await userEvent.type(hours, '9');
        await userEvent.tab();
        expect(onChange.mock.calls.at(-1)![0]).toEqual([new Date(2026, 7, 30, 9, 0), null]);
      } finally {
        vi.useRealTimers();
      }
    });

    it('puts an end the day after the start already picked', async () => {
      // The day is guessed against the other boundary so the range it makes is
      // already ordered, rather than one swapIfNeeded has to rescue.
      const onChange = vi.fn();
      render(
        <DateRangeInput
          placeholder={{ start: 'from', end: 'to' }}
          timePrecision="minute"
          onChange={onChange}
          defaultValue={[new Date(2026, 4, 10, 9, 15), null]}
        />,
      );
      await userEvent.click(screen.getByPlaceholderText('from'));
      const hours = await screen.findByLabelText('end hours');
      await userEvent.clear(hours);
      await userEvent.type(hours, '18');
      await userEvent.tab();
      expect(onChange.mock.calls.at(-1)![0]).toEqual([
        new Date(2026, 4, 10, 9, 15),
        new Date(2026, 4, 11, 18, 59, 59, 999),
      ]);
    });

    it('lands both ends on the same day when a one-day range is allowed', async () => {
      const onChange = vi.fn();
      render(
        <DateRangeInput
          placeholder={{ start: 'from', end: 'to' }}
          timePrecision="minute"
          allowSingleDayRange
          onChange={onChange}
          defaultValue={[new Date(2026, 4, 10, 9, 15), null]}
        />,
      );
      await userEvent.click(screen.getByPlaceholderText('from'));
      const hours = await screen.findByLabelText('end hours');
      await userEvent.clear(hours);
      await userEvent.type(hours, '18');
      await userEvent.tab();
      const [, end] = onChange.mock.calls.at(-1)![0];
      expect([end!.getMonth(), end!.getDate(), end!.getHours()]).toEqual([4, 10, 18]);
    });
  });
});
