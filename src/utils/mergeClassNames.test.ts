import { describe, it, expect } from 'vitest';
import { mergeSlot } from './mergeClassNames';

describe('mergeSlot', () => {
  it('returns the slot base class when no override is given', () => {
    expect(mergeSlot('separator')).toBe('drp-separator');
  });

  it('appends a consumer override onto the base class', () => {
    const result = mergeSlot('separator', { separator: 'text-red-500' });
    expect(result).toContain('drp-separator');
    expect(result).toContain('text-red-500');
  });

  it('resolves Tailwind conflicts among the consumer classes (later wins)', () => {
    const result = mergeSlot('input', { input: 'p-2' }, 'p-4');
    expect(result).toContain('drp-input');
    expect(result).toContain('p-4');
    expect(result).not.toContain('p-2');
  });

  it('ignores falsy extra classes', () => {
    expect(mergeSlot('input', undefined, false, 'ring-2')).toBe('drp-input ring-2');
  });
});
