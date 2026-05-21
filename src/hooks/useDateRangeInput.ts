import { useCallback, useState } from 'react';
import type { Boundary, DateRange } from '../types';
import { swapIfNeeded } from '../utils/dateRange';

export interface UseDateRangeInputOptions {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;
}

export interface DateRangeInputState {
  range: DateRange;
  setBoundary: (b: Boundary, date: Date | null) => void;
  setRange: (range: DateRange) => void;
}

/**
 * Single source of truth for the range value. Supports controlled (`value` +
 * `onChange`) and uncontrolled (`defaultValue`) modes. Every committed range is
 * ordered start <= end.
 */
export function useDateRangeInput(opts: UseDateRangeInputOptions): DateRangeInputState {
  const { value, defaultValue, onChange } = opts;
  const isControlled = value !== undefined;

  const [internal, setInternal] = useState<DateRange>(defaultValue ?? [null, null]);

  const range: DateRange = isControlled ? value! : internal;

  const commit = useCallback(
    (next: DateRange) => {
      const ordered = swapIfNeeded(next);
      if (!isControlled) setInternal(ordered);
      onChange?.(ordered);
    },
    [isControlled, onChange],
  );

  const setRange = useCallback((next: DateRange) => commit(next), [commit]);

  const setBoundary = useCallback(
    (b: Boundary, date: Date | null) => {
      const next: DateRange =
        b === 'start' ? [date, range[1]] : [range[0], date];
      commit(next);
    },
    [range, commit],
  );

  return { range, setBoundary, setRange };
}
