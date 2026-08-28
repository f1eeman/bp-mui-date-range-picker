import { useState } from 'react';
import { DayPicker, type DateRange as RdpRange, type Matcher } from 'react-day-picker';
import type { Locale } from 'date-fns';
import { addMonths } from 'date-fns';
import type { ClassNames, DateRange } from '../types';
import { rdpClassNames } from './rdpClassNames';

export interface RangeCalendarProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** How many months to show. */
  numberOfMonths: number;
  /** True: one grid whose months step together. False: independent grids. */
  linked: boolean;
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

/**
 * A range calendar. `linked` renders one grid whose months step together;
 * otherwise each month gets its own grid and navigates on its own.
 */
export function RangeCalendar({
  value,
  onChange,
  numberOfMonths,
  linked,
  defaultMonth,
  minDate,
  maxDate,
  disabledDays,
  locale,
  classNames,
}: RangeCalendarProps) {
  const count = Math.max(1, Math.floor(numberOfMonths));

  // Read once, on mount: `new Date()` would otherwise be a fresh value every
  // render and reset the view while the user is navigating.
  const [baseMonth] = useState<Date>(() => defaultMonth ?? value[0] ?? new Date());
  const [linkedMonth, setLinkedMonth] = useState<Date>(baseMonth);
  const [unlinkedMonths, setUnlinkedMonths] = useState<Date[]>(() =>
    Array.from({ length: count }, (_, i) => addMonths(baseMonth, i)),
  );

  // `numberOfMonths` can change after mount, and hooks cannot be added per
  // panel. Grow or trim from the last month already on screen so panels the
  // user has navigated keep their position instead of snapping back.
  const panelMonths =
    unlinkedMonths.length === count
      ? unlinkedMonths
      : Array.from(
          { length: count },
          (_, i) =>
            unlinkedMonths[i] ??
            addMonths(
              unlinkedMonths[unlinkedMonths.length - 1] ?? baseMonth,
              i - unlinkedMonths.length + 1,
            ),
        );

  const setPanelMonth = (index: number, month: Date) =>
    setUnlinkedMonths(panelMonths.map((m, i) => (i === index ? month : m)));

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

  if (linked) {
    return (
      <DayPicker
        {...shared}
        numberOfMonths={count}
        month={linkedMonth}
        onMonthChange={setLinkedMonth}
      />
    );
  }

  return (
    <div className="drp-panels">
      {panelMonths.map((month, i) => (
        <DayPicker
          key={i}
          {...shared}
          month={month}
          onMonthChange={(next) => setPanelMonth(i, next)}
        />
      ))}
    </div>
  );
}
