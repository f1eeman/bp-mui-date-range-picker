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

  it('passes consumer classes through untouched, in order', () => {
    // This used to run tailwind-merge and drop `p-2` in favour of `p-4`. The
    // package has no business rewriting the host's classes: it does not know
    // which Tailwind major the host is on, and its own defaults are `drp-*`
    // classes that no Tailwind conflict resolver has anything to say about.
    // What decides a real conflict is the cascade — see docs/adr/0002.
    expect(mergeSlot('input', { input: 'p-2' }, 'p-4')).toBe('drp-input p-2 p-4');
  });

  it('ignores falsy extra classes', () => {
    expect(mergeSlot('input', undefined, false, 'ring-2')).toBe('drp-input ring-2');
  });
});
