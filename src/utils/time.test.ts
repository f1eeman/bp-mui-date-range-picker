import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  withTimeOf,
  defaultBoundaryTime,
  carryTime,
  defaultBoundaryDate,
  wrapUnit,
} from './time';

describe('withTimeOf', () => {
  it('puts the clock of one date onto the day of another', () => {
    const day = new Date(2026, 7, 29, 0, 0, 0);
    const clock = new Date(2020, 0, 1, 14, 37, 5);
    expect(withTimeOf(day, clock)).toEqual(new Date(2026, 7, 29, 14, 37, 5));
  });

  it('carries milliseconds too', () => {
    const day = new Date(2026, 7, 29);
    const clock = new Date(2020, 0, 1, 23, 59, 59, 999);
    expect(withTimeOf(day, clock).getMilliseconds()).toBe(999);
  });

  it('leaves both arguments untouched', () => {
    const day = new Date(2026, 7, 29, 0, 0, 0);
    const clock = new Date(2020, 0, 1, 14, 37, 5);
    withTimeOf(day, clock);
    expect(day).toEqual(new Date(2026, 7, 29, 0, 0, 0));
    expect(clock).toEqual(new Date(2020, 0, 1, 14, 37, 5));
  });
});

describe('defaultBoundaryTime', () => {
  it('opens the day for a start boundary', () => {
    expect(defaultBoundaryTime('start', new Date(2026, 7, 29, 14, 37, 5)))
      .toEqual(new Date(2026, 7, 29, 0, 0, 0, 0));
  });

  it('closes the day for an end boundary', () => {
    expect(defaultBoundaryTime('end', new Date(2026, 7, 29, 14, 37, 5)))
      .toEqual(new Date(2026, 7, 29, 23, 59, 59, 999));
  });
});

describe('carryTime', () => {
  it('keeps the clock already set on the boundary', () => {
    const prev = new Date(2026, 7, 20, 9, 15, 30);
    expect(carryTime('start', new Date(2026, 7, 29), prev))
      .toEqual(new Date(2026, 7, 29, 9, 15, 30));
  });

  it('falls back to the boundary default when the boundary was unset', () => {
    expect(carryTime('end', new Date(2026, 7, 29), null))
      .toEqual(new Date(2026, 7, 29, 23, 59, 59, 999));
  });
});

describe('defaultBoundaryDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('picks today when neither end has a day yet', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 30, 17, 51));
    const picked = defaultBoundaryDate('start', null);
    expect([picked.getFullYear(), picked.getMonth(), picked.getDate()])
      .toEqual([2026, 7, 30]);
  });

  it('puts a start the day before the end already picked', () => {
    expect(defaultBoundaryDate('start', new Date(2026, 7, 20)))
      .toEqual(new Date(2026, 7, 19));
  });

  it('puts an end the day after the start already picked', () => {
    expect(defaultBoundaryDate('end', new Date(2026, 7, 20)))
      .toEqual(new Date(2026, 7, 21));
  });

  it('lands on the other end itself when a one-day range is allowed', () => {
    expect(defaultBoundaryDate('end', new Date(2026, 7, 20), true))
      .toEqual(new Date(2026, 7, 20));
  });

  it('steps across a month boundary rather than clamping inside it', () => {
    expect(defaultBoundaryDate('end', new Date(2026, 7, 31)))
      .toEqual(new Date(2026, 8, 1));
  });

  it('leaves the other end untouched', () => {
    const other = new Date(2026, 7, 20, 9, 30);
    defaultBoundaryDate('start', other);
    expect(other).toEqual(new Date(2026, 7, 20, 9, 30));
  });
});

describe('wrapUnit', () => {
  it('leaves a value already in range alone', () => {
    expect(wrapUnit(14, 23)).toBe(14);
  });

  it('wraps past the top round to zero', () => {
    expect(wrapUnit(24, 23)).toBe(0);
    expect(wrapUnit(60, 59)).toBe(0);
  });

  it('wraps below zero round to the top', () => {
    expect(wrapUnit(-1, 23)).toBe(23);
    expect(wrapUnit(-1, 59)).toBe(59);
  });
});
