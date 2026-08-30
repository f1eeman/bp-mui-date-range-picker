import { Fragment, useEffect, useRef, useState } from 'react';
import type { Boundary, ClassNames, TimePrecision } from '../types';
import { mergeSlot } from '../utils/mergeClassNames';
import { defaultBoundaryTime, wrapUnit } from '../utils/time';

/** Feeds the per-instance id prefix that ties an arrow to the field it drives. */
let fieldSeq = 0;

/** One clock unit and the ceiling it may be dialled to. */
const UNITS = {
  hours: { max: 23, read: (d: Date) => d.getHours() },
  minutes: { max: 59, read: (d: Date) => d.getMinutes() },
  seconds: { max: 59, read: (d: Date) => d.getSeconds() },
} as const;

type Unit = keyof typeof UNITS;

interface TimeFieldProps {
  unit: Unit;
  boundary: Boundary;
  value: number;
  disabled: boolean;
  onCommit: (n: number) => void;
  onStep: (delta: number) => void;
  className: string;
  id: string;
}

/**
 * One numeric clock field.
 *
 * Holds the typed text rather than a number so a half-typed "1" stays "1"
 * instead of snapping to the committed "01" under the caret. The value is
 * committed when the field is left, not on every keystroke: typing "14" through
 * a per-keystroke commit would publish the hour 1 on the way to 14, and with an
 * empty boundary that intermediate value is enough to pick a day.
 */
function TimeField({
  unit, boundary, value, disabled, onCommit, onStep, className, id,
}: TimeFieldProps) {
  const { max } = UNITS[unit];
  const [text, setText] = useState(() => format(value));
  const focused = useRef(false);

  // Follow the value when it changes from elsewhere — the calendar, a shortcut,
  // an arrow button, the other field's clamp — but never while this field has
  // the caret, where it would fight the typing.
  useEffect(() => {
    if (focused.current) return;
    setText(format(value));
  }, [value]);

  /** Read the field back, or fall back to the committed value if it says nothing. */
  const commit = () => {
    if (text.trim() === '') return value;
    const n = Number(text);
    if (!Number.isFinite(n)) return value;
    const clamped = Math.min(max, Math.max(0, Math.trunc(n)));
    if (clamped !== value) onCommit(clamped);
    return clamped;
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      id={id}
      aria-label={`${boundary} ${unit}`}
      min={0}
      max={max}
      disabled={disabled}
      value={text}
      className={className}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        // The browser steps a number input by itself, but it stops dead at
        // `min`/`max`. A clock wraps, so the stepping is done here instead.
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          onStep(e.key === 'ArrowUp' ? 1 : -1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          setText(format(commit()));
        }
      }}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        setText(format(commit()));
      }}
    />
  );
}

/** Two digits. */
function format(value: number): string {
  return String(value).padStart(2, '0');
}

interface ArrowProps {
  direction: 'up' | 'down';
  unit: Unit;
  boundary: Boundary;
  disabled: boolean;
  onStep: () => void;
  controls: string;
  classNames?: ClassNames;
}

/** One step button. Sits outside the field it drives, above or below it. */
function ArrowButton({
  direction, unit, boundary, disabled, onStep, controls, classNames,
}: ArrowProps) {
  const label = `${direction === 'up' ? 'Increase' : 'Decrease'} ${boundary} ${unit}`;
  return (
    <button
      type="button"
      // Not a tab stop: the field it drives already is one, and the same step is
      // on that field's arrow keys. Stopping here on the way between hours and
      // minutes would triple the tab presses to cross one clock.
      tabIndex={-1}
      aria-label={label}
      aria-controls={controls}
      disabled={disabled}
      onClick={onStep}
      className={mergeSlot('timePickerArrowButton', classNames)}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
        <path
          d={direction === 'up' ? 'M3 10.5 8 5.5l5 5' : 'M3 5.5 8 10.5l5-5'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export interface TimePickerProps {
  /** Which end of the range this picker edits. Names its fields. */
  boundary: Boundary;
  value: Date | null;
  precision: TimePrecision;
  /**
   * Called with a date carrying the newly dialled clock. Only the clock is
   * meaningful: when the boundary has no day yet the caller decides which day
   * the time lands on, since that is a question about the range and not about
   * this picker.
   */
  onChange: (date: Date) => void;
  disabled?: boolean;
  /** Show a step button above and below each field. Defaults to false. */
  showArrowButtons?: boolean;
  classNames?: ClassNames;
}

/** Numeric hours/minutes(/seconds) editor for one range boundary. */
export function TimePicker({
  boundary, value, precision, onChange, disabled, showArrowButtons, classNames,
}: TimePickerProps) {
  const inputClass = mergeSlot('timePickerInput', classNames);
  const units: Unit[] = precision === 'second'
    ? ['hours', 'minutes', 'seconds']
    : ['hours', 'minutes'];

  // An arrow points at its field through `aria-controls`, so the field needs an
  // id unique across every picker on the page — two boundaries here, and any
  // number of inputs in the host's form.
  const [idBase] = useState(() => `drp-time-${(fieldSeq += 1)}`);
  const idFor = (unit: Unit) => `${idBase}-${boundary}-${unit}`;

  // A boundary with no day still shows a clock: the one it would be given if a
  // day were picked now. The fields stay typeable and steppable before any day
  // exists, and the day is invented on commit rather than on display.
  const clock = value ?? defaultBoundaryTime(boundary, new Date());

  const commit = (unit: Unit, n: number) => {
    const next = new Date(clock);
    if (unit === 'hours') next.setHours(n);
    else if (unit === 'minutes') next.setMinutes(n);
    else next.setSeconds(n);
    // A range picked with two clicks ends at 23:59:59.999. Dialling any field
    // on it should move that field and nothing else, so the milliseconds ride
    // along rather than being quietly zeroed.
    onChange(next);
  };

  const step = (unit: Unit, delta: number) =>
    commit(unit, wrapUnit(UNITS[unit].read(clock) + delta, UNITS[unit].max));

  const arrowRow = (direction: 'up' | 'down') => (
    <div className={mergeSlot('timePickerArrowRow', classNames)}>
      {units.map((unit, i) => (
        <Fragment key={unit}>
          {i > 0 && (
            <span
              className={mergeSlot('timePickerArrowSpacer', classNames)}
              aria-hidden="true"
            />
          )}
          <ArrowButton
            direction={direction}
            unit={unit}
            boundary={boundary}
            disabled={!!disabled}
            onStep={() => step(unit, direction === 'up' ? 1 : -1)}
            controls={idFor(unit)}
            classNames={classNames}
          />
        </Fragment>
      ))}
    </div>
  );

  return (
    <div className={mergeSlot('timePicker', classNames)}>
      {showArrowButtons && arrowRow('up')}
      <div className={mergeSlot('timePickerInputRow', classNames)}>
        {units.map((unit, i) => (
          <Fragment key={unit}>
            {i > 0 && (
              <span className={mergeSlot('timePickerSeparator', classNames)}>:</span>
            )}
            <TimeField
              unit={unit}
              boundary={boundary}
              value={UNITS[unit].read(clock)}
              disabled={!!disabled}
              onCommit={(n) => commit(unit, n)}
              onStep={(delta) => step(unit, delta)}
              className={inputClass}
              id={idFor(unit)}
            />
          </Fragment>
        ))}
      </div>
      {showArrowButtons && arrowRow('down')}
    </div>
  );
}
