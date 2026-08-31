import { describe, it, expect } from 'vitest';
import { isWithinBounds, swapIfNeeded, keepsOrder, isSingleDay } from './dateRange';

describe('isWithinBounds', () => {
  it('returns true with no bounds', () => {
    expect(isWithinBounds(new Date(2026, 0, 15))).toBe(true);
  });
  it('rejects a date before minDate', () => {
    expect(isWithinBounds(new Date(2026, 0, 1), new Date(2026, 0, 10))).toBe(false);
  });
  it('rejects a date after maxDate', () => {
    expect(isWithinBounds(new Date(2026, 0, 20), undefined, new Date(2026, 0, 10))).toBe(false);
  });
  it('accepts a date equal to a bound (same day)', () => {
    const d = new Date(2026, 0, 10, 14, 0);
    expect(isWithinBounds(d, new Date(2026, 0, 10), new Date(2026, 0, 10))).toBe(true);
  });
});

describe('swapIfNeeded', () => {
  it('swaps when start is after end', () => {
    const a = new Date(2026, 0, 20);
    const b = new Date(2026, 0, 10);
    expect(swapIfNeeded([a, b])).toEqual([b, a]);
  });
  it('leaves an ordered range untouched', () => {
    const a = new Date(2026, 0, 10);
    const b = new Date(2026, 0, 20);
    expect(swapIfNeeded([a, b])).toEqual([a, b]);
  });
  it('leaves a range with a null end untouched', () => {
    const a = new Date(2026, 0, 10);
    expect(swapIfNeeded([a, null])).toEqual([a, null]);
  });
  it('leaves a range with a null start untouched (valid partial state)', () => {
    const b = new Date(2026, 0, 20);
    expect(swapIfNeeded([null, b])).toEqual([null, b]);
  });
});

describe('isSingleDay', () => {
  it('is true when both ends fall on the same day', () => {
    // times differ (9h vs 18h) but the calendar day matches
    expect(isSingleDay([new Date(2026, 0, 10, 9), new Date(2026, 0, 10, 18)])).toBe(true);
  });
  it('is false for different days', () => {
    expect(isSingleDay([new Date(2026, 0, 10), new Date(2026, 0, 11)])).toBe(false);
  });
  it('is false when an end is null', () => {
    expect(isSingleDay([new Date(2026, 0, 10), null])).toBe(false);
  });
});

describe('keepsOrder', () => {
  const at = (day: number, hour = 0) => new Date(2026, 4, day, hour);

  it('turns away an end before the start', () => {
    expect(keepsOrder('end', at(5), [at(10), null])).toBe(false);
  });

  it('turns away a start after the end', () => {
    expect(keepsOrder('start', at(20), [null, at(10)])).toBe(false);
  });

  it('allows both ends on the same instant', () => {
    // Refusing is about the order, not about the length of the range.
    expect(keepsOrder('end', at(10), [at(10), null])).toBe(true);
    expect(keepsOrder('start', at(10), [null, at(10)])).toBe(true);
  });

  it('compares clocks, not just days', () => {
    expect(keepsOrder('end', at(10, 9), [at(10, 18), null])).toBe(false);
    expect(keepsOrder('end', at(10, 19), [at(10, 18), null])).toBe(true);
  });

  it('has nothing to say when the opposite end is unset', () => {
    expect(keepsOrder('start', at(20), [null, null])).toBe(true);
    expect(keepsOrder('end', at(1), [null, null])).toBe(true);
  });
});
