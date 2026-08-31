import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { Locale } from 'date-fns';
import type { Matcher } from 'react-day-picker';

/** A range as a tuple. Either or both ends may be null (unset). */
export type DateRange = [Date | null, Date | null];

/**
 * How fine the time fields go. Absent means the picker is date-only: no time
 * fields, and the text pattern carries no clock.
 */
export type TimePrecision = 'minute' | 'second';

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
  | 'root' | 'inputGroup' | 'inputRoot' | 'input' | 'inputStart' | 'inputEnd'
  | 'inputInvalid' | 'inputLabel' | 'inputLabelFloating' | 'separator'
  | 'popover' | 'panel'
  | 'shortcutsPanel' | 'shortcut' | 'shortcutActive'
  | 'calendar' | 'months' | 'month' | 'caption'
  | 'dropdowns' | 'dropdownRoot' | 'dropdown' | 'monthDropdown' | 'yearDropdown'
  | 'nav' | 'navButton' | 'chevron'
  | 'monthGrid' | 'weekdays' | 'weekday' | 'weeks' | 'week'
  | 'dayCell' | 'day'
  | 'daySelected' | 'dayRangeStart' | 'dayRangeEnd' | 'dayRangeMiddle'
  | 'dayToday' | 'dayDisabled' | 'dayOutside' | 'dayFocused'
  | 'timePickers' | 'timePicker' | 'timePickerInputRow'
  | 'timePickerSeparator' | 'timePickerInput'
  | 'timePickerArrowRow' | 'timePickerArrowButton' | 'timePickerArrowSpacer';

/** Slot -> Tailwind class string overrides. */
export type ClassNames = Partial<Record<Slot, string>>;

/**
 * Props for the top-level DateRangeInput component.
 *
 * Extends the props of the root `<div>`, so `className`, `style`, `id`,
 * `data-*` and `aria-*` reach it directly. Without that a host had to wrap the
 * component in an element of its own just to place it — and per-instance
 * theming, which means putting `--drp-*` in `style`, had nowhere to go.
 */
export interface DateRangeInputProps
  extends Omit<
    ComponentPropsWithoutRef<'div'>,
    'onChange' | 'defaultValue' | 'children'
  > {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;

  formatDate?: (date: Date, locale?: Locale) => string;
  parseDate?: (str: string, locale?: Locale) => Date | null;
  /**
   * date-fns pattern for the date half of both text fields — `'dd/MM/yyyy'`,
   * `'dd-MM-yyyy'`, `'dd.MM.yyyy'`, `'MM/dd/yyyy'`, whatever the audience
   * reads. Defaults to `'yyyy-MM-dd'`. It is used to write the fields and to
   * read them back, so the two cannot drift apart.
   *
   * `timePrecision` appends the clock to it; the clock itself is fixed at
   * `HH:mm(:ss)` because the time fields beside it are numeric 24-hour
   * controls. For anything this cannot express, `formatDate` and `parseDate`
   * still take over completely.
   */
  datePattern?: string;
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

  /**
   * How many months the calendar shows. Defaults to 2.
   *
   * Replaces `contiguousCalendarMonths`, which was a boolean and so could only
   * ever mean "two". One month is a common ask for a dense filter row and was
   * unreachable.
   */
  numberOfMonths?: number;
  /**
   * When true (the default) the months share one grid and step together, so
   * navigating shows the next consecutive pair. When false each month gets its
   * own grid and navigates independently.
   */
  linkedNavigation?: boolean;
  shortcuts?: boolean | Shortcut[];
  timePrecision?: TimePrecision;
  /**
   * When true, each time field gets a step button above and below it. Defaults
   * to false — the fields are typeable and take the arrow keys either way.
   * Only meaningful alongside `timePrecision`.
   */
  showArrowButtons?: boolean;
  /**
   * When true, the popover closes once a complete range (two different days)
   * is selected via the calendar or a shortcut. Defaults to false — the
   * popover stays open until dismissed (Escape or click outside).
   */
  closeOnSelection?: boolean;

  /** Controlled open state of the popover. */
  open?: boolean;
  /** Initial open state when the popover is uncontrolled. */
  defaultOpen?: boolean;
  /**
   * Called whenever the popover opens or closes, for either reason — a field
   * taking focus, Escape, a click outside, or a completed selection under
   * `closeOnSelection`.
   */
  onOpenChange?: (open: boolean) => void;

  disabled?: boolean;
  placeholder?: { start?: string; end?: string };
  /**
   * Caption for each field. Each one rests over its field like a placeholder
   * while the field is empty and unfocused, then floats up onto the top border
   * — the shape a Material UI outlined field draws.
   *
   * A field with both a label and a placeholder shows the placeholder only once
   * the label has floated out of its way, so the two never print on top of each
   * other.
   */
  label?: { start?: string; end?: string };
  /**
   * Node between the two fields. Defaults to an em dash. Anything renderable
   * works — an arrow, an icon, or `null` to drop it.
   */
  separator?: ReactNode;

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
