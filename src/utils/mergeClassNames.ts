import { clsx } from 'clsx';
import type { ClassNames, Slot } from '../types';
import { defaultClassNames } from '../styles/defaultClassNames';

/**
 * Resolves the final class string for a slot: the package's own class, then the
 * consumer's override, then any extra conditional classes.
 *
 * No `tailwind-merge`. It used to run here on the claim that "a conflicting
 * consumer class replaces the default", but the defaults are `drp-*` classes,
 * not Tailwind utilities — there has never been anything for it to deduplicate,
 * and on every real input it returned its argument unchanged. What actually
 * decides a conflict is the cascade: the package's rules sit in the `bp-drp`
 * layer and lose to anything the host writes (docs/adr/0002).
 *
 * Dropping it also unpins the package from one major of Tailwind. Its v3
 * understands Tailwind 4 class semantics, and one of the two hosts here is
 * still on Tailwind 3.
 */
export function mergeSlot(
  slot: Slot,
  overrides?: ClassNames,
  ...extra: Array<string | false | undefined>
): string {
  return clsx(defaultClassNames[slot], overrides?.[slot], ...extra);
}
