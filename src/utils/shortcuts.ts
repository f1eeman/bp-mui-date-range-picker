import {
  startOfDay, endOfDay, subDays,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  type Locale,
} from 'date-fns';
import type { Shortcut } from '../types';

/**
 * The range arithmetic behind the built-in presets, without any text.
 *
 * A shortcut is a label plus a range, and those two belong to different owners:
 * the label is the host's copy, in the host's language, while "the last seven
 * days" is the same calculation everywhere. Shipping them welded together meant
 * a host that needed its own wording had to reimplement the arithmetic as well
 * — which is exactly what one of the reference hosts had already done.
 *
 * Pass a locale wherever the week matters. `startOfWeek` defaults to Sunday,
 * while a calendar rendered with a `ru` locale starts its weeks on Monday, so
 * without it "this week" disagrees with the grid it is drawn next to.
 */
export const shortcutRanges = {
  today: (now: Date = new Date()): [Date, Date] => [startOfDay(now), endOfDay(now)],

  last7Days: (now: Date = new Date()): [Date, Date] => [
    subDays(startOfDay(now), 6),
    endOfDay(now),
  ],

  last30Days: (now: Date = new Date()): [Date, Date] => [
    subDays(startOfDay(now), 29),
    endOfDay(now),
  ],

  thisWeek: (now: Date = new Date(), locale?: Locale): [Date, Date] => [
    startOfWeek(now, { locale }),
    endOfWeek(now, { locale }),
  ],

  thisMonth: (now: Date = new Date()): [Date, Date] => [
    startOfMonth(now),
    endOfMonth(now),
  ],
} as const;

/** The presets `shortcuts={true}` uses. */
export type ShortcutKey = keyof typeof shortcutRanges;

/** English labels for the built-in presets. */
export const defaultShortcutLabels: Record<ShortcutKey, string> = {
  today: 'Today',
  last7Days: 'Last 7 days',
  last30Days: 'Last 30 days',
  thisWeek: 'This week',
  thisMonth: 'This month',
};

/**
 * The built-in preset list, in English.
 *
 * This is the quick start behind `shortcuts={true}`, and English is the only
 * language it will ever speak. Anything else — a translation, a different set,
 * a different order, or a preset of your own — is a `Shortcut[]` built from
 * `shortcutRanges`.
 */
export function createDefaultShortcuts(now: Date = new Date(), locale?: Locale): Shortcut[] {
  return (Object.keys(shortcutRanges) as ShortcutKey[]).map((key) => ({
    label: defaultShortcutLabels[key],
    range: key === 'thisWeek' ? shortcutRanges.thisWeek(now, locale) : shortcutRanges[key](now),
  }));
}
