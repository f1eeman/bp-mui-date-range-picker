import { useRef, useState } from 'react';
import { DayPicker, type DateRange as RdpRange, type Matcher } from 'react-day-picker';
import type { Locale } from 'date-fns';
import {
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import type { Boundary, ClassNames, DateRange } from '../types';
import { rdpClassNames } from './rdpClassNames';

/**
 * The month dropdown is a control, and its options are headings. date-fns
 * returns the form a month takes inside a sentence, which in Russian and most
 * other Slavic locales is lower case (`август`) and reads as a typo here. The
 * locale is not the place to fix it — the same locale is right for prose — and
 * the host cannot reach the `<option>` text at all, so the package capitalises.
 *
 * Upper-cased through the locale's own code, because the mapping is not
 * universal: Turkish `i` becomes `İ`, not `I`.
 *
 * The name comes from the date-fns locale rather than `Intl`, even though
 * `Intl` reads the same language tag. A browser only knows the languages its
 * build shipped CLDR data for, and for the rest it answers with a placeholder
 * — Chromium returns `M09` for Kazakh — while the locale the host already
 * handed us knows `қыркүйек`. `LLLL` is the standalone month, which is the
 * form a dropdown option needs.
 */
const capitaliseMonth = (month: Date, locale?: Locale): string => {
  const name = locale
    ? format(month, 'LLLL', { locale })
    : month.toLocaleString(undefined, { month: 'long' });
  return name.charAt(0).toLocaleUpperCase(locale?.code) + name.slice(1);
};

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
 * The range after one of its ends is put down on `day`.
 *
 * Dragging an end past the other one swaps their roles rather than refusing the
 * move: the end stood still becomes the start, and the day just dropped becomes
 * the end. Refusing reads as a dead click, and the range the user drew with the
 * cursor is unambiguous — it is only the labels on its ends that changed.
 *
 * This is the one place a reversal is not an error. A date *typed* into a field
 * is refused, because there the two ends were named separately and one of them
 * is simply wrong.
 */
function withEndMoved(
  moved: Boundary,
  day: Date,
  from: Date | null,
  to: Date | null,
): { range: DateRange; held: Boundary } {
  const other = moved === 'start' ? to : from;
  const crossed =
    other !== null &&
    (moved === 'start'
      ? startOfDay(day) > startOfDay(other)
      : startOfDay(day) < startOfDay(other));
  // The hand follows the day, not the label it started with: dragging a start
  // past the end leaves the cursor holding what is now the end.
  if (crossed) {
    return moved === 'start'
      ? { range: [other, day], held: 'end' }
      : { range: [day, other], held: 'start' };
  }
  return {
    range: moved === 'start' ? [day, to] : [from, day],
    held: moved,
  };
}

/**
 * Slides a run of panel months back inside the bounds, keeping the run intact.
 *
 * Panels are independent grids, so each one clamps to `maxDate` on its own and
 * they pile onto the same month at the bound: with `maxDate` today, a range on
 * today opened September beside September. Shifting the whole run keeps every
 * panel on a month of its own — August beside September — which is what one
 * grid of two months does at a bound anyway.
 */
function clampPanels(months: Date[], minDate?: Date, maxDate?: Date): Date[] {
  if (months.length === 0) return months;
  let run = months;
  if (maxDate) {
    const past = differenceInCalendarMonths(run[run.length - 1]!, startOfMonth(maxDate));
    if (past > 0) run = run.map((m) => addMonths(m, -past));
  }
  // The low bound is applied second: when the bounds are closer together than
  // the panels are wide, something has to give, and showing the earliest
  // allowed months beats showing months that are disabled outright.
  if (minDate) {
    const before = differenceInCalendarMonths(startOfMonth(minDate), run[0]!);
    if (before > 0) run = run.map((m) => addMonths(m, before));
  }
  return run;
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

  // Clicking an end of a finished range takes hold of that end, rather than
  // throwing the range away and starting a new one from the day clicked.
  // Rebuilding a range to nudge one end by a day is the tedious half of using a
  // range picker, and the day under the cursor is the one end a click is least
  // likely to mean as a fresh start.
  //
  // The hold survives the click that puts the end down, so a run of clicks all
  // adjust the same end — picking a start takes several tries as often as one,
  // and every other click would otherwise land on the opposite end. Taking hold
  // of the other end, or a value arriving from outside, ends it.
  const [heldEnd, setHeldEnd] = useState<Boundary | null>(null);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  // Set for the one render in which our own click updates the value, so the
  // hold is not mistaken for one the new value should clear.
  const ownEdit = useRef(false);

  // `numberOfMonths` can change after mount, and hooks cannot be added per
  // panel. Grow or trim from the last month already on screen so panels the
  // user has navigated keep their position instead of snapping back.
  const panelMonths = clampPanels(
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
        ),
    minDate,
    maxDate,
  );

  // Set once a panel has been paged by hand — through its arrows or its
  // month/year dropdowns. A window somebody chose is not one to tidy up after:
  // the drift rule below would pull a panel left on a distant month back beside
  // the range, undoing the paging on the very next click.
  const pagedByHand = useRef(false);

  const setPanelMonth = (index: number, month: Date) => {
    pagedByHand.current = true;
    setUnlinkedMonths(panelMonths.map((m, i) => (i === index ? month : m)));
  };

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
    // A value arriving from anywhere else — a shortcut, a typed date — settles
    // the range, so an end held earlier is let go, and the paging that led up
    // to it is spent: the new value is a fresh instruction about what to show.
    // Our own clicks are exempt: the hold is what makes a run of them adjust
    // the same end, and paging done to reach them still stands.
    if (ownEdit.current) {
      ownEdit.current = false;
    } else {
      pagedByHand.current = false;
      setHeldEnd(null);
      setHoveredDay(null);
    }
    const movedStart = startDay !== lastStartDay ? value[0] : null;
    const movedEnd = endDay !== lastEndDay ? value[1] : null;
    // The start wins when both moved, because a range reads from its beginning.
    const followingStart = movedStart !== null;
    const moved = movedStart ?? movedEnd;
    const onScreen = (day: Date) => shownMonths.some((m) => isSameMonth(m, day));
    // A panel counts as near the range while it is inside it or one month
    // either side of it, which is where a panel lands after paging by one.
    const nearRange = (month: Date, from: Date, to: Date) =>
      differenceInCalendarMonths(month, startOfMonth(from)) >= -1 &&
      differenceInCalendarMonths(month, startOfMonth(to)) <= 1;
    // Two separate reasons to move, because they want different moves.
    //
    // A boundary landing off-screen moves as little as possible — just the
    // panel that owns it.
    //
    // A view that has drifted away from the range re-derives entirely. A wide
    // range leaves the panels months apart, and the next, narrow one then had a
    // stale panel beside it: after March–September, "неделя" set a week in
    // September and March stayed up next to it. Both ends were on screen, so
    // nothing looked wrong to an off-screen check — and only the start had
    // moved, so following the moved boundary alone would have put September in
    // both panels.
    //
    // Clicking a day trips neither. The day is necessarily in a visible month,
    // and the panel it was clicked in — plus its neighbour, one page away —
    // count as near, so the view holds still.
    const bounded = value[0] && value[1] ? ([value[0], value[1]] as const) : null;
    const offScreen = moved !== null && !onScreen(moved);
    // Not while the panels were paged by hand: a month somebody navigated to is
    // a deliberate window, and tidying it away on the next click undoes the
    // paging. The off-screen rule still applies — a day picked has to be
    // visible — but a far-off panel with nothing selected in it stays put.
    const drifted =
      !pagedByHand.current &&
      bounded !== null &&
      !shownMonths.every((m) => nearRange(m, bounded[0], bounded[1]));
    if (moved && (offScreen || drifted)) {
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
      } else if (bounded) {
        // Once a range has both ends, the view derives from the range itself
        // rather than from whichever boundary moved. Nudging only the panel
        // that owned the moved end left a gap next to it: on September and
        // October, "месяц" moved the start to August and the second panel
        // stayed on October, skipping the very month the range ended in.
        //
        // Independent panels straddle the range rather than stepping through
        // it: the first opens on the start, the last closes on the end. Marching
        // consecutively from the start is right only while the range fits in
        // the panels — beyond that it hides the end, which is the half a reader
        // checks a long range for.
        const firstMonth = startOfMonth(bounded[0]);
        const lastMonth = startOfMonth(bounded[1]);
        const spansPastPanels = differenceInCalendarMonths(lastMonth, firstMonth) >= count;
        setUnlinkedMonths(
          Array.from({ length: count }, (_, i) =>
            spansPastPanels && i === count - 1 ? lastMonth : addMonths(firstMonth, i),
          ),
        );
      } else {
        // A half-made range — one end picked, the other still empty — has no
        // shape to straddle, so only the panel owning that end moves. Moving
        // them as a block would take a start off screen to reveal nothing.
        setUnlinkedMonths(panelMonths.map((m, i) => (i === panel ? month : m)));
      }
    }
  }

  // RDP v9 onSelect for range mode: OnSelectHandler<DateRange | undefined>
  // Signature: (selected: DateRange | undefined, triggerDate, modifiers, e) => void
  // The range rdp computed is used for an ordinary pick; `triggerDate` — the day
  // actually clicked — is what tells an end being picked up from a fresh start.
  // Curried on the panel rather than taking it as a third argument: rdp's own
  // `onSelect` has `modifiers` in that position, and a handler whose third
  // parameter disagrees stops matching the mode it was passed with.
  const selectHandler =
    (panel?: number) => (range: RdpRange | undefined, triggerDate: Date) => {
    const [from, to] = value;

    if (from && to && triggerDate) {
      // Taking hold comes first, so a click on an end always means that end.
      // The start is offered first, so a single-day range moves its start:
      // either reading is defensible there, and a start is what the next click
      // most likely means.
      const clickedEnd = isSameDay(triggerDate, from)
        ? 'start'
        : isSameDay(triggerDate, to)
          ? 'end'
          : null;
      if (clickedEnd) {
        // Touching both ends in turn clears the range. Holding one end and then
        // reaching for the other is not a request to adjust either of them —
        // it is someone marking out the range they already have and starting
        // over, and there is otherwise no way to clear it from the calendar.
        if (heldEnd && heldEnd !== clickedEnd) {
          setHeldEnd(null);
          setHoveredDay(null);
          ownEdit.current = true;
          onChange([null, null]);
          return;
        }
        setHeldEnd(clickedEnd);
        setHoveredDay(null);
        return;
      }
    }

    if (heldEnd && triggerDate) {
      const { range: next, held } = withEndMoved(heldEnd, triggerDate, from, to);
      // The hold outlives the click, so the clicks after it keep adjusting the
      // same end instead of alternating between the two.
      setHeldEnd(held);
      setHoveredDay(null);
      ownEdit.current = true;
      onChange(next);
      return;
    }

    // Which end a click sets, once a range is finished and the grids are
    // independent: the one the grid stands for. rdp decides by where the day
    // falls against the range instead, so any day inside it pulled the end in —
    // including a day clicked in the left grid, which reads as the start.
    //
    // Only for finished ranges: a half-made one has one end to fill, and rdp
    // filling it is right whichever grid the day came from. Both ends on one
    // day counts as half-made — that is how rdp reports a range whose first
    // click has landed — so the second click widens it instead of being read as
    // a start that reverses the range and begins over.
    if (
      panel !== undefined &&
      from &&
      to &&
      !isSameDay(from, to) &&
      triggerDate
    ) {
      const end: Boundary =
        panel === 0
          ? 'start'
          : panel === count - 1
            ? 'end'
            : // A middle grid stands for neither, so the nearer end moves.
              Math.abs(differenceInCalendarDays(triggerDate, from)) <=
                Math.abs(differenceInCalendarDays(triggerDate, to))
              ? 'start'
              : 'end';
      const next: DateRange = end === 'start' ? [triggerDate, to] : [from, triggerDate];
      ownEdit.current = true;
      // A day that would reverse the range is not a boundary of it — it is
      // where a new range starts. Refusing outright would leave no way to pick
      // a range that begins after the current one ends.
      if (next[0] && next[1] && startOfDay(next[0]) > startOfDay(next[1])) {
        onChange([triggerDate, null]);
        return;
      }
      onChange(next);
      return;
    }

    ownEdit.current = true;
    onChange(fromRdpRange(range));
  };

  // What the grid paints while an end is being moved: the range as it would be
  // if the day under the cursor were clicked, swap and all. Without it the
  // pick-up is invisible — the click changes nothing on screen, and the feature
  // reads as one that did not work. Built by the same function as the click, so
  // what is painted is what landing there produces.
  const painted: DateRange =
    heldEnd && hoveredDay
      ? withEndMoved(heldEnd, hoveredDay, value[0], value[1]).range
      : value;

  const { startMonth, endMonth } = yearBounds(minDate, maxDate);

  const shared = {
    mode: 'range' as const,
    selected: toRdpRange(painted),
    onSelect: selectHandler(),
    onDayMouseEnter: (day: Date) => {
      if (heldEnd) setHoveredDay(day);
    },
    onDayMouseLeave: () => {
      if (heldEnd) setHoveredDay(null);
    },
    disabled: buildDisabled(minDate, maxDate, disabledDays),
    captionLayout: 'dropdown' as const,
    navLayout: 'around' as const,
    formatters: {
      formatMonthDropdown: (month: Date) => capitaliseMonth(month, locale),
    },
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
          {...{
            ...shared,
            // rdp reads the mode and its handler off one object, so the
            // per-panel handler is merged in rather than passed beside it.
            onSelect: selectHandler(i),
          }}
          month={month}
          onMonthChange={(next) => setPanelMonth(i, next)}
        />
      ))}
    </div>
  );
}
