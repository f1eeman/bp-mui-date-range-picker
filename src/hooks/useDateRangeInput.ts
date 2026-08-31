import { useCallback, useState } from 'react';
import type { Boundary, DateRange } from '../types';

export interface UseDateRangeInputOptions {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange, changed: Boundary | 'both') => void;
}

export interface DateRangeInputState {
  range: DateRange;
  setBoundary: (b: Boundary, date: Date | null) => void;
  setRange: (range: DateRange) => void;
}

/**
 * Single source of truth for the range value. Supports controlled (`value` +
 * `onChange`) and uncontrolled (`defaultValue`) modes.
 *
 * Ordering is not enforced here. A reversed range used to be swapped on the way
 * through, which moved a date the user had just typed into the other field; the
 * component refuses such a date at the gate instead (`keepsOrder`), so what this
 * hook is handed is what it commits.
 */
export function useDateRangeInput(opts: UseDateRangeInputOptions): DateRangeInputState {
  const { value, defaultValue, onChange } = opts;
  const isControlled = value !== undefined;

  const [internal, setInternal] = useState<DateRange>(defaultValue ?? [null, null]);

  const range: DateRange = isControlled ? value! : internal;

  const commit = useCallback(
    (next: DateRange, changed: Boundary | 'both') => {
      if (!isControlled) setInternal(next);
      onChange?.(next, changed);
    },
    [isControlled, onChange],
  );

  const setRange = useCallback(
    (next: DateRange) => commit(next, 'both'),
    [commit],
  );

  const setBoundary = useCallback(
    (b: Boundary, date: Date | null) => {
      const next: DateRange =
        b === 'start' ? [date, range[1]] : [range[0], date];
      commit(next, b);
    },
    [range, commit],
  );

  return { range, setBoundary, setRange };
}
