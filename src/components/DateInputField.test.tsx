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
  it('commits a parsed date on blur', async () => {
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '2026-05-20');
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledWith(new Date(2026, 4, 20));
  });

  it('marks the field invalid for an unparseable value', async () => {
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, 'garbage');
    await userEvent.tab();
    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('commits a parsed date on Enter', async () => {
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '2026-05-20{Enter}');
    expect(onCommit).toHaveBeenCalledWith(new Date(2026, 4, 20));
  });

  it('rejects a date that fails validate and marks the field invalid', async () => {
    const onCommit = vi.fn();
    // Only years 2026 are valid
    const validate = (d: Date) => d.getFullYear() === 2026;
    render(<HarnessWithValidate onCommit={onCommit} validate={validate} />);
    const input = screen.getByPlaceholderText('start');
    // Type a date outside the allowed year
    await userEvent.type(input, '2025-05-20');
    await userEvent.tab();
    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('commits a date that passes validate', async () => {
    const onCommit = vi.fn();
    const validate = (d: Date) => d.getFullYear() === 2026;
    render(<HarnessWithValidate onCommit={onCommit} validate={validate} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '2026-05-20');
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledWith(new Date(2026, 4, 20));
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('commits null when cleared', async () => {
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '2026-05-20');
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onCommit).toHaveBeenLastCalledWith(null);
  });
});
