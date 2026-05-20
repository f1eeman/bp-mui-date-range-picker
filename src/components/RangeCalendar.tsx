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
 * Maps our slot overrides onto react-day-picker v9's classNames keys.
 * RDP v9 uses UI enum string values (e.g. "root", "nav", "day_button", etc.)
 * and DayFlag/SelectionState enum string values for day states.
 * The default class for each key is `rdp-${key}` — e.g. root → rdp-root.
 */
function rdpClassNames(classNames?: ClassNames): Record<string, string> {
  const navBtn = mergeSlot('navButton', classNames);
  return {
    // UI elements (UI enum values)
    // Deliberately append 'rdp-root' so the stable selector works even when
    // consumer overrides replace the default class. The default is also kept
    // via mergeSlot so Tailwind classes merge correctly.
    root: mergeSlot('calendar', classNames, 'rdp-root'), // UI.Root = "root"
    month: mergeSlot('month', classNames),             // UI.Month = "month"
    month_caption: mergeSlot('caption', classNames),   // UI.MonthCaption = "month_caption"
    nav: mergeSlot('nav', classNames),                 // UI.Nav = "nav"
    button_previous: navBtn,                           // UI.PreviousMonthButton = "button_previous"
    button_next: navBtn,                               // UI.NextMonthButton = "button_next"
    weekday: mergeSlot('weekday', classNames),          // UI.Weekday = "weekday"
    week: mergeSlot('week', classNames),               // UI.Week = "week"
    day_button: mergeSlot('day', classNames),          // UI.DayButton = "day_button"
    // SelectionState enum values
    selected: mergeSlot('daySelected', classNames),    // SelectionState.selected = "selected"
    range_start: mergeSlot('dayRangeStart', classNames), // SelectionState.range_start = "range_start"
    range_end: mergeSlot('dayRangeEnd', classNames),   // SelectionState.range_end = "range_end"
    range_middle: mergeSlot('dayRangeMiddle', classNames), // SelectionState.range_middle = "range_middle"
    // DayFlag enum values
    today: mergeSlot('dayToday', classNames),          // DayFlag.today = "today"
    disabled: mergeSlot('dayDisabled', classNames),    // DayFlag.disabled = "disabled"
    outside: mergeSlot('dayOutside', classNames),      // DayFlag.outside = "outside"
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

  const shared = {
    mode: 'range' as const,
    selected: toRdpRange(value),
    onSelect: handleSelect,
    disabled: buildDisabled(minDate, maxDate, disabledDays),
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
