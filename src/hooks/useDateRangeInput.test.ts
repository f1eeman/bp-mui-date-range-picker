import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDateRangeInput } from './useDateRangeInput';

const d = (day: number) => new Date(2026, 4, day);

describe('useDateRangeInput', () => {
  it('starts empty when no value is given', () => {
    const { result } = renderHook(() => useDateRangeInput({}));
    expect(result.current.range).toEqual([null, null]);
  });

  it('initialises from defaultValue (uncontrolled)', () => {
    const { result } = renderHook(() =>
      useDateRangeInput({ defaultValue: [d(10), d(20)] }),
    );
    expect(result.current.range).toEqual([d(10), d(20)]);
  });

  it('updates internal state and calls onChange when uncontrolled', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDateRangeInput({ onChange }));
    act(() => result.current.setBoundary('start', d(10)));
    expect(result.current.range).toEqual([d(10), null]);
    expect(onChange).toHaveBeenCalledWith([d(10), null]);
  });

  it('does not mutate internal state when controlled', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDateRangeInput({ value: [d(10), d(20)], onChange }),
    );
    act(() => result.current.setBoundary('end', d(25)));
    expect(result.current.range).toEqual([d(10), d(20)]); // value prop unchanged
    expect(onChange).toHaveBeenCalledWith([d(10), d(25)]);
  });

  it('commits a reversed range as handed over, rather than reordering it', () => {
    // Ordering moved up to the component, which refuses a date that would
    // reverse the range instead of swapping the ends behind the user. Swapping
    // here as well would put a rejected value back in play by another route.
    const onChange = vi.fn();
    const { result } = renderHook(() => useDateRangeInput({ onChange }));
    act(() => result.current.setRange([d(20), d(10)]));
    expect(result.current.range).toEqual([d(20), d(10)]);
    expect(onChange).toHaveBeenCalledWith([d(20), d(10)]);
  });

  it('commits a single-day range (start equals end)', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDateRangeInput({ onChange }));
    act(() => result.current.setRange([d(10), d(10)]));
    expect(result.current.range).toEqual([d(10), d(10)]);
    expect(onChange).toHaveBeenCalledWith([d(10), d(10)]);
  });
});
