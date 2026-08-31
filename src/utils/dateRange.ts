import { isAfter, isBefore, isSameDay, startOfDay } from 'date-fns';
import type { Boundary, DateRange, TimePrecision } from '../types';

/**
 * True when `date` is inside [minDate, maxDate].
 *
 * Without a `timePrecision` the bounds are day-inclusive: the UI offers no way
 * to satisfy a bound part-way through a day, so refusing the day would refuse
 * every value the user can produce.
 *
 * With one, the clock counts. `minDate` and `maxDate` are typed `Date`, and a
 * host that shows a clock means the moment it passed — "not before now" has to
 * refuse midnight of today, not accept it as seventeen hours early.
 */
export function isWithinBounds(
  date: Date,
  minDate?: Date,
  maxDate?: Date,
  timePrecision?: TimePrecision,
): boolean {
  const at = (d: Date) => (timePrecision ? d : startOfDay(d));
  if (minDate && isBefore(at(date), at(minDate))) return false;
  if (maxDate && isAfter(at(date), at(maxDate))) return false;
  return true;
}

/**
 * Returns the range with both ends ordered start <= end. A range with a null
 * start or null end is a valid partial state (e.g. the user is still filling
 * one field) and is returned unchanged — only a fully-set, reversed range is
 * swapped.
 *
 * Reaches one path only: the clocks a single calendar click carries onto one
 * day, which the user inherited rather than named. A value the user does name
 * is turned away by `keepsOrder` instead of being reordered behind them.
 */
export function swapIfNeeded(range: DateRange): DateRange {
  const [start, end] = range;
  if (start && end && isAfter(start, end)) return [end, start];
  return range;
}

/**
 * True when giving `boundary` this date leaves the range ordered start <= end.
 *
 * An unset opposite end is no constraint, and both ends on the same instant is a
 * range rather than a reversal — refusing is about the order, not about the
 * length. This is the gate that replaced quietly swapping the two ends: a swap
 * moved the date the user had just typed into the other field, which read as the
 * component losing the input.
 */
export function keepsOrder(boundary: Boundary, date: Date, range: DateRange): boolean {
  const other = boundary === 'start' ? range[1] : range[0];
  if (!other) return true;
  return boundary === 'start' ? !isAfter(date, other) : !isBefore(date, other);
}

/** True when both ends are set and fall on the same calendar day. */
export function isSingleDay(range: DateRange): boolean {
  const [start, end] = range;
  return !!start && !!end && isSameDay(start, end);
}
