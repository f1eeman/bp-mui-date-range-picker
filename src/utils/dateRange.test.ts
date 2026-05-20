import { describe, it, expect } from 'vitest';
import { isWithinBounds, swapIfNeeded, isSingleDay } from './dateRange';

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
});

describe('isSingleDay', () => {
  it('is true when both ends fall on the same day', () => {
    expect(isSingleDay([new Date(2026, 0, 10, 9), new Date(2026, 0, 10, 18)])).toBe(true);
  });
  it('is false for different days', () => {
    expect(isSingleDay([new Date(2026, 0, 10), new Date(2026, 0, 11)])).toBe(false);
  });
  it('is false when an end is null', () => {
    expect(isSingleDay([new Date(2026, 0, 10), null])).toBe(false);
  });
});
