import { useCallback } from 'react';
import { format as dfFormat, parse as dfParse, isValid } from 'date-fns';
import type { Locale } from 'date-fns';

const DEFAULT_FORMAT = 'yyyy-MM-dd';

export interface UseDateParsingOptions {
  formatDate?: (date: Date, locale?: Locale) => string;
  parseDate?: (str: string, locale?: Locale) => Date | null;
  locale?: Locale;
}

export interface DateParsing {
  format: (date: Date | null) => string;
  parse: (str: string) => Date | null;
}

/** Provides `format` (Date -> string) and `parse` (string -> Date|null). */
export function useDateParsing(opts: UseDateParsingOptions): DateParsing {
  const { formatDate, parseDate, locale } = opts;

  const format = useCallback(
    (date: Date | null): string => {
      if (!date) return '';
      if (formatDate) return formatDate(date, locale);
      return dfFormat(date, DEFAULT_FORMAT, { locale });
    },
    [formatDate, locale],
  );

  const parse = useCallback(
    (str: string): Date | null => {
      if (!str.trim()) return null;
      if (parseDate) return parseDate(str, locale);
      const parsed = dfParse(str, DEFAULT_FORMAT, new Date(), { locale });
      return isValid(parsed) ? parsed : null;
    },
    [parseDate, locale],
  );

  return { format, parse };
}
