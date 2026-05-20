import { isAfter, isBefore, isSameDay } from 'date-fns';
import type { DateRange } from '../types';

/** True when `date` is inside [minDate, maxDate]; bounds are day-inclusive. */
export function isWithinBounds(date: Date, minDate?: Date, maxDate?: Date): boolean {
  if (minDate && isBefore(date, minDate) && !isSameDay(date, minDate)) return false;
  if (maxDate && isAfter(date, maxDate) && !isSameDay(date, maxDate)) return false;
  return true;
}

/** Returns the range with ends ordered start <= end. */
export function swapIfNeeded(range: DateRange): DateRange {
  const [start, end] = range;
  if (start && end && isAfter(start, end)) return [end, start];
  return range;
}

/** True when both ends are set and fall on the same calendar day. */
export function isSingleDay(range: DateRange): boolean {
  const [start, end] = range;
  return !!start && !!end && isSameDay(start, end);
}
