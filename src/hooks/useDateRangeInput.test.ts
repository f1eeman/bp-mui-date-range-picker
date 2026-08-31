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
    expect(onChange).toHaveBeenCalledWith([d(10), null], 'start');
  });

  it('does not mutate internal state when controlled', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDateRangeInput({ value: [d(10), d(20)], onChange }),
    );
    act(() => result.current.setBoundary('end', d(25)));
    expect(result.current.range).toEqual([d(10), d(20)]); // value prop unchanged
    expect(onChange).toHaveBeenCalledWith([d(10), d(25)], 'end');
  });

  it('commits a reversed range as handed over, rather than reordering it', () => {
    // Ordering moved up to the component, which refuses a date that would
    // reverse the range instead of swapping the ends behind the user. Swapping
    // here as well would put a rejected value back in play by another route.
    const onChange = vi.fn();
    const { result } = renderHook(() => useDateRangeInput({ onChange }));
    act(() => result.current.setRange([d(20), d(10)]));
    expect(result.current.range).toEqual([d(20), d(10)]);
    expect(onChange).toHaveBeenCalledWith([d(20), d(10)], 'both');
  });

  it('commits a single-day range (start equals end)', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDateRangeInput({ onChange }));
    act(() => result.current.setRange([d(10), d(10)]));
    expect(result.current.range).toEqual([d(10), d(10)]);
    expect(onChange).toHaveBeenCalledWith([d(10), d(10)], 'both');
  });

  it('names the boundary that changed', () => {
    // A host stores a range as two fields — that is how its schema, its store
    // and its DTO are shaped — so on every onChange it has to write both, and
    // in react-hook-form that marks both dirty, wakes both useWatch
    // subscriptions and validates a field the user never touched. Which end
    // moved is knowledge this hook already has.
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDateRangeInput({ defaultValue: [null, null], onChange }),
    );

    act(() => result.current.setBoundary('start', new Date(2026, 7, 10)));
    expect(onChange.mock.calls.at(-1)![1]).toBe('start');

    act(() => result.current.setBoundary('end', new Date(2026, 7, 20)));
    expect(onChange.mock.calls.at(-1)![1]).toBe('end');

    act(() => result.current.setRange([new Date(2026, 8, 1), new Date(2026, 8, 5)]));
    expect(onChange.mock.calls.at(-1)![1]).toBe('both');
  });
});
