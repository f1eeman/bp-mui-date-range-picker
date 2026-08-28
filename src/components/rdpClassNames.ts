import type { ClassNames } from '../types';
import { mergeSlot } from '../utils/mergeClassNames';

/**
 * Maps *every* react-day-picker v9 class key onto a class this package owns.
 *
 * Exhaustive on purpose. The package no longer imports
 * `react-day-picker/style.css` (docs/adr/0003), so any key left unmapped keeps
 * react-day-picker's own class name with no rule behind it — silently unstyled
 * rather than loudly broken. `rdpClassNames.test.ts` fails if a key is missed,
 * including keys a future react-day-picker adds.
 *
 * Keys with no public slot are mapped to a fixed class instead: they are either
 * internal plumbing (`caption_label`, which `styles.css` hides because the
 * native select replaces it), state the package styles itself (`hidden`), or
 * nodes this component never renders — week numbers and the footer are not
 * exposed as props, so a slot for them would name a node that never exists.
 *
 * The nav buttons get side modifiers (`drp-nav-button--prev/--next`) that
 * `styles.css` positions for `navLayout="around"`.
 */
export function rdpClassNames(classNames?: ClassNames): Record<string, string> {
  return {
    // --- UI ---
    root: mergeSlot('calendar', classNames),
    months: mergeSlot('months', classNames),
    month: mergeSlot('month', classNames),
    month_caption: mergeSlot('caption', classNames),
    month_grid: mergeSlot('monthGrid', classNames),
    caption_label: 'drp-caption-label',
    dropdowns: mergeSlot('dropdowns', classNames),
    dropdown_root: mergeSlot('dropdownRoot', classNames),
    dropdown: mergeSlot('dropdown', classNames),
    months_dropdown: mergeSlot('monthDropdown', classNames),
    years_dropdown: mergeSlot('yearDropdown', classNames),
    nav: mergeSlot('nav', classNames),
    button_previous: mergeSlot('navButton', classNames, 'drp-nav-button--prev'),
    button_next: mergeSlot('navButton', classNames, 'drp-nav-button--next'),
    chevron: mergeSlot('chevron', classNames),
    weekdays: mergeSlot('weekdays', classNames),
    weekday: mergeSlot('weekday', classNames),
    weeks: mergeSlot('weeks', classNames),
    week: mergeSlot('week', classNames),
    day: mergeSlot('dayCell', classNames),
    day_button: mergeSlot('day', classNames),
    week_number: 'drp-week-number',
    week_number_header: 'drp-week-number-header',
    footer: 'drp-footer',

    // --- SelectionState ---
    selected: mergeSlot('daySelected', classNames),
    range_start: mergeSlot('dayRangeStart', classNames),
    range_end: mergeSlot('dayRangeEnd', classNames),
    range_middle: mergeSlot('dayRangeMiddle', classNames),

    // --- DayFlag ---
    today: mergeSlot('dayToday', classNames),
    disabled: mergeSlot('dayDisabled', classNames),
    outside: mergeSlot('dayOutside', classNames),
    focused: mergeSlot('dayFocused', classNames),
    hidden: 'drp-day-hidden',

    // --- Animation ---
    // Inert unless `animate` is passed to DayPicker, which this component does
    // not do. Mapped anyway so enabling it later cannot leak unstyled rdp
    // classes back in.
    weeks_before_enter: 'drp-weeks-before-enter',
    weeks_before_exit: 'drp-weeks-before-exit',
    weeks_after_enter: 'drp-weeks-after-enter',
    weeks_after_exit: 'drp-weeks-after-exit',
    caption_before_enter: 'drp-caption-before-enter',
    caption_before_exit: 'drp-caption-before-exit',
    caption_after_enter: 'drp-caption-after-enter',
    caption_after_exit: 'drp-caption-after-exit',
  };
}
