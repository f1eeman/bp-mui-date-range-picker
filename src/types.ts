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

/** Every styleable element and state modifier of the component. */
export type Slot =
  | 'root' | 'inputGroup' | 'input' | 'inputStart' | 'inputEnd'
  | 'inputInvalid' | 'separator'
  | 'popover' | 'panel'
  | 'shortcutsPanel' | 'shortcut' | 'shortcutActive'
  | 'calendar' | 'month' | 'caption' | 'nav' | 'navButton'
  | 'weekday' | 'week' | 'day'
  | 'daySelected' | 'dayRangeStart' | 'dayRangeEnd' | 'dayRangeMiddle'
  | 'dayToday' | 'dayDisabled' | 'dayOutside'
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
  closeOnSelection?: boolean;

  disabled?: boolean;
  placeholder?: { start?: string; end?: string };

  classNames?: ClassNames;
}
