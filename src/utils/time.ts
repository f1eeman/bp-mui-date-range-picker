import { addDays, endOfDay, startOfDay } from 'date-fns';
import type { Boundary } from '../types';

/**
 * The day of `day` wearing the clock of `clock`.
 *
 * Every source of a new day — the calendar grid, a date typed without a time —
 * hands over a Date at midnight. Passing it straight into the range would wipe
 * a time the user had already dialled in, so each of those paths routes through
 * here instead.
 */
export function withTimeOf(day: Date, clock: Date): Date {
  const next = new Date(day);
  next.setHours(
    clock.getHours(),
    clock.getMinutes(),
    clock.getSeconds(),
    clock.getMilliseconds(),
  );
  return next;
}

/**
 * The clock a boundary gets when it has none yet: a start opens its day, an end
 * closes it. A range picked with two clicks then covers the whole span rather
 * than collapsing to midnight-to-midnight, which is what a filter almost always
 * means — and it keeps a single-day range the right way round, where an end at
 * 00:00 would sort before its own start and be refused by `keepsOrder`.
 */
export function defaultBoundaryTime(boundary: Boundary, day: Date): Date {
  return boundary === 'start' ? startOfDay(day) : endOfDay(day);
}

/**
 * Pulls a moment inside [minDate, maxDate].
 *
 * Only the boundary defaults need this. A clock the user dialled is refused
 * outright when it falls outside a bound, because silently moving a value
 * someone typed is worse than not taking it — but a default they never chose
 * has no such claim, and leaving it outside means the component hands back a
 * value it would itself reject.
 */
export function clampToBounds(date: Date, minDate?: Date, maxDate?: Date): Date {
  if (minDate && date < minDate) return new Date(minDate);
  if (maxDate && date > maxDate) return new Date(maxDate);
  return date;
}

/**
 * `day` keeping the clock already on `prev`, or the boundary default when unset.
 *
 * The default opens or closes the day, which on the day a bound falls is
 * guaranteed to sit outside it — hence the clamp. It applies to the default
 * only: `prev` is a clock the user set, and is left alone.
 */
export function carryTime(
  boundary: Boundary,
  day: Date,
  prev: Date | null,
  bounds?: { minDate?: Date; maxDate?: Date },
): Date {
  if (prev) return withTimeOf(day, prev);
  return clampToBounds(defaultBoundaryTime(boundary, day), bounds?.minDate, bounds?.maxDate);
}

/**
 * The day a boundary is given when a clock is dialled on it before any day has
 * been picked.
 *
 * Dialling a time has to land on some day, and refusing to guess one is what
 * used to leave these fields disabled. The guess is made against the opposite
 * boundary so that the range it produces is already ordered, rather than one
 * `keepsOrder` would have to turn away:
 *
 * - nothing picked at all — today, the only day either end can mean;
 * - the other end is set — the day beside it, so a start lands before its end
 *   and an end after its start;
 * - unless a one-day range is allowed, in which case beside it *is* it.
 */
export function defaultBoundaryDate(
  boundary: Boundary,
  other: Date | null,
  allowSingleDayRange = false,
): Date {
  if (!other) return new Date();
  if (allowSingleDayRange) return other;
  return addDays(other, boundary === 'start' ? -1 : 1);
}

/**
 * `n` brought into 0..max by wrapping round, so stepping past either end of a
 * clock unit lands on the other: 23 + 1 is 0 and 0 - 1 is 23.
 */
export function wrapUnit(n: number, max: number): number {
  const span = max + 1;
  return ((n % span) + span) % span;
}
