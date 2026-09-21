import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
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
  /** Value is shown but not editable. */
  readOnly?: boolean;
  /**
   * Invalid by the host's own rules — required, too wide, overlapping
   * something the package cannot see. Sits alongside the field's own parse
   * check; either one marks the field.
   */
  invalid?: boolean;
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

/**
 * Where the caret belongs in `masked` for someone who was standing behind the
 * `digits`th digit of what they typed. Counting digits rather than characters
 * is what survives the separators the mask inserts and removes.
 */
function caretAfterDigit(masked: string, digits: number): number {
  if (digits <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < masked.length; i++) {
    if (/\d/.test(masked[i]!) && ++seen === digits) return i + 1;
  }
  return masked.length;
}

/** A single text field that parses its value into a Date on blur / Enter. */
export function DateInputField({
  value, parsing, onCommit, onFocus,
  placeholder, label, disabled, readOnly, invalid: invalidProp, validate, applyMissingTime, sideSlot, classNames,
}: DateInputFieldProps) {
  const [text, setText] = useState<string>(parsing.format(value));
  const [unparseable, setUnparseable] = useState(false);
  const invalid = unparseable || Boolean(invalidProp);

  // Tracks focus so an external `value` change does not overwrite text the
  // user is currently typing.
  const focused = useRef(false);
  // The same fact again, as state this time, because the label has to re-render
  // when it changes. It cannot replace the ref: the effect below has to read
  // focus without listing it as a dependency, or blurring an unparseable value
  // would re-run the effect and reformat away the text the field is marking
  // invalid.
  const [hasFocus, setHasFocus] = useState(false);

  // The mask rewrites the value under the caret, and a controlled input drops
  // the caret to the end on every such rewrite. These two put it back, and only
  // for an edit the user made — an external `value` change leaves them alone.
  const inputRef = useRef<HTMLInputElement>(null);
  const caretAfterEdit = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (caretAfterEdit.current === null) return;
    inputRef.current?.setSelectionRange(caretAfterEdit.current, caretAfterEdit.current);
    caretAfterEdit.current = null;
  }, [text]);

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
    setUnparseable(false);
  }, [value, parsing]);

  const commit = () => {
    if (!text.trim()) {
      setUnparseable(false);
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
        setUnparseable(true);
      } else {
        setUnparseable(false);
        onCommit(date);
      }
    } else {
      setUnparseable(true);
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
        ref={inputRef}
        type="text"
        // A date field must never offer the browser's saved-input list: it
        // drops over the calendar this same field has just opened. Not a prop,
        // because there is no case where a host wants it — and no way for one
        // to reach the element anyway.
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={text}
        // A resting label already sits where the placeholder would print, so
        // the placeholder waits until the label has floated out of its way.
        placeholder={label === undefined || floating ? placeholder : undefined}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid}
        className={className}
        // Masked rather than validated: a character the pattern could never
        // print is a keystroke that missed, and punctuating as the digits land
        // beats making someone type separators the field already knows about.
        // Parse still runs on commit — a well-formed-looking `99-99-2026` gets
        // through here and is caught there.
        onChange={(e) => {
          const typed = e.target.value;
          const caret = e.target.selectionStart ?? typed.length;
          const digitsBehindCaret = typed.slice(0, caret).replace(/\D/g, '').length;
          const masked = parsing.mask(typed);
          caretAfterEdit.current = caretAfterDigit(masked, digitsBehindCaret);
          setText(masked);
        }}
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
