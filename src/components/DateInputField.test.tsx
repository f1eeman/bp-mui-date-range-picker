import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateInputField } from './DateInputField';
import { useDateParsing } from '../hooks/useDateParsing';

function Harness({ onCommit }: { onCommit: (d: Date | null) => void }) {
  const parsing = useDateParsing({});
  return (
    <DateInputField
      value={null}
      parsing={parsing}
      onCommit={onCommit}
      onFocus={() => {}}
      placeholder="start"
    />
  );
}

function HarnessWithValidate({
  onCommit,
  validate,
}: {
  onCommit: (d: Date | null) => void;
  validate: (d: Date) => boolean;
}) {
  const parsing = useDateParsing({});
  return (
    <DateInputField
      value={null}
      parsing={parsing}
      onCommit={onCommit}
      onFocus={() => {}}
      placeholder="start"
      validate={validate}
    />
  );
}

describe('DateInputField', () => {
  it('keeps the browser autofill list off the field', () => {
    // A plain text input, so the browser remembers what was typed and offers
    // the list back — over the calendar the same field just opened. A date
    // field should never suggest history, and the host cannot reach the
    // <input> to say so: props extend the root <div>, not the fields.
    render(<Harness onCommit={vi.fn()} />);
    const input = screen.getByPlaceholderText('start');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('spellcheck', 'false');
  });

  it('commits a parsed date on blur', async () => {
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '20-05-2026');
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledWith(new Date(2026, 4, 20));
  });

  it('refuses characters the pattern could never print', async () => {
    render(<Harness onCommit={vi.fn()} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, 'garbage');
    expect(input).toHaveValue('');
    await userEvent.type(input, '20-ab05-cd2026');
    expect(input).toHaveValue('20-05-2026');
  });

  it('punctuates the date as bare digits are typed', async () => {
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '20052026');
    expect(input).toHaveValue('20-05-2026');
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledWith(new Date(2026, 4, 20));
  });

  it('takes the separator back out when the digit in front of it goes', async () => {
    render(<Harness onCommit={vi.fn()} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '2005');
    expect(input).toHaveValue('20-05');
    await userEvent.type(input, '{Backspace}{Backspace}');
    expect(input).toHaveValue('20');
  });

  it('marks the field invalid for a value that types cleanly but will not parse', async () => {
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '99-99-2026');
    await userEvent.tab();
    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('commits a parsed date on Enter', async () => {
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '20-05-2026{Enter}');
    expect(onCommit).toHaveBeenCalledWith(new Date(2026, 4, 20));
  });

  it('rejects a date that fails validate and marks the field invalid', async () => {
    const onCommit = vi.fn();
    // Only years 2026 are valid
    const validate = (d: Date) => d.getFullYear() === 2026;
    render(<HarnessWithValidate onCommit={onCommit} validate={validate} />);
    const input = screen.getByPlaceholderText('start');
    // Type a date outside the allowed year
    await userEvent.type(input, '20-05-2025');
    await userEvent.tab();
    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('commits a date that passes validate', async () => {
    const onCommit = vi.fn();
    const validate = (d: Date) => d.getFullYear() === 2026;
    render(<HarnessWithValidate onCommit={onCommit} validate={validate} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '20-05-2026');
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledWith(new Date(2026, 4, 20));
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('commits null when cleared', async () => {
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '20-05-2026');
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onCommit).toHaveBeenLastCalledWith(null);
  });
});

function HarnessWithLabel({
  value = null,
  disabled,
}: {
  value?: Date | null;
  disabled?: boolean;
}) {
  const parsing = useDateParsing({});
  return (
    <DateInputField
      value={value}
      parsing={parsing}
      onCommit={() => {}}
      onFocus={() => {}}
      placeholder="dd-mm-yyyy"
      label="Start date"
      disabled={disabled}
    />
  );
}

