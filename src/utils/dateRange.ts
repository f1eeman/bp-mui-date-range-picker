import { isAfter, isBefore, isSameDay, startOfDay } from 'date-fns';
import type { DateRange } from '../types';

/** True when `date` is inside [minDate, maxDate]; bounds are day-inclusive. */
export function isWithinBounds(date: Date, minDate?: Date, maxDate?: Date): boolean {
  const day = startOfDay(date);
  if (minDate && isBefore(day, startOfDay(minDate))) return false;
  if (maxDate && isAfter(day, startOfDay(maxDate))) return false;
  return true;
}

/**
 * Returns the range with both ends ordered start <= end. A range with a null
 * start or null end is a valid partial state (e.g. the user is still filling
 * one field) and is returned unchanged — only a fully-set, reversed range is
 * swapped.
 */
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
