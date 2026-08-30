import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimePicker } from './TimePicker';

describe('TimePicker', () => {
  it('renders hours and minutes for minute precision', () => {
    render(
      <TimePicker
        boundary="start"
        value={new Date(2026, 4, 20, 9, 30)}
        precision="minute"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('start hours')).toHaveValue(9);
    expect(screen.getByLabelText('start minutes')).toHaveValue(30);
    expect(screen.queryByLabelText('start seconds')).not.toBeInTheDocument();
  });

  it('renders seconds for second precision', () => {
    render(
      <TimePicker
        boundary="end"
        value={new Date(2026, 4, 20, 9, 30, 15)}
        precision="second"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('end seconds')).toHaveValue(15);
  });

  it('names its fields after the boundary it edits', () => {
    // Both boundaries render a picker side by side. Labelling them all "hours"
    // left a screen reader — and getByLabelText — unable to tell them apart.
    const { rerender } = render(
      <TimePicker
        boundary="start"
        value={new Date(2026, 4, 20, 9, 30)}
        precision="minute"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('start hours')).toBeInTheDocument();
    rerender(
      <TimePicker
        boundary="end"
        value={new Date(2026, 4, 20, 9, 30)}
        precision="minute"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('end hours')).toBeInTheDocument();
  });

  it('merges an edited hour into the date when the field is left', async () => {
    const onChange = vi.fn();
    render(
      <TimePicker
        boundary="start"
        value={new Date(2026, 4, 20, 9, 30)}
        precision="minute"
        onChange={onChange}
      />,
    );
    const hours = screen.getByLabelText('start hours');
    await userEvent.clear(hours);
    await userEvent.type(hours, '14');
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 4, 20, 14, 30));
  });

  it('commits on Enter without waiting for the field to be left', async () => {
    const onChange = vi.fn();
    render(
      <TimePicker
        boundary="start"
        value={new Date(2026, 4, 20, 9, 30)}
        precision="minute"
        onChange={onChange}
      />,
    );
    const hours = screen.getByLabelText('start hours');
    await userEvent.clear(hours);
    await userEvent.type(hours, '14{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 4, 20, 14, 30));
  });

  it('publishes nothing part-typed on the way to the final value', async () => {
    // A per-keystroke commit turned "14" into the hour 1 and then 14. With an
    // empty boundary that stray 1 is enough to pick a day, so nothing leaves
    // the field until the edit is finished.
    const onChange = vi.fn();
    render(
      <TimePicker
        boundary="start"
        value={new Date(2026, 4, 20, 9, 30)}
        precision="minute"
        onChange={onChange}
      />,
    );
    const hours = screen.getByLabelText('start hours');
    await userEvent.clear(hours);
    await userEvent.type(hours, '14');
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('shows a single typed digit as typed rather than padding it', async () => {
    render(
      <TimePicker
        boundary="start"
        value={new Date(2026, 4, 20, 9, 30)}
        precision="minute"
        onChange={vi.fn()}
      />,
    );
    const hours = screen.getByLabelText('start hours');
    await userEvent.clear(hours);
    await userEvent.type(hours, '1');
    expect(hours).toHaveValue(1);
  });

  it('clamps an hour above 23 down to 23', async () => {
    const onChange = vi.fn();
    render(
      <TimePicker
        boundary="start"
        value={new Date(2026, 4, 20, 9, 30)}
        precision="minute"
        onChange={onChange}
      />,
    );
    const hours = screen.getByLabelText('start hours');
    await userEvent.clear(hours);
    await userEvent.type(hours, '99');
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 4, 20, 23, 30));
  });

  it('clamps a minute above 59 down to 59', async () => {
    const onChange = vi.fn();
    render(
      <TimePicker
        boundary="start"
        value={new Date(2026, 4, 20, 9, 30)}
        precision="minute"
        onChange={onChange}
      />,
    );
    const minutes = screen.getByLabelText('start minutes');
    await userEvent.clear(minutes);
    await userEvent.type(minutes, '75');
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 4, 20, 9, 59));
  });

  it('restores the committed value when a field is left empty', async () => {
    const onChange = vi.fn();
    render(
      <TimePicker
        boundary="start"
        value={new Date(2026, 4, 20, 9, 30)}
        precision="minute"
        onChange={onChange}
      />,
    );
    const hours = screen.getByLabelText('start hours');
    await userEvent.clear(hours);
    await userEvent.tab();
    expect(hours).toHaveValue(9);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps milliseconds the boundary already carried', async () => {
    // An end picked from the grid closes its day at 23:59:59.999. Dialling the
    // hour should move the hour, not quietly round the moment down to the
    // second.
    const onChange = vi.fn();
    render(
      <TimePicker
        boundary="end"
        value={new Date(2026, 4, 20, 23, 59, 59, 999)}
        precision="minute"
        onChange={onChange}
      />,
    );
    const hours = screen.getByLabelText('end hours');
    await userEvent.clear(hours);
    await userEvent.type(hours, '18');
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 4, 20, 18, 59, 59, 999));
  });

  describe('with no date on the boundary', () => {
    it('stays typeable and shows the clock the boundary would open with', () => {
      // These fields used to sit disabled until a day was picked, which made
      // the common "9am to 6pm" edit impossible to start from the keyboard.
      render(
        <TimePicker boundary="start" value={null} precision="minute" onChange={vi.fn()} />,
      );
      const hours = screen.getByLabelText('start hours');
      expect(hours).toBeEnabled();
      expect(hours).toHaveValue(0);
      expect(screen.getByLabelText('start minutes')).toHaveValue(0);
    });

    it('shows the end of the day for an end boundary', () => {
      render(
        <TimePicker boundary="end" value={null} precision="minute" onChange={vi.fn()} />,
      );
      expect(screen.getByLabelText('end hours')).toHaveValue(23);
      expect(screen.getByLabelText('end minutes')).toHaveValue(59);
    });

    it('reports an edit so the caller can pick the day for it', async () => {
      const onChange = vi.fn();
      render(
        <TimePicker boundary="start" value={null} precision="minute" onChange={onChange} />,
      );
      const hours = screen.getByLabelText('start hours');
      await userEvent.clear(hours);
      await userEvent.type(hours, '9');
      await userEvent.tab();
      expect(onChange).toHaveBeenCalledTimes(1);
      const reported = onChange.mock.calls[0][0] as Date;
      expect([reported.getHours(), reported.getMinutes()]).toEqual([9, 0]);
    });
  });

  describe('arrow keys', () => {
    it('steps the hour up', async () => {
      const onChange = vi.fn();
      render(
        <TimePicker
          boundary="start"
          value={new Date(2026, 4, 20, 9, 30)}
          precision="minute"
          onChange={onChange}
        />,
      );
      await userEvent.click(screen.getByLabelText('start hours'));
      await userEvent.keyboard('{ArrowUp}');
      expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 4, 20, 10, 30));
    });

    it('wraps past midnight rather than sticking at 23', async () => {
      // The browser's own stepper stops dead at `max`. A clock does not.
      const onChange = vi.fn();
      render(
        <TimePicker
          boundary="start"
          value={new Date(2026, 4, 20, 23, 30)}
          precision="minute"
          onChange={onChange}
        />,
      );
      await userEvent.click(screen.getByLabelText('start hours'));
      await userEvent.keyboard('{ArrowUp}');
      expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 4, 20, 0, 30));
    });

    it('wraps below zero round to the top of the unit', async () => {
      const onChange = vi.fn();
      render(
        <TimePicker
          boundary="start"
          value={new Date(2026, 4, 20, 9, 0)}
          precision="minute"
          onChange={onChange}
        />,
      );
      await userEvent.click(screen.getByLabelText('start minutes'));
      await userEvent.keyboard('{ArrowDown}');
      expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 4, 20, 9, 59));
    });
  });

  describe('arrow buttons', () => {
    it('renders none by default', () => {
      render(
        <TimePicker
          boundary="start"
          value={new Date(2026, 4, 20, 9, 30)}
          precision="minute"
          onChange={vi.fn()}
        />,
      );
      expect(screen.queryByLabelText('Increase start hours')).not.toBeInTheDocument();
    });

    it('renders one above and one below each field when asked', () => {
      render(
        <TimePicker
          boundary="start"
          value={new Date(2026, 4, 20, 9, 30)}
          precision="second"
          onChange={vi.fn()}
          showArrowButtons
        />,
      );
      for (const unit of ['hours', 'minutes', 'seconds']) {
        expect(screen.getByLabelText(`Increase start ${unit}`)).toBeInTheDocument();
        expect(screen.getByLabelText(`Decrease start ${unit}`)).toBeInTheDocument();
      }
    });

    it('steps the field it points at', async () => {
      const onChange = vi.fn();
      render(
        <TimePicker
          boundary="start"
          value={new Date(2026, 4, 20, 9, 30)}
          precision="minute"
          onChange={onChange}
          showArrowButtons
        />,
      );
      await userEvent.click(screen.getByLabelText('Decrease start minutes'));
      expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 4, 20, 9, 29));
    });

    it('points at its field, so a screen reader can follow the pair', () => {
      render(
        <TimePicker
          boundary="start"
          value={new Date(2026, 4, 20, 9, 30)}
          precision="minute"
          onChange={vi.fn()}
          showArrowButtons
        />,
      );
      const controls = screen
        .getByLabelText('Increase start hours')
        .getAttribute('aria-controls');
      expect(screen.getByLabelText('start hours')).toHaveAttribute('id', controls);
    });

    it('gives two pickers on one page distinct field ids', () => {
      render(
        <>
          <TimePicker
            boundary="start"
            value={new Date(2026, 4, 20, 9, 30)}
            precision="minute"
            onChange={vi.fn()}
            showArrowButtons
          />
          <TimePicker
            boundary="end"
            value={new Date(2026, 4, 20, 18, 0)}
            precision="minute"
            onChange={vi.fn()}
            showArrowButtons
          />
        </>,
      );
      expect(screen.getByLabelText('start hours').id)
        .not.toBe(screen.getByLabelText('end hours').id);
    });
  });

  it('disables every field and arrow when the whole input is disabled', () => {
    render(
      <TimePicker
        boundary="start"
        value={new Date(2026, 4, 20, 9, 30)}
        precision="second"
        onChange={vi.fn()}
        disabled
        showArrowButtons
      />,
    );
    expect(screen.getByLabelText('start hours')).toBeDisabled();
    expect(screen.getByLabelText('start minutes')).toBeDisabled();
    expect(screen.getByLabelText('start seconds')).toBeDisabled();
    expect(screen.getByLabelText('Increase start hours')).toBeDisabled();
  });
});
