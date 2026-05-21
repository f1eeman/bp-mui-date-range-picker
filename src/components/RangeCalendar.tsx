import { useState } from 'react';
import { DayPicker, type DateRange as RdpRange, type Matcher } from 'react-day-picker';
import 'react-day-picker/style.css';
import type { Locale } from 'date-fns';
import { addMonths } from 'date-fns';
import type { ClassNames, DateRange } from '../types';
import { mergeSlot } from '../utils/mergeClassNames';

export interface RangeCalendarProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  contiguous: boolean;
  defaultMonth?: Date;
  minDate?: Date;
  maxDate?: Date;
  disabledDays?: Matcher | Matcher[];
  locale?: Locale;
  classNames?: ClassNames;
}

/** Converts our tuple into the rdp `{ from, to }` shape. */
function toRdpRange(range: DateRange): RdpRange | undefined {
  const [from, to] = range;
  if (!from) return undefined;
  return { from, to: to ?? undefined };
}

/** Converts an rdp range back into our tuple. */
function fromRdpRange(range: RdpRange | undefined): DateRange {
  if (!range?.from) return [null, null];
  return [range.from, range.to ?? null];
}

/**
 * Maps the library's slot classes onto react-day-picker v9's classNames keys.
 * The `rdp-root` extra is kept so a stable selector survives consumer overrides.
 * `caption_label` is mapped to `drp-caption-label`, which `styles.css` hides.
 * The nav buttons get side modifiers (`drp-nav-button--prev/--next`) that
 * `styles.css` positions for `navLayout="around"`.
 */
function rdpClassNames(classNames?: ClassNames): Record<string, string> {
  return {
    root: mergeSlot('calendar', classNames, 'rdp-root'),     // UI.Root
    month: mergeSlot('month', classNames),                   // UI.Month
    month_caption: mergeSlot('caption', classNames),         // UI.MonthCaption
    dropdowns: mergeSlot('dropdowns', classNames),           // UI.Dropdowns
    dropdown: mergeSlot('dropdown', classNames),             // UI.Dropdown
    caption_label: 'drp-caption-label',                      // UI.CaptionLabel (hidden via styles.css)
    button_previous: mergeSlot('navButton', classNames, 'drp-nav-button--prev'), // UI.PreviousMonthButton
    button_next: mergeSlot('navButton', classNames, 'drp-nav-button--next'),     // UI.NextMonthButton
    weekday: mergeSlot('weekday', classNames),               // UI.Weekday
    week: mergeSlot('week', classNames),                     // UI.Week
    day_button: mergeSlot('day', classNames),                // UI.DayButton
    selected: mergeSlot('daySelected', classNames),          // SelectionState.selected
    range_start: mergeSlot('dayRangeStart', classNames),     // SelectionState.range_start
    range_end: mergeSlot('dayRangeEnd', classNames),         // SelectionState.range_end
    range_middle: mergeSlot('dayRangeMiddle', classNames),   // SelectionState.range_middle
    today: mergeSlot('dayToday', classNames),                // DayFlag.today
    disabled: mergeSlot('dayDisabled', classNames),          // DayFlag.disabled
    outside: mergeSlot('dayOutside', classNames),            // DayFlag.outside
  };
}

/** Builds the rdp `disabled` matcher list from bounds + custom matchers. */
function buildDisabled(
  minDate?: Date,
  maxDate?: Date,
  disabledDays?: Matcher | Matcher[],
): Matcher[] {
  const matchers: Matcher[] = [];
  if (minDate) matchers.push({ before: minDate });
  if (maxDate) matchers.push({ after: maxDate });
  if (Array.isArray(disabledDays)) matchers.push(...disabledDays);
  else if (disabledDays) matchers.push(disabledDays);
  return matchers;
}

/**
 * Year-range bounds for the caption dropdowns. Uses minDate/maxDate when given,
 * otherwise the current year +/- 10. The returned months also bound month
 * navigation, which is intentional (see the design doc).
 */
function yearBounds(
  minDate?: Date,
  maxDate?: Date,
): { startMonth: Date; endMonth: Date } {
  const currentYear = new Date().getFullYear();
  return {
    startMonth: minDate ?? new Date(currentYear - 10, 0, 1),
    endMonth: maxDate ?? new Date(currentYear + 10, 11, 31),
  };
}

/** A range calendar: one grid when contiguous, two independent grids otherwise. */
export function RangeCalendar({
  value,
  onChange,
  contiguous,
  defaultMonth,
  minDate,
  maxDate,
  disabledDays,
  locale,
  classNames,
}: RangeCalendarProps) {
  const baseMonth = defaultMonth ?? value[0] ?? new Date();
  const [leftMonth, setLeftMonth] = useState<Date>(baseMonth);
  const [rightMonth, setRightMonth] = useState<Date>(addMonths(baseMonth, 1));

  // RDP v9 onSelect for range mode: OnSelectHandler<DateRange | undefined>
  // Signature: (selected: DateRange | undefined, triggerDate, modifiers, e) => void
  // Only the first argument (the range) is needed.
  const handleSelect = (range: RdpRange | undefined) => onChange(fromRdpRange(range));

  const { startMonth, endMonth } = yearBounds(minDate, maxDate);

  const shared = {
    mode: 'range' as const,
    selected: toRdpRange(value),
    onSelect: handleSelect,
    disabled: buildDisabled(minDate, maxDate, disabledDays),
    captionLayout: 'dropdown' as const,
    navLayout: 'around' as const,
    startMonth,
    endMonth,
    locale,
    classNames: rdpClassNames(classNames),
  };

  if (contiguous) {
    return (
      <DayPicker
        {...shared}
        numberOfMonths={2}
        month={leftMonth}
        onMonthChange={setLeftMonth}
      />
    );
  }

  return (
    <div className="flex gap-2">
      <DayPicker {...shared} month={leftMonth} onMonthChange={setLeftMonth} />
      <DayPicker {...shared} month={rightMonth} onMonthChange={setRightMonth} />
    </div>
  );
}
