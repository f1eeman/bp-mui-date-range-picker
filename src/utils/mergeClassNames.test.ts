import { describe, it, expect } from 'vitest';
import { mergeSlot } from './mergeClassNames';

describe('mergeSlot', () => {
  it('returns the default class when no override is given', () => {
    expect(mergeSlot('separator')).toBe('text-zinc-400');
  });

  it('lets an override win a Tailwind conflict', () => {
    const result = mergeSlot('separator', { separator: 'text-red-500' });
    expect(result).toContain('text-red-500');
    expect(result).not.toContain('text-zinc-400');
  });

  it('appends extra conditional classes', () => {
    const result = mergeSlot('input', undefined, false, 'ring-2');
    expect(result).toContain('ring-2');
  });
});
