import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangeInput } from './DateRangeInput';

describe('DateRangeInput', () => {
  it('renders two text inputs', () => {
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} />);
    expect(screen.getByPlaceholderText('from')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('to')).toBeInTheDocument();
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
    expect(onChange).toHaveBeenLastCalledWith([
      new Date(2026, 4, 10),
      new Date(2026, 4, 20),
    ]);
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
    expect(onChange).toHaveBeenLastCalledWith([
      new Date(2026, 4, 15),
      new Date(2026, 4, 20),
    ]);
    expect(fromInput).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('renders the shortcuts panel when shortcuts are enabled', async () => {
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} shortcuts />);
    await userEvent.click(screen.getByPlaceholderText('from'));
    expect(await screen.findByRole('button', { name: 'Last 7 days' })).toBeInTheDocument();
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
    it('renders an arrow by default', () => {
      const { container } = render(<DateRangeInput />);
      expect(container.querySelector('.drp-separator')?.textContent).toBe('→');
    });

    it('renders whatever node the host passes', () => {
      const { container } = render(<DateRangeInput separator="—" />);
      expect(container.querySelector('.drp-separator')?.textContent).toBe('—');
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
    expect(onChange).toHaveBeenLastCalledWith([
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
    expect(onChange).toHaveBeenLastCalledWith([
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
        expect(onChange).toHaveBeenLastCalledWith([new Date(2026, 7, 30, 9, 0), null]);
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
      expect(onChange).toHaveBeenLastCalledWith([
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
