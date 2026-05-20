import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimePicker } from './TimePicker';

describe('TimePicker', () => {
  it('renders hours and minutes for minute precision', () => {
    render(<TimePicker value={new Date(2026, 4, 20, 9, 30)} precision="minute" onChange={vi.fn()} />);
    expect(screen.getByLabelText('hours')).toHaveValue(9);
    expect(screen.getByLabelText('minutes')).toHaveValue(30);
    expect(screen.queryByLabelText('seconds')).not.toBeInTheDocument();
  });

  it('renders seconds for second precision', () => {
    render(<TimePicker value={new Date(2026, 4, 20, 9, 30, 15)} precision="second" onChange={vi.fn()} />);
    expect(screen.getByLabelText('seconds')).toHaveValue(15);
  });

  it('merges an edited hour into the date', async () => {
    const onChange = vi.fn();
    render(<TimePicker value={new Date(2026, 4, 20, 9, 30)} precision="minute" onChange={onChange} />);
    const hours = screen.getByLabelText('hours');
    await userEvent.clear(hours);
    await userEvent.type(hours, '14');
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 4, 20, 14, 30));
  });
});
