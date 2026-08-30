import { forwardRef, useCallback, useMemo, useState } from 'react';
import type { Locale } from 'date-fns';
import type { Boundary, DateRange, DateRangeInputProps, Shortcut } from './types';
import { useDateRangeInput } from './hooks/useDateRangeInput';
import { useDateParsing } from './hooks/useDateParsing';
import { isWithinBounds, isSingleDay } from './utils/dateRange';
import { carryTime, defaultBoundaryDate, withTimeOf } from './utils/time';
import { createDefaultShortcuts } from './utils/shortcuts';
import { mergeSlot } from './utils/mergeClassNames';
import { dateMatchModifiers } from 'react-day-picker';
import { Popover } from './components/Popover';
import { RangeCalendar } from './components/RangeCalendar';
import { DateInputField } from './components/DateInputField';
import { ShortcutsPanel } from './components/ShortcutsPanel';
import { TimePicker } from './components/TimePicker';

/** Resolves the `shortcuts` prop into a concrete list (or null when disabled). */
function resolveShortcuts(
  shortcuts: DateRangeInputProps['shortcuts'],
  locale?: Locale,
): Shortcut[] | null {
  if (!shortcuts) return null;
  // The locale decides where a week starts, so the built-in "this week"
  // agrees with the grid it is drawn beside rather than assuming Sunday.
  return shortcuts === true ? createDefaultShortcuts(new Date(), locale) : shortcuts;
}

/**
 * Blueprint-style date range input, themed through `--drp-*` tokens with
 * per-slot class overrides as the escape hatch.
 *
 * `forwardRef` rather than a plain `ref` prop: React 19 accepts `ref` as an
 * ordinary prop but React 18 does not, and the package supports both.
 */
