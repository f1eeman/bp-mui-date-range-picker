import { useState } from 'react';
import { DayPicker, type DateRange as RdpRange, type Matcher } from 'react-day-picker';
import type { Locale } from 'date-fns';
import { addMonths, isSameMonth, startOfDay, startOfMonth } from 'date-fns';
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

  // Follow the selection when it lands somewhere the calendar is not looking.
  //
  // The view was read once at mount and never reacted to `value` again, so a
  // shortcut — or a date typed into a field — could set a range the user then
  // could not see: navigate to December 2027, press "This month", and the grids
  // stayed in 2027 while the value was in 2026.
  //
  // Only re-anchor when the boundary that moved is off-screen. Picking a day
  // inside a visible month must not yank the view, and in unlinked mode neither
  // must picking one in a panel the user has paged somewhere of their own.
  const shownMonths = linked
    ? Array.from({ length: count }, (_, i) => addMonths(linkedMonth, i))
    : panelMonths;

  // Both ends are tracked and the one that moved is the one followed. Anchored
  // on the start alone, a date typed into the end field never moved the view:
  // its time picker took the clock and the grids stayed put, so the day just
  // named was nowhere on screen.
  //
  // Keyed on the day and not its month, because a shortcut landing in the month
  // a day was already picked from read as no change at all and skipped the
  // off-screen check entirely: pick 3 August, page the grids to August of the
  // next year, press "This month", and the value moved while the view stayed a
  // year out. A day is coarse enough to ignore a clock edited on the time
  // picker, which must not yank the view either.
  const startDay = value[0] ? startOfDay(value[0]).getTime() : null;
  const endDay = value[1] ? startOfDay(value[1]).getTime() : null;
  const [lastStartDay, setLastStartDay] = useState<number | null>(startDay);
  const [lastEndDay, setLastEndDay] = useState<number | null>(endDay);

  if (startDay !== lastStartDay || endDay !== lastEndDay) {
    // Adjusting state during render rather than in an effect: this reads as
    // part of deriving the view from the value, and it avoids painting the
    // wrong month first.
    setLastStartDay(startDay);
    setLastEndDay(endDay);
    const movedStart = startDay !== lastStartDay ? value[0] : null;
    const movedEnd = endDay !== lastEndDay ? value[1] : null;
    // The start wins when both moved, because a range reads from its beginning.
    const followingStart = movedStart !== null;
    const moved = movedStart ?? movedEnd;
    if (moved && !shownMonths.some((m) => isSameMonth(m, moved))) {
      // Which grid the boundary lands in: a start opens the view, an end closes
      // it, so the months running up to an end stay on screen rather than the
      // ones past it.
      const panel = followingStart ? 0 : count - 1;
      const month = startOfMonth(moved);
      if (linked) {
        // One window of consecutive months, so the whole of it moves. May 2026
        // and December 2029 cannot both be on screen; the alternative is not
        // showing the day just named at all.
        setLinkedMonth(addMonths(month, -panel));
      } else if (movedStart && movedEnd) {
        // A whole new value — a shortcut, or a controlled range replaced from
        // outside — is not one boundary being edited, so the view re-derives
        // rather than half of it staying behind on a month nobody asked for.
        const first = addMonths(month, -panel);
        setUnlinkedMonths(Array.from({ length: count }, (_, i) => addMonths(first, i)));
      } else {
        // One boundary was edited, and unlinked panels are the user's own
        // windows: only the one that owns that boundary moves. Moving them as a
        // block took the start's month off screen to reveal an end years away,
        // which is the one thing independent paging exists to avoid.
        setUnlinkedMonths(panelMonths.map((m, i) => (i === panel ? month : m)));
      }
    }
  }

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
