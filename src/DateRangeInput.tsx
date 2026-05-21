import { useCallback, useMemo, useState } from 'react';
import type { DateRange, DateRangeInputProps, Shortcut } from './types';
import { useDateRangeInput } from './hooks/useDateRangeInput';
import { useDateParsing } from './hooks/useDateParsing';
import { isWithinBounds, isSingleDay } from './utils/dateRange';
import { createDefaultShortcuts } from './utils/shortcuts';
import { mergeSlot } from './utils/mergeClassNames';
import { dateMatchModifiers } from 'react-day-picker';
import { Popover } from './components/Popover';
import { RangeCalendar } from './components/RangeCalendar';
import { DateInputField } from './components/DateInputField';
import { ShortcutsPanel } from './components/ShortcutsPanel';
import { TimePicker } from './components/TimePicker';

/** Resolves the `shortcuts` prop into a concrete list (or null when disabled). */
function resolveShortcuts(shortcuts: DateRangeInputProps['shortcuts']): Shortcut[] | null {
  if (!shortcuts) return null;
  return shortcuts === true ? createDefaultShortcuts() : shortcuts;
}

/** Blueprint-style date range input with slot-based Tailwind styling. */
export function DateRangeInput(props: DateRangeInputProps) {
  const {
    value, defaultValue, onChange,
    formatDate, parseDate, locale,
    minDate, maxDate, disabledDays, allowSingleDayRange,
    contiguousCalendarMonths = true,
    shortcuts, timePrecision,
    closeOnSelection = true,
    disabled, placeholder, classNames,
  } = props;

  const [open, setOpen] = useState(false);
  const state = useDateRangeInput({ value, defaultValue, onChange });
  const parsing = useDateParsing({ formatDate, parseDate, locale });
  const presets = useMemo(() => resolveShortcuts(shortcuts), [shortcuts]);

  const validateDate = useCallback(
    (date: Date): boolean => {
      if (!isWithinBounds(date, minDate, maxDate)) return false;
      if (disabledDays && dateMatchModifiers(date, disabledDays)) return false;
      return true;
    },
    [minDate, maxDate, disabledDays],
  );

  const handleCalendarChange = (range: DateRange) => {
    state.setRange(range);
    // rdp v9 starts a range as { from: A, to: A }; the popover closes only
    // once a genuine selection is complete — a two-day range, or a single-day
    // range when allowSingleDayRange treats that as complete.
    const bothSet = range[0] != null && range[1] != null;
    const complete = bothSet && (allowSingleDayRange || !isSingleDay(range));
    if (closeOnSelection && complete) setOpen(false);
  };

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
        sideSlot="inputStart"
        classNames={classNames}
      />
      <span className={mergeSlot('separator', classNames)}>{'→'}</span>
      <DateInputField
        value={state.range[1]}
        parsing={parsing}
        onCommit={(d) => state.setBoundary('end', d)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder?.end}
        disabled={disabled}
        validate={validateDate}
        sideSlot="inputEnd"
        classNames={classNames}
      />
    </div>
  );

  return (
    <div className={mergeSlot('root', classNames)}>
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger={inputGroup}
        className={mergeSlot('popover', classNames)}
        disableClickToggle
      >
        <div className={mergeSlot('panel', classNames)}>
          {presets && (
            <ShortcutsPanel
              shortcuts={presets}
              value={state.range}
              onSelect={handleCalendarChange}
              classNames={classNames}
            />
          )}
          <div>
            <RangeCalendar
              value={state.range}
              onChange={handleCalendarChange}
              contiguous={contiguousCalendarMonths}
              minDate={minDate}
              maxDate={maxDate}
              disabledDays={disabledDays}
              locale={locale}
              classNames={classNames}
            />
            {timePrecision && (
              <div className="flex justify-between">
                <TimePicker
                  value={state.range[0]}
                  precision={timePrecision}
                  onChange={(d) => state.setBoundary('start', d)}
                  classNames={classNames}
                />
                <TimePicker
                  value={state.range[1]}
                  precision={timePrecision}
                  onChange={(d) => state.setBoundary('end', d)}
                  classNames={classNames}
                />
              </div>
            )}
          </div>
        </div>
      </Popover>
    </div>
  );
}