export const DateRangeInput = forwardRef<HTMLDivElement, DateRangeInputProps>(
  function DateRangeInput(props, ref) {
    const {
      value, defaultValue, onChange,
      formatDate, parseDate, locale,
      minDate, maxDate, disabledDays, allowSingleDayRange,
      numberOfMonths = 2,
      linkedNavigation = true,
      shortcuts, timePrecision, showArrowButtons,
      closeOnSelection = false,
      open: openProp, defaultOpen = false, onOpenChange,
      disabled, placeholder, separator = '→',
      classNames, container,
      className, ...rest
    } = props;

    // Same controlled/uncontrolled shape as the range value: `open` drives it
    // when given, otherwise internal state does, and onOpenChange fires either
    // way so a host can react without taking ownership.
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpenControlled = openProp !== undefined;
    const open = isOpenControlled ? openProp : internalOpen;

    const setOpen = useCallback(
      (next: boolean) => {
        if (!isOpenControlled) setInternalOpen(next);
        onOpenChange?.(next);
      },
      [isOpenControlled, onOpenChange],
    );

    const state = useDateRangeInput({ value, defaultValue, onChange });
    const parsing = useDateParsing({ formatDate, parseDate, locale, timePrecision });
    const presets = useMemo(() => resolveShortcuts(shortcuts, locale), [shortcuts, locale]);

    const validateDate = useCallback(
      (date: Date): boolean => {
        if (!isWithinBounds(date, minDate, maxDate)) return false;
        if (disabledDays && dateMatchModifiers(date, disabledDays)) return false;
        return true;
      },
      [minDate, maxDate, disabledDays],
    );

    // rdp v9 starts a range as { from: A, to: A }; the popover closes only once
    // a genuine selection is complete — a two-day range, or a single-day range
    // when allowSingleDayRange treats that as complete.
    const closeIfComplete = (range: DateRange) => {
      const bothSet = range[0] != null && range[1] != null;
      const complete = bothSet && (allowSingleDayRange || !isSingleDay(range));
      if (closeOnSelection && complete) setOpen(false);
    };

    // The grid hands over its days at midnight. Under a time precision that
    // would wipe a clock the user had already dialled in, so each end keeps the
    // one it has and a fresh end opens or closes its day instead.
    const handleCalendarChange = (range: DateRange) => {
      const next: DateRange = timePrecision
        ? [
            range[0] && carryTime('start', range[0], state.range[0]),
            range[1] && carryTime('end', range[1], state.range[1]),
          ]
        : range;
      state.setRange(next);
      closeIfComplete(next);
    };

    // A shortcut is concrete on both ends by definition — "today" means the
    // whole of today — so the times it computed stand as they are.
    const handleShortcutSelect = (range: DateRange) => {
      state.setRange(range);
      closeIfComplete(range);
    };

    // The time picker reports a clock, not a moment: which day that clock lands
    // on is a question about the range, so it is answered here. A boundary that
    // already has a day keeps it; one that does not is given the day it would
    // most likely have meant — see `defaultBoundaryDate`.
    const handleTimeChange = (boundary: Boundary, clock: Date) => {
      const [start, end] = state.range;
      const own = boundary === 'start' ? start : end;
      const other = boundary === 'start' ? end : start;
      const day = own ?? defaultBoundaryDate(boundary, other, allowSingleDayRange);
      state.setBoundary(boundary, withTimeOf(day, clock));
    };

    // Lets a day typed on its own keep the clock already on that boundary,
    // rather than silently resetting it to midnight.
    const missingTimeFor = (b: Boundary) =>
      timePrecision
        ? (d: Date) => carryTime(b, d, state.range[b === 'start' ? 0 : 1])
        : undefined;

    const inputGroup = (
      <div className={mergeSlot('inputGroup', classNames)}>
        <DateInputField
          value={state.range[0]}
          parsing={parsing}
          onCommit={(d) => state.setBoundary('start', d)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder?.start}
          disabled={disabled}
          validate={validateDate}
          applyMissingTime={missingTimeFor('start')}
          sideSlot="inputStart"
          classNames={classNames}
        />
        {separator !== null && separator !== undefined && (
          <span className={mergeSlot('separator', classNames)}>{separator}</span>
        )}
        <DateInputField
          value={state.range[1]}
          parsing={parsing}
          onCommit={(d) => state.setBoundary('end', d)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder?.end}
          disabled={disabled}
          validate={validateDate}
          applyMissingTime={missingTimeFor('end')}
          sideSlot="inputEnd"
          classNames={classNames}
        />
      </div>
    );

    return (
      <div ref={ref} className={mergeSlot('root', classNames, className)} {...rest}>
        <Popover
          open={open}
          onOpenChange={setOpen}
          trigger={inputGroup}
          className={mergeSlot('popover', classNames)}
          container={container}
          disableClickToggle
        >
          <div className={mergeSlot('panel', classNames)}>
            {presets && (
              <ShortcutsPanel
                shortcuts={presets}
                value={state.range}
                onSelect={handleShortcutSelect}
                classNames={classNames}
              />
            )}
            <div>
              <RangeCalendar
                value={state.range}
                onChange={handleCalendarChange}
                numberOfMonths={numberOfMonths}
                linked={linkedNavigation}
                minDate={minDate}
                maxDate={maxDate}
                disabledDays={disabledDays}
                locale={locale}
                classNames={classNames}
              />
              {timePrecision && (
                <div className={mergeSlot('timePickers', classNames)}>
                  <TimePicker
                    boundary="start"
                    value={state.range[0]}
                    precision={timePrecision}
                    onChange={(d) => handleTimeChange('start', d)}
                    disabled={disabled}
                    showArrowButtons={showArrowButtons}
                    classNames={classNames}
                  />
                  <TimePicker
                    boundary="end"
                    value={state.range[1]}
                    precision={timePrecision}
                    onChange={(d) => handleTimeChange('end', d)}
                    disabled={disabled}
                    showArrowButtons={showArrowButtons}
                    classNames={classNames}
                  />
                </div>
              )}
            </div>
          </div>
        </Popover>
      </div>
    );
  },
);
