import type { Locale } from 'date-fns';
import type { Matcher } from 'react-day-picker';

/** A range as a tuple. Either or both ends may be null (unset). */
export type DateRange = [Date | null, Date | null];

/** Which end of the range an interaction targets. */
export type Boundary = 'start' | 'end';

/** A named preset shown in the shortcuts panel. Both ends are concrete. */
export interface Shortcut {
  label: string;
  range: [Date, Date];
}

/**
 * Every styleable element and state modifier of the component.
 *
 * `day` is the day *button*; `dayCell` is the table cell around it. The cell
 * carries the size of the grid, which is why it has its own slot — see
 * docs/adr/0003.
 */
export type Slot =
  | 'root' | 'inputGroup' | 'input' | 'inputStart' | 'inputEnd'
  | 'inputInvalid' | 'separator'
  | 'popover' | 'panel'
  | 'shortcutsPanel' | 'shortcut' | 'shortcutActive'
  | 'calendar' | 'months' | 'month' | 'caption'
  | 'dropdowns' | 'dropdownRoot' | 'dropdown' | 'monthDropdown' | 'yearDropdown'
  | 'nav' | 'navButton' | 'chevron'
  | 'monthGrid' | 'weekdays' | 'weekday' | 'weeks' | 'week'
  | 'dayCell' | 'day'
  | 'daySelected' | 'dayRangeStart' | 'dayRangeEnd' | 'dayRangeMiddle'
  | 'dayToday' | 'dayDisabled' | 'dayOutside' | 'dayFocused'
  | 'timePicker' | 'timePickerInput';

/** Slot -> Tailwind class string overrides. */
export type ClassNames = Partial<Record<Slot, string>>;

/** Props for the top-level DateRangeInput component. */
export interface DateRangeInputProps {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;

  formatDate?: (date: Date, locale?: Locale) => string;
  parseDate?: (str: string, locale?: Locale) => Date | null;
  locale?: Locale;

  minDate?: Date;
  maxDate?: Date;
  disabledDays?: Matcher | Matcher[];
  /**
   * When true, a single-day selection (start === end) counts as a complete
   * range and auto-closes the popover. When false (default), the popover stays
   * open until a two-day range is picked. Single-day ranges are always valid
   * values regardless of this flag.
   */
  allowSingleDayRange?: boolean;

  contiguousCalendarMonths?: boolean;
  shortcuts?: boolean | Shortcut[];
  timePrecision?: 'minute' | 'second';
  /**
   * When true, the popover closes once a complete range (two different days)
   * is selected via the calendar or a shortcut. Defaults to false — the
   * popover stays open until dismissed (Escape or click outside).
   */
  closeOnSelection?: boolean;

  disabled?: boolean;
  placeholder?: { start?: string; end?: string };

  /**
   * Node the popover is portalled into. Defaults to `document.body`.
   *
   * Theme tokens reach the popover by inheritance, so the default is correct
   * whenever the host declares `--drp-*` at `:root` or on `<html>`. Point this
   * at an ancestor carrying the tokens when a retheme is scoped to a subtree
   * instead.
   */
  container?: HTMLElement | null;

  classNames?: ClassNames;
}
