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

  it('swaps ends so the committed range is ordered', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDateRangeInput({ onChange }));
    act(() => result.current.setRange([d(20), d(10)]));
    expect(result.current.range).toEqual([d(10), d(20)]);
  });

  it('rejects a both-ends-set single-day range by default', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDateRangeInput({ onChange }));
    act(() => result.current.setRange([d(10), d(10)]));
    expect(result.current.range).toEqual([null, null]); // commit rejected
    expect(onChange).not.toHaveBeenCalled();
  });

  it('allows a single-day range when allowSingleDayRange is set', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDateRangeInput({ onChange, allowSingleDayRange: true }),
    );
    act(() => result.current.setRange([d(10), d(10)]));
    expect(result.current.range).toEqual([d(10), d(10)]);
    expect(onChange).toHaveBeenCalledWith([d(10), d(10)]);
  });
});
