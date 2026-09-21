import { useCallback, useMemo } from 'react';
import { format as dfFormat, parse as dfParse, isValid } from 'date-fns';
import type { Locale } from 'date-fns';
import type { TimePrecision } from '../types';

/**
 * Day first, because the fields are read by people rather than by machines —
 * `yyyy-MM-dd` is the shape a wire format takes, and a host that wants it on
 * screen names it through `datePattern`.
 */
const DEFAULT_DATE_PATTERN = 'dd-MM-yyyy';
const TIME_PATTERN: Record<TimePrecision, string> = {
  minute: 'HH:mm',
  second: 'HH:mm:ss',
};

/**
 * The text pattern for a given precision: the host's date pattern, with the
 * clock hung off the end of it when there is one. The date half is the only
 * half a host names — the time fields are numeric hh/mm/ss controls, so a
 * 12-hour text pattern would read a clock the picker beside it cannot set.
 */
function patternFor(datePattern: string, precision?: TimePrecision): string {
  return precision ? `${datePattern} ${TIME_PATTERN[precision]}` : datePattern;
}

/**
 * The patterns `parse` tries, widest first, paired with whether a match means
 * the string named a clock.
 *
 * At second precision `14:30` is a clock the user under-specified, not a typo,
 * so the minute pattern sits between the full one and the date-only fallback.
 */
function patternLadder(
  datePattern: string,
  precision?: TimePrecision,
): [pattern: string, hasTime: boolean][] {
  if (precision === 'second') {
    return [
      [patternFor(datePattern, 'second'), true],
      [patternFor(datePattern, 'minute'), true],
      [datePattern, false],
    ];
  }
  if (precision === 'minute') {
    return [[patternFor(datePattern, 'minute'), true], [datePattern, false]];
  }
  return [[datePattern, false]];
}

export interface UseDateParsingOptions {
  formatDate?: (date: Date, locale?: Locale) => string;
  parseDate?: (str: string, locale?: Locale) => Date | null;
  /** date-fns pattern for the date half of a field. Defaults to `dd-MM-yyyy`. */
  datePattern?: string;
  locale?: Locale;
  timePrecision?: TimePrecision;
}

/** A successfully parsed field value. */
export interface ParsedDate {
  date: Date;
  /**
   * Whether the string named a clock of its own. When it did not, the caller
   * keeps the time already on that boundary instead of resetting it to
   * midnight — see `carryTime`.
   */
  hasTime: boolean;
}

export interface DateParsing {
  format: (date: Date | null) => string;
  parse: (str: string) => ParsedDate | null;
  /**
   * Drops characters the pattern in force could never print, so a field can
   * refuse letters as they are typed rather than only marking itself invalid
   * once the value is committed.
   *
   * Returns the string untouched whenever the alphabet cannot be known: a host
   * that brought its own `parseDate` owns its format end to end, and a pattern
   * that prints words (`dd MMM yyyy`) needs the very letters this would strip.
   */
  sanitize: (str: string) => string;
  /**
   * Lays the digits of a string out along the pattern, punctuating as it goes:
   * under `dd-MM-yyyy`, `21092026` becomes `21-09-2026`. Digits past the last
   * group are dropped, so a field cannot outgrow its pattern.
   *
   * Falls back to `sanitize` whenever the shape cannot be known — the same two
   * cases, a host's own `parseDate` and a pattern that prints words.
   */
  mask: (str: string) => string;
}

/**
 * A date with no repeated numeric field, so formatting it shows the shape of a
 * pattern without parsing the pattern's tokens: the runs of digits are the
 * groups, and what sits between them are the separators.
 */
const SAMPLE_DATE = new Date(2026, 10, 22, 3, 4, 5);

/** Group widths and the separators between them, read off a formatted sample. */
interface PatternShape {
  groups: number[];
  separators: string[];
  /** Every non-digit the pattern can print, for `sanitize`. */
  allowed: Set<string>;
}

function shapeOf(sample: string): PatternShape | null {
  // A pattern that prints words needs the letters a mask would eat, and its
  // groups are not digit runs to begin with.
  if (/\p{L}/u.test(sample)) return null;
  const groups: number[] = [];
  const separators: string[] = [];
  for (const [chunk] of sample.matchAll(/\d+|\D+/g)) {
    if (/\d/.test(chunk)) groups.push(chunk.length);
    else separators.push(chunk);
  }
  return { groups, separators, allowed: new Set(sample.replace(/\d/g, '')) };
}

/** Provides `format` (Date -> string) and `parse` (string -> ParsedDate|null). */
export function useDateParsing(opts: UseDateParsingOptions): DateParsing {
  const {
    formatDate,
    parseDate,
    locale,
    timePrecision,
    datePattern = DEFAULT_DATE_PATTERN,
  } = opts;

  const format = useCallback(
    (date: Date | null): string => {
      if (!date) return '';
      if (formatDate) return formatDate(date, locale);
      return dfFormat(date, patternFor(datePattern, timePrecision), { locale });
    },
    [formatDate, locale, timePrecision, datePattern],
  );

  const parse = useCallback(
    (str: string): ParsedDate | null => {
      if (!str.trim()) return null;
      // A host that brings its own parser owns its format end to end, including
      // whether the result carries a time. Re-deriving that here would overwrite
      // a clock it meant to set.
      if (parseDate) {
        const custom = parseDate(str, locale);
        return custom ? { date: custom, hasTime: true } : null;
      }
      for (const [pattern, hasTime] of patternLadder(datePattern, timePrecision)) {
        const parsed = dfParse(str, pattern, new Date(), { locale });
        if (isValid(parsed)) return { date: parsed, hasTime };
      }
      return null;
    },
    [parseDate, locale, timePrecision, datePattern],
  );

  // A custom parser accepts whatever it likes, so neither filtering nor
  // masking can second-guess it.
  const shape = useMemo(
    () => (parseDate ? null : shapeOf(format(SAMPLE_DATE))),
    [parseDate, format],
  );

  const sanitize = useCallback(
    (str: string): string =>
      shape
        ? [...str].filter((ch) => /\d/.test(ch) || shape.allowed.has(ch)).join('')
        : str,
    [shape],
  );

  const mask = useCallback(
    (str: string): string => {
      if (!shape) return str;
      const digits = str.replace(/\D/g, '');
      let out = '';
      let taken = 0;
      for (let g = 0; g < shape.groups.length && taken < digits.length; g++) {
        // Punctuation goes in ahead of the group it precedes, never after the
        // last digit typed — otherwise deleting backwards would fight a
        // separator the field keeps putting back.
        if (g > 0) out += shape.separators[g - 1] ?? '';
        out += digits.slice(taken, taken + shape.groups[g]);
        taken += shape.groups[g];
      }
      return out;
    },
    [shape],
  );

  return { format, parse, sanitize, mask };
}
