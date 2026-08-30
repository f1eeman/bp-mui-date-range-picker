import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { ClassNames, Slot } from '../types';
import type { DateParsing } from '../hooks/useDateParsing';
import { mergeSlot } from '../utils/mergeClassNames';

export interface DateInputFieldProps {
  value: Date | null;
  parsing: DateParsing;
  onCommit: (date: Date | null) => void;
  onFocus: () => void;
  placeholder?: string;
  disabled?: boolean;
  /** Optional gate: a parsed date for which this returns false is treated as invalid and not committed. */
  validate?: (date: Date) => boolean;
  /**
   * Supplies the clock for a value the user typed as a bare date, under a
   * `timePrecision` whose pattern has one. Without it, moving the day by hand
   * would silently reset a time set on the time picker back to midnight.
   */
  applyMissingTime?: (date: Date) => Date;
  /** Extra slot applied alongside `input`: 'inputStart' or 'inputEnd'. */
  sideSlot?: Extract<Slot, 'inputStart' | 'inputEnd'>;
  classNames?: ClassNames;
}

/** A single text field that parses its value into a Date on blur / Enter. */
export function DateInputField({
  value, parsing, onCommit, onFocus,
  placeholder, disabled, validate, applyMissingTime, sideSlot, classNames,
}: DateInputFieldProps) {
  const [text, setText] = useState<string>(parsing.format(value));
  const [invalid, setInvalid] = useState(false);

  // Tracks focus so an external `value` change does not overwrite text the
  // user is currently typing.
  const focused = useRef(false);

  // Keep the text in sync when `value` changes from outside (calendar, presets) —
  // but never while the field is focused, so user typing is not clobbered.
  useEffect(() => {
    if (focused.current) return;
    setText(parsing.format(value));
    setInvalid(false);
  }, [value, parsing]);

  const commit = () => {
    if (!text.trim()) {
      setInvalid(false);
      onCommit(null);
      return;
    }
    const parsed = parsing.parse(text);
    if (parsed) {
      // Settle the clock before validating: applyMissingTime can push a value
      // across maxDate — 23:59 on the last allowed day is the case that bites —
      // so the gate has to see the date that will actually be committed.
      const date =
        parsed.hasTime || !applyMissingTime ? parsed.date : applyMissingTime(parsed.date);
      if (validate && !validate(date)) {
        setInvalid(true);
      } else {
        setInvalid(false);
        onCommit(date);
      }
    } else {
      setInvalid(true);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
  };

  const className = mergeSlot(
    'input',
    classNames,
    sideSlot && mergeSlot(sideSlot, classNames),
    invalid && mergeSlot('inputInvalid', classNames),
  );

  return (
    <input
      type="text"
      value={text}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={invalid}
      className={className}
      onChange={(e) => setText(e.target.value)}
      onFocus={() => {
        focused.current = true;
        onFocus();
      }}
      onBlur={() => {
        focused.current = false;
        commit();
      }}
      onKeyDown={handleKeyDown}
    />
  );
}
