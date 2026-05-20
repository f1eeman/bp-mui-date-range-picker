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
    const parsed = result.current.parse('2026-05-20');
    expect(parsed).toEqual(new Date(2026, 4, 20));
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
});
