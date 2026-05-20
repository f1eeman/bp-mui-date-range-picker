import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ClassNames, Slot } from '../types';
import { defaultClassNames } from '../styles/defaultClassNames';

/**
 * Resolves the final class string for a slot: default classes, then consumer
 * overrides, then any extra conditional classes. `tailwind-merge` ensures a
 * conflicting consumer class replaces the default instead of duplicating it.
 */
export function mergeSlot(
  slot: Slot,
  overrides?: ClassNames,
  ...extra: Array<string | false | undefined>
): string {
  return twMerge(clsx(defaultClassNames[slot], overrides?.[slot], ...extra));
}
