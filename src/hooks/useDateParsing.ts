import { useCallback } from 'react';
import { format as dfFormat, parse as dfParse, isValid } from 'date-fns';
import type { Locale } from 'date-fns';
import type { TimePrecision } from '../types';

const DEFAULT_DATE_PATTERN = 'yyyy-MM-dd';
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
  /** date-fns pattern for the date half of a field. Defaults to `yyyy-MM-dd`. */
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

  return { format, parse };
}
