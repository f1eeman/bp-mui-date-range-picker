import {
  startOfDay, endOfDay, subDays,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
} from 'date-fns';
import type { Shortcut } from '../types';

/** Builds the built-in preset list, relative to `now`. */
export function createDefaultShortcuts(now: Date = new Date()): Shortcut[] {
  const today = startOfDay(now);
  const todayEnd = endOfDay(now);
  return [
    { label: 'Today', range: [today, todayEnd] },
    { label: 'Last 7 days', range: [subDays(today, 6), todayEnd] },
    { label: 'Last 30 days', range: [subDays(today, 29), todayEnd] },
    { label: 'This week', range: [startOfWeek(now), endOfWeek(now)] },
    { label: 'This month', range: [startOfMonth(now), endOfMonth(now)] },
  ];
}
