import { useCallback, useState } from 'react';
import type { Boundary, DateRange } from '../types';
import { isSingleDay, swapIfNeeded } from '../utils/dateRange';

export interface UseDateRangeInputOptions {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;
  /** When false (default), a both-ends-set single-day range is not committed. */
  allowSingleDayRange?: boolean;
}

export interface DateRangeInputState {
  range: DateRange;
  focusedBoundary: Boundary;
  setFocusedBoundary: (b: Boundary) => void;
  setBoundary: (b: Boundary, date: Date | null) => void;
  setRange: (range: DateRange) => void;
}

/**
 * Single source of truth for the range value. Supports controlled (`value` +
 * `onChange`) and uncontrolled (`defaultValue`) modes. Every committed range is
 * ordered start <= end.
 */
export function useDateRangeInput(opts: UseDateRangeInputOptions): DateRangeInputState {
  const { value, defaultValue, onChange, allowSingleDayRange } = opts;
  const isControlled = value !== undefined;

  const [internal, setInternal] = useState<DateRange>(defaultValue ?? [null, null]);
  const [focusedBoundary, setFocusedBoundary] = useState<Boundary>('start');

  const range: DateRange = isControlled ? value! : internal;

  const commit = useCallback(
    (next: DateRange) => {
      const ordered = swapIfNeeded(next);
      // Reject a both-ends-set single-day range unless explicitly allowed.
      if (!allowSingleDayRange && isSingleDay(ordered)) return;
      if (!isControlled) setInternal(ordered);
      onChange?.(ordered);
    },
    [isControlled, onChange, allowSingleDayRange],
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

  return { range, focusedBoundary, setFocusedBoundary, setBoundary, setRange };
}