describe('DateInputField with a label', () => {
  it('names the field, so the label focuses it and queries find it by name', async () => {
    render(<HarnessWithLabel />);
    const input = screen.getByLabelText('Start date');
    await userEvent.click(screen.getByText('Start date'));
    expect(input).toHaveFocus();
  });

  it('rests over the field while it is empty and unfocused', () => {
    render(<HarnessWithLabel />);
    expect(screen.getByText('Start date')).not.toHaveClass('drp-input-label-floating');
  });

  it('floats on focus and drops back on blur', async () => {
    render(<HarnessWithLabel />);
    await userEvent.click(screen.getByLabelText('Start date'));
    expect(screen.getByText('Start date')).toHaveClass('drp-input-label-floating');
    await userEvent.tab();
    expect(screen.getByText('Start date')).not.toHaveClass('drp-input-label-floating');
  });

  it('stays floated after blur when the field kept text', async () => {
    render(<HarnessWithLabel />);
    await userEvent.type(screen.getByLabelText('Start date'), '20-05-2026');
    await userEvent.tab();
    expect(screen.getByText('Start date')).toHaveClass('drp-input-label-floating');
  });

  it('starts floated when the field is rendered with a value', () => {
    render(<HarnessWithLabel value={new Date(2026, 4, 20)} />);
    expect(screen.getByText('Start date')).toHaveClass('drp-input-label-floating');
  });

  it('holds the placeholder back until the label has floated out of its way', async () => {
    // Both print in the same spot. A field showing them at once reads as
    // duplicated text rather than as a caption over a hint.
    render(<HarnessWithLabel />);
    const input = screen.getByLabelText('Start date');
    expect(input).not.toHaveAttribute('placeholder');
    await userEvent.click(input);
    expect(input).toHaveAttribute('placeholder', 'dd-mm-yyyy');
  });
});

function HarnessWithTime({
  onCommit,
  applyMissingTime,
}: {
  onCommit: (d: Date | null) => void;
  applyMissingTime?: (d: Date) => Date;
}) {
  const parsing = useDateParsing({ timePrecision: 'minute' });
  return (
    <DateInputField
      value={null}
      parsing={parsing}
      onCommit={onCommit}
      onFocus={() => {}}
      placeholder="start"
      applyMissingTime={applyMissingTime}
    />
  );
}

describe('DateInputField with a time precision', () => {
  it('commits the clock the text spelled out', async () => {
    const onCommit = vi.fn();
    render(
      <HarnessWithTime
        onCommit={onCommit}
        applyMissingTime={() => new Date(2000, 0, 1)}
      />,
    );
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '20-05-2026 14:30');
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledWith(new Date(2026, 4, 20, 14, 30));
  });

  it('fills the clock in from applyMissingTime when the text had only a date', async () => {
    // Typing a bare date is a way to move the day, not a way to reset the time
    // the user already dialled in on the time picker.
    const onCommit = vi.fn();
    const applyMissingTime = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 15);
    render(<HarnessWithTime onCommit={onCommit} applyMissingTime={applyMissingTime} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '20-05-2026');
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledWith(new Date(2026, 4, 20, 9, 15));
  });

  it('leaves a bare date at midnight when no applyMissingTime is given', async () => {
    const onCommit = vi.fn();
    render(<HarnessWithTime onCommit={onCommit} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '20-05-2026');
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledWith(new Date(2026, 4, 20));
  });

  it('validates the date it will actually commit, not the one before the clock', async () => {
    // applyMissingTime can push a value past maxDate — 23:59:59 on the last
    // allowed day is the case that bites — so the gate has to see the final one.
    const onCommit = vi.fn();
    const seen: Date[] = [];
    const parsingHarness = (
      <HarnessWithTimeValidate
        onCommit={onCommit}
        seen={seen}
        applyMissingTime={(d) =>
          new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59)
        }
      />
    );
    render(parsingHarness);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '20-05-2026');
    await userEvent.tab();
    expect(seen).toEqual([new Date(2026, 4, 20, 23, 59)]);
  });
});

function HarnessWithTimeValidate({
  onCommit,
  seen,
  applyMissingTime,
}: {
  onCommit: (d: Date | null) => void;
  seen: Date[];
  applyMissingTime: (d: Date) => Date;
}) {
  const parsing = useDateParsing({ timePrecision: 'minute' });
  return (
    <DateInputField
      value={null}
      parsing={parsing}
      onCommit={onCommit}
      onFocus={() => {}}
      placeholder="start"
      applyMissingTime={applyMissingTime}
      validate={(d) => {
        seen.push(d);
        return true;
      }}
    />
  );
}
