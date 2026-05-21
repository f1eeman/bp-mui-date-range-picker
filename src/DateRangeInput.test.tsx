import { describe, it, expect, vi } from 'vitest';
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
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} onChange={onChange} />);
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
});
