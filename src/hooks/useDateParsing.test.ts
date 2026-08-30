import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDateParsing } from './useDateParsing';

describe('useDateParsing', () => {
  it('formats a Date with the default pattern', () => {
    const { result } = renderHook(() => useDateParsing({}));
    expect(result.current.format(new Date(2026, 4, 20))).toBe('2026-05-20');
  });

  it('formats null as an empty string', () => {
    const { result } = renderHook(() => useDateParsing({}));
    expect(result.current.format(null)).toBe('');
  });

  it('parses a valid string into a Date', () => {
    const { result } = renderHook(() => useDateParsing({}));
    expect(result.current.parse('2026-05-20')?.date).toEqual(new Date(2026, 4, 20));
  });

  it('returns null for an invalid string', () => {
    const { result } = renderHook(() => useDateParsing({}));
    expect(result.current.parse('not-a-date')).toBeNull();
  });

  it('returns null for an empty string', () => {
    const { result } = renderHook(() => useDateParsing({}));
    expect(result.current.parse('   ')).toBeNull();
  });

  it('uses a custom formatDate when provided', () => {
    const { result } = renderHook(() =>
      useDateParsing({ formatDate: () => 'CUSTOM' }),
    );
    expect(result.current.format(new Date())).toBe('CUSTOM');
  });

  it('adds hours and minutes to the pattern at minute precision', () => {
    const { result } = renderHook(() => useDateParsing({ timePrecision: 'minute' }));
    expect(result.current.format(new Date(2026, 4, 20, 9, 5))).toBe('2026-05-20 09:05');
  });

  it('adds seconds to the pattern at second precision', () => {
    const { result } = renderHook(() => useDateParsing({ timePrecision: 'second' }));
    expect(result.current.format(new Date(2026, 4, 20, 9, 5, 30))).toBe('2026-05-20 09:05:30');
  });

  it('parses a string that carries a time', () => {
    const { result } = renderHook(() => useDateParsing({ timePrecision: 'minute' }));
    const parsed = result.current.parse('2026-05-20 14:30');
    expect(parsed?.date).toEqual(new Date(2026, 4, 20, 14, 30));
    expect(parsed?.hasTime).toBe(true);
  });

  it('accepts a date typed without its time, and says so', () => {
    // Reporting hasTime lets the caller keep the clock already on that
    // boundary instead of silently resetting it to midnight.
    const { result } = renderHook(() => useDateParsing({ timePrecision: 'minute' }));
    const parsed = result.current.parse('2026-05-20');
    expect(parsed?.date).toEqual(new Date(2026, 4, 20));
    expect(parsed?.hasTime).toBe(false);
  });

  it('accepts a time typed without its seconds at second precision', () => {
    // The fallback is a ladder, not a single rung: a clock the user under-
    // specified is still a clock, and rejecting it as invalid would be a
    // papercut on every hand-typed value.
    const { result } = renderHook(() => useDateParsing({ timePrecision: 'second' }));
    const parsed = result.current.parse('2026-05-20 14:30');
    expect(parsed?.date).toEqual(new Date(2026, 4, 20, 14, 30, 0));
    expect(parsed?.hasTime).toBe(true);
  });
  it('reports no time for the date-only default pattern', () => {
    const { result } = renderHook(() => useDateParsing({}));
    expect(result.current.parse('2026-05-20')?.hasTime).toBe(false);
  });

  it('treats a custom parseDate as authoritative about the time', () => {
    // The host owns its format end to end; second-guessing whether its result
    // carries a clock would overwrite a time it meant to set.
    const { result } = renderHook(() =>
      useDateParsing({ parseDate: () => new Date(2026, 4, 20, 8, 0) }),
    );
    const parsed = result.current.parse('whatever');
    expect(parsed?.date).toEqual(new Date(2026, 4, 20, 8, 0));
    expect(parsed?.hasTime).toBe(true);
  });

  it('returns null when a custom parseDate rejects the string', () => {
    const { result } = renderHook(() => useDateParsing({ parseDate: () => null }));
    expect(result.current.parse('whatever')).toBeNull();
  });
});
