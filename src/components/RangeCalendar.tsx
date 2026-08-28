import { useState } from 'react';
import { DayPicker, type DateRange as RdpRange, type Matcher } from 'react-day-picker';
import type { Locale } from 'date-fns';
import { addMonths } from 'date-fns';
import type { ClassNames, DateRange } from '../types';
import { rdpClassNames } from './rdpClassNames';

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
    <div className="drp-panels">
      <DayPicker {...shared} month={leftMonth} onMonthChange={setLeftMonth} />
      <DayPicker {...shared} month={rightMonth} onMonthChange={setRightMonth} />
    </div>
  );
}
