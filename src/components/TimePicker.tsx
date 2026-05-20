import { useState, useEffect } from 'react';
import { setHours, setMinutes, setSeconds } from 'date-fns';
import type { ClassNames } from '../types';
import { mergeSlot } from '../utils/mergeClassNames';

export interface TimePickerProps {
  value: Date | null;
  precision: 'minute' | 'second';
  onChange: (date: Date) => void;
  classNames?: ClassNames;
}

/** Numeric hours/minutes(/seconds) editor for one range boundary. */
export function TimePicker({ value, precision, onChange, classNames }: TimePickerProps) {
  const base = value ?? new Date();
  const inputClass = mergeSlot('timePickerInput', classNames);

  const [hours, setHoursState] = useState(() => base.getHours());
  const [minutes, setMinutesState] = useState(() => base.getMinutes());
  const [seconds, setSecondsState] = useState(() => base.getSeconds());

  // Sync local state when the prop value changes from outside.
  useEffect(() => {
    setHoursState(base.getHours());
    setMinutesState(base.getMinutes());
    setSecondsState(base.getSeconds());
    // Only sync when the underlying Date's time fields actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.getHours(), base.getMinutes(), base.getSeconds()]);

  return (
    <div className={mergeSlot('timePicker', classNames)}>
      <input
        type="number"
        aria-label="hours"
        min={0}
        max={23}
        value={hours}
        className={inputClass}
        onChange={(e) => {
          const h = Number(e.target.value);
          setHoursState(h);
          onChange(setHours(base, h));
        }}
      />
      <span>:</span>
      <input
        type="number"
        aria-label="minutes"
        min={0}
        max={59}
        value={minutes}
        className={inputClass}
        onChange={(e) => {
          const m = Number(e.target.value);
          setMinutesState(m);
          onChange(setMinutes(base, m));
        }}
      />
      {precision === 'second' && (
        <>
          <span>:</span>
          <input
            type="number"
            aria-label="seconds"
            min={0}
            max={59}
            value={seconds}
            className={inputClass}
            onChange={(e) => {
              const s = Number(e.target.value);
              setSecondsState(s);
              onChange(setSeconds(base, s));
            }}
          />
        </>
      )}
    </div>
  );
}
