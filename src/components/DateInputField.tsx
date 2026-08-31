import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { ClassNames, Slot } from '../types';
import type { DateParsing } from '../hooks/useDateParsing';
import { mergeSlot } from '../utils/mergeClassNames';

export interface DateInputFieldProps {
  value: Date | null;
  parsing: DateParsing;
  onCommit: (date: Date | null) => void;
  onFocus: () => void;
  placeholder?: string;
  /**
   * Caption for the field. Sits over the field like a placeholder while it is
   * empty and unfocused, and floats up onto the top border once there is
   * something to caption — the shape a Material UI outlined field draws.
   */
  label?: string;
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
  placeholder, label, disabled, validate, applyMissingTime, sideSlot, classNames,
}: DateInputFieldProps) {
  const [text, setText] = useState<string>(parsing.format(value));
  const [invalid, setInvalid] = useState(false);

  // Tracks focus so an external `value` change does not overwrite text the
  // user is currently typing.
  const focused = useRef(false);
  // The same fact again, as state this time, because the label has to re-render
  // when it changes. It cannot replace the ref: the effect below has to read
  // focus without listing it as a dependency, or blurring an unparseable value
  // would re-run the effect and reformat away the text the field is marking
  // invalid.
  const [hasFocus, setHasFocus] = useState(false);

  const inputId = useId();
  // Floated whenever there is something to caption — focus, or text already in
  // the field. Resting, it stands where the placeholder would, so the two
  // cannot occupy the same spot.
  const floating = hasFocus || text !== '';

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
    <div className={mergeSlot('inputRoot', classNames)}>
      {label !== undefined && (
        <label
          htmlFor={inputId}
          className={mergeSlot(
            'inputLabel',
            classNames,
            floating && mergeSlot('inputLabelFloating', classNames),
          )}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="text"
        value={text}
        // A resting label already sits where the placeholder would print, so
        // the placeholder waits until the label has floated out of its way.
        placeholder={label === undefined || floating ? placeholder : undefined}
        disabled={disabled}
        aria-invalid={invalid}
        className={className}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => {
          focused.current = true;
          setHasFocus(true);
          onFocus();
        }}
        onBlur={() => {
          focused.current = false;
          setHasFocus(false);
          commit();
        }}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
