# DateRangeInput Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `bp-mui-date-range-picker` — a React 19 `DateRangeInput` component (Blueprint-style API, no `@blueprintjs` dependency) with slot-based Tailwind styling.

**Architecture:** A single source-of-truth hook (`useDateRangeInput`) holds the `[start, end]` state and feeds three input surfaces: two text fields, a `react-day-picker` calendar, and a shortcuts panel. Pure date logic lives in `utils/`. Styling is a `classNames` slot map merged with library defaults via `tailwind-merge`.

**Tech Stack:** TypeScript, React 19, `react-day-picker` v9, `date-fns` v4, `@floating-ui/react`, `clsx`, `tailwind-merge`. Build: `tsup`. Tests: Vitest + React Testing Library. Playground: Vite.

---

## File Structure

```
package.json                    — deps, scripts
tsconfig.json                   — TS config
tsup.config.ts                  — build config
vitest.config.ts                — test config
test/setup.ts                   — RTL/jest-dom setup
src/
  index.ts                      — public exports
  types.ts                      — DateRange, Slot, props types
  DateRangeInput.tsx             — main composition component
  components/
    Popover.tsx                  — floating-ui popover
    RangeCalendar.tsx            — react-day-picker wrapper
    DateInputField.tsx           — single text field
    ShortcutsPanel.tsx           — presets sidebar
    TimePicker.tsx               — hours/minutes editor
  hooks/
    useDateRangeInput.ts         — state machine
    useDateParsing.ts            — text <-> Date
  utils/
    dateRange.ts                 — pure date logic
    shortcuts.ts                 — default presets
    mergeClassNames.ts           — slot class merging
  styles/
    defaultClassNames.ts         — default Tailwind classes per slot
playground/
  index.html
  main.tsx
  App.tsx
  styles.css
  vite.config.ts
```

**Note on hover-preview:** The spec mentions range hover-preview. `react-day-picker` v9 renders in-calendar hover preview natively in `mode="range"`, so no extra hook state is needed — this requirement is satisfied by `RangeCalendar` (Task 9).

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `test/setup.ts`, `.gitignore`

- [ ] **Step 1: Replace `package.json`**

```json
{
  "name": "bp-mui-date-range-picker",
  "version": "1.0.0",
  "description": "Blueprint-style date range input for React with slot-based Tailwind styling",
  "license": "MIT",
  "author": "f1eeman <mr.f1eeman@gmail.com>",
  "repository": "https://github.com/f1eeman/bp-mui-date-range-picker.git",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "dev": "vite --config playground/vite.config.ts"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "@floating-ui/react": "^0.27.0",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "react-day-picker": "^9.5.0",
    "tailwind-merge": "^3.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.6.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^26.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "tsup": "^8.3.5",
    "typescript": "^5.7.3",
    "vite": "^6.1.0",
    "vitest": "^3.0.5"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src", "test", "playground"]
}
```

- [ ] **Step 3: Create `tsup.config.ts`**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom'],
});
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
});
```

- [ ] **Step 5: Create `test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules
dist
*.log
.idea
```

- [ ] **Step 7: Install dependencies and verify**

Run: `npm install`
Expected: completes without errors, `node_modules` populated.

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json tsup.config.ts vitest.config.ts test/setup.ts .gitignore
git commit -m "chore: project scaffolding"
```

---

## Task 2: Public types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create `src/types.ts`**

```ts
import type { Locale } from 'date-fns';
import type { Matcher } from 'react-day-picker';

/** A range as a tuple. Either or both ends may be null (unset). */
export type DateRange = [Date | null, Date | null];

/** Which end of the range an interaction targets. */
export type Boundary = 'start' | 'end';

/** A named preset shown in the shortcuts panel. Both ends are concrete. */
export interface Shortcut {
  label: string;
  range: [Date, Date];
}

/** Every styleable element and state modifier of the component. */
export type Slot =
  | 'root' | 'inputGroup' | 'input' | 'inputStart' | 'inputEnd'
  | 'inputInvalid' | 'separator'
  | 'popover' | 'panel'
  | 'shortcutsPanel' | 'shortcut' | 'shortcutActive'
  | 'calendar' | 'month' | 'caption' | 'nav' | 'navButton'
  | 'weekday' | 'week' | 'day'
  | 'daySelected' | 'dayRangeStart' | 'dayRangeEnd' | 'dayRangeMiddle'
  | 'dayToday' | 'dayDisabled' | 'dayOutside'
  | 'timePicker' | 'timePickerInput';

/** Slot -> Tailwind class string overrides. */
export type ClassNames = Partial<Record<Slot, string>>;

/** Props for the top-level DateRangeInput component. */
export interface DateRangeInputProps {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;

  formatDate?: (date: Date, locale?: Locale) => string;
  parseDate?: (str: string, locale?: Locale) => Date | null;
  locale?: Locale;

  minDate?: Date;
  maxDate?: Date;
  disabledDays?: Matcher | Matcher[];
  allowSingleDayRange?: boolean;

  contiguousCalendarMonths?: boolean;
  shortcuts?: boolean | Shortcut[];
  timePrecision?: 'minute' | 'second';
  closeOnSelection?: boolean;

  disabled?: boolean;
  placeholder?: { start?: string; end?: string };

  classNames?: ClassNames;
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: public types"
```

---

## Task 3: Pure date logic (`utils/dateRange.ts`)

**Files:**
- Create: `src/utils/dateRange.ts`
- Test: `src/utils/dateRange.test.ts`

- [ ] **Step 1: Write the failing test**

`src/utils/dateRange.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isWithinBounds, swapIfNeeded, isSingleDay } from './dateRange';

describe('isWithinBounds', () => {
  it('returns true with no bounds', () => {
    expect(isWithinBounds(new Date(2026, 0, 15))).toBe(true);
  });
  it('rejects a date before minDate', () => {
    expect(isWithinBounds(new Date(2026, 0, 1), new Date(2026, 0, 10))).toBe(false);
  });
  it('rejects a date after maxDate', () => {
    expect(isWithinBounds(new Date(2026, 0, 20), undefined, new Date(2026, 0, 10))).toBe(false);
  });
  it('accepts a date equal to a bound (same day)', () => {
    const d = new Date(2026, 0, 10, 14, 0);
    expect(isWithinBounds(d, new Date(2026, 0, 10), new Date(2026, 0, 10))).toBe(true);
  });
});

describe('swapIfNeeded', () => {
  it('swaps when start is after end', () => {
    const a = new Date(2026, 0, 20);
    const b = new Date(2026, 0, 10);
    expect(swapIfNeeded([a, b])).toEqual([b, a]);
  });
  it('leaves an ordered range untouched', () => {
    const a = new Date(2026, 0, 10);
    const b = new Date(2026, 0, 20);
    expect(swapIfNeeded([a, b])).toEqual([a, b]);
  });
  it('leaves a range with a null end untouched', () => {
    const a = new Date(2026, 0, 10);
    expect(swapIfNeeded([a, null])).toEqual([a, null]);
  });
});

describe('isSingleDay', () => {
  it('is true when both ends fall on the same day', () => {
    expect(isSingleDay([new Date(2026, 0, 10, 9), new Date(2026, 0, 10, 18)])).toBe(true);
  });
  it('is false for different days', () => {
    expect(isSingleDay([new Date(2026, 0, 10), new Date(2026, 0, 11)])).toBe(false);
  });
  it('is false when an end is null', () => {
    expect(isSingleDay([new Date(2026, 0, 10), null])).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/dateRange.test.ts`
Expected: FAIL — `Failed to resolve import "./dateRange"`.

- [ ] **Step 3: Write the implementation**

`src/utils/dateRange.ts`:

```ts
import { isAfter, isBefore, isSameDay } from 'date-fns';
import type { DateRange } from '../types';

/** True when `date` is inside [minDate, maxDate]; bounds are day-inclusive. */
export function isWithinBounds(date: Date, minDate?: Date, maxDate?: Date): boolean {
  if (minDate && isBefore(date, minDate) && !isSameDay(date, minDate)) return false;
  if (maxDate && isAfter(date, maxDate) && !isSameDay(date, maxDate)) return false;
  return true;
}

/** Returns the range with ends ordered start <= end. */
export function swapIfNeeded(range: DateRange): DateRange {
  const [start, end] = range;
  if (start && end && isAfter(start, end)) return [end, start];
  return range;
}

/** True when both ends are set and fall on the same calendar day. */
export function isSingleDay(range: DateRange): boolean {
  const [start, end] = range;
  return !!start && !!end && isSameDay(start, end);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/dateRange.test.ts`
Expected: PASS — all 10 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/dateRange.ts src/utils/dateRange.test.ts
git commit -m "feat: pure date-range logic"
```

---

## Task 4: Default shortcuts (`utils/shortcuts.ts`)

**Files:**
- Create: `src/utils/shortcuts.ts`
- Test: `src/utils/shortcuts.test.ts`

- [ ] **Step 1: Write the failing test**

`src/utils/shortcuts.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createDefaultShortcuts } from './shortcuts';

describe('createDefaultShortcuts', () => {
  const now = new Date(2026, 4, 20, 12, 0); // 2026-05-20

  it('produces five labelled presets', () => {
    const result = createDefaultShortcuts(now);
    expect(result.map((s) => s.label)).toEqual([
      'Today', 'Last 7 days', 'Last 30 days', 'This week', 'This month',
    ]);
  });

  it('"Last 7 days" starts six days before today', () => {
    const last7 = createDefaultShortcuts(now).find((s) => s.label === 'Last 7 days')!;
    expect(last7.range[0]).toEqual(new Date(2026, 4, 14));
  });

  it('"This month" spans the full month', () => {
    const month = createDefaultShortcuts(now).find((s) => s.label === 'This month')!;
    expect(month.range[0]).toEqual(new Date(2026, 4, 1));
    expect(month.range[1]?.getDate()).toBe(31);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/shortcuts.test.ts`
Expected: FAIL — cannot resolve `./shortcuts`.

- [ ] **Step 3: Write the implementation**

`src/utils/shortcuts.ts`:

```ts
import {
  startOfDay, endOfDay, subDays,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
} from 'date-fns';
import type { Shortcut } from '../types';

/** Builds the built-in preset list, relative to `now`. */
export function createDefaultShortcuts(now: Date = new Date()): Shortcut[] {
  const today = startOfDay(now);
  const todayEnd = endOfDay(now);
  return [
    { label: 'Today', range: [today, todayEnd] },
    { label: 'Last 7 days', range: [subDays(today, 6), todayEnd] },
    { label: 'Last 30 days', range: [subDays(today, 29), todayEnd] },
    { label: 'This week', range: [startOfWeek(now), endOfWeek(now)] },
    { label: 'This month', range: [startOfMonth(now), endOfMonth(now)] },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/shortcuts.test.ts`
Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/shortcuts.ts src/utils/shortcuts.test.ts
git commit -m "feat: default shortcuts"
```

---

## Task 5: Default styles and class merging

**Files:**
- Create: `src/styles/defaultClassNames.ts`, `src/utils/mergeClassNames.ts`
- Test: `src/utils/mergeClassNames.test.ts`

- [ ] **Step 1: Create `src/styles/defaultClassNames.ts`**

```ts
import type { Slot } from '../types';

/** Default Tailwind classes for every slot. The component's out-of-the-box look. */
export const defaultClassNames: Record<Slot, string> = {
  root: 'relative inline-flex flex-col',
  inputGroup: 'inline-flex items-center gap-2',
  input:
    'h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 ' +
    'outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200',
  inputStart: '',
  inputEnd: '',
  inputInvalid: 'border-red-500 focus:border-red-500 focus:ring-red-200',
  separator: 'text-zinc-400',
  popover: 'z-50 mt-1 rounded-lg border border-zinc-200 bg-white shadow-lg',
  panel: 'flex',
  shortcutsPanel: 'flex w-40 flex-col gap-1 border-r border-zinc-200 p-2',
  shortcut: 'rounded px-2 py-1 text-left text-sm text-zinc-700 hover:bg-zinc-100',
  shortcutActive: 'bg-indigo-50 font-medium text-indigo-700',
  calendar: 'p-3',
  month: 'space-y-2',
  caption: 'text-sm font-medium text-zinc-900',
  nav: 'flex items-center justify-between',
  navButton: 'inline-flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-100',
  weekday: 'text-xs font-normal text-zinc-400',
  week: '',
  day: 'h-9 w-9 rounded text-sm text-zinc-700 hover:bg-zinc-100',
  daySelected: 'bg-indigo-600 text-white hover:bg-indigo-600',
  dayRangeStart: 'bg-indigo-600 text-white',
  dayRangeEnd: 'bg-indigo-600 text-white',
  dayRangeMiddle: 'bg-indigo-100 text-indigo-900',
  dayToday: 'font-semibold text-indigo-600',
  dayDisabled: 'text-zinc-300 line-through',
  dayOutside: 'text-zinc-300',
  timePicker: 'flex items-center gap-1 border-t border-zinc-200 p-2',
  timePickerInput: 'h-8 w-12 rounded border border-zinc-300 text-center text-sm',
};
```

- [ ] **Step 2: Write the failing test**

`src/utils/mergeClassNames.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mergeSlot } from './mergeClassNames';

describe('mergeSlot', () => {
  it('returns the default class when no override is given', () => {
    expect(mergeSlot('separator')).toBe('text-zinc-400');
  });

  it('lets an override win a Tailwind conflict', () => {
    const result = mergeSlot('separator', { separator: 'text-red-500' });
    expect(result).toContain('text-red-500');
    expect(result).not.toContain('text-zinc-400');
  });

  it('appends extra conditional classes', () => {
    const result = mergeSlot('input', undefined, false, 'ring-2');
    expect(result).toContain('ring-2');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/utils/mergeClassNames.test.ts`
Expected: FAIL — cannot resolve `./mergeClassNames`.

- [ ] **Step 4: Write the implementation**

`src/utils/mergeClassNames.ts`:

```ts
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ClassNames, Slot } from '../types';
import { defaultClassNames } from '../styles/defaultClassNames';

/**
 * Resolves the final class string for a slot: default classes, then consumer
 * overrides, then any extra conditional classes. `tailwind-merge` ensures a
 * conflicting consumer class replaces the default instead of duplicating it.
 */
export function mergeSlot(
  slot: Slot,
  overrides?: ClassNames,
  ...extra: Array<string | false | undefined>
): string {
  return twMerge(clsx(defaultClassNames[slot], overrides?.[slot], ...extra));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/utils/mergeClassNames.test.ts`
Expected: PASS — all 3 tests green.

- [ ] **Step 6: Commit**

```bash
git add src/styles/defaultClassNames.ts src/utils/mergeClassNames.ts src/utils/mergeClassNames.test.ts
git commit -m "feat: default styles and slot class merging"
```

---

## Task 6: Text parsing hook (`useDateParsing`)

**Files:**
- Create: `src/hooks/useDateParsing.ts`
- Test: `src/hooks/useDateParsing.test.ts`

- [ ] **Step 1: Write the failing test**

`src/hooks/useDateParsing.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDateParsing } from './useDateParsing';

describe('useDateParsing', () => {
  it('formats a Date with the default pattern', () => {
    const { result } = renderHook(() => useDateParsing({}));
    expect(result.current.format(new Date(2026, 4, 20))).toBe('2026-05-20');
  });

  it('formats null as an empty string', () => {
    const { result } = renderHook(() => useDateParsing({}));
    expect(result.current.format(null)).toBe('');
  });

  it('parses a valid string into a Date', () => {
    const { result } = renderHook(() => useDateParsing({}));
    const parsed = result.current.parse('2026-05-20');
    expect(parsed).toEqual(new Date(2026, 4, 20));
  });

  it('returns null for an invalid string', () => {
    const { result } = renderHook(() => useDateParsing({}));
    expect(result.current.parse('not-a-date')).toBeNull();
  });

  it('returns null for an empty string', () => {
    const { result } = renderHook(() => useDateParsing({}));
    expect(result.current.parse('   ')).toBeNull();
  });

  it('uses a custom formatDate when provided', () => {
    const { result } = renderHook(() =>
      useDateParsing({ formatDate: () => 'CUSTOM' }),
    );
    expect(result.current.format(new Date())).toBe('CUSTOM');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useDateParsing.test.ts`
Expected: FAIL — cannot resolve `./useDateParsing`.

- [ ] **Step 3: Write the implementation**

`src/hooks/useDateParsing.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useDateParsing.test.ts`
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDateParsing.ts src/hooks/useDateParsing.test.ts
git commit -m "feat: text parsing hook"
```

---

## Task 7: State machine hook (`useDateRangeInput`)

**Files:**
- Create: `src/hooks/useDateRangeInput.ts`
- Test: `src/hooks/useDateRangeInput.test.ts`

- [ ] **Step 1: Write the failing test**

`src/hooks/useDateRangeInput.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDateRangeInput } from './useDateRangeInput';

const d = (day: number) => new Date(2026, 4, day);

describe('useDateRangeInput', () => {
  it('starts empty when no value is given', () => {
    const { result } = renderHook(() => useDateRangeInput({}));
    expect(result.current.range).toEqual([null, null]);
    expect(result.current.focusedBoundary).toBe('start');
  });

  it('initialises from defaultValue (uncontrolled)', () => {
    const { result } = renderHook(() =>
      useDateRangeInput({ defaultValue: [d(10), d(20)] }),
    );
    expect(result.current.range).toEqual([d(10), d(20)]);
  });

  it('updates internal state and calls onChange when uncontrolled', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDateRangeInput({ onChange }));
    act(() => result.current.setBoundary('start', d(10)));
    expect(result.current.range).toEqual([d(10), null]);
    expect(onChange).toHaveBeenCalledWith([d(10), null]);
  });

  it('does not mutate internal state when controlled', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDateRangeInput({ value: [d(10), d(20)], onChange }),
    );
    act(() => result.current.setBoundary('end', d(25)));
    expect(result.current.range).toEqual([d(10), d(20)]); // value prop unchanged
    expect(onChange).toHaveBeenCalledWith([d(10), d(25)]);
  });

  it('swaps ends so the committed range is ordered', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDateRangeInput({ onChange }));
    act(() => result.current.setRange([d(20), d(10)]));
    expect(result.current.range).toEqual([d(10), d(20)]);
  });

  it('tracks the focused boundary', () => {
    const { result } = renderHook(() => useDateRangeInput({}));
    act(() => result.current.setFocusedBoundary('end'));
    expect(result.current.focusedBoundary).toBe('end');
  });

  it('rejects a both-ends-set single-day range by default', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDateRangeInput({ onChange }));
    act(() => result.current.setRange([d(10), d(10)]));
    expect(result.current.range).toEqual([null, null]); // commit rejected
    expect(onChange).not.toHaveBeenCalled();
  });

  it('allows a single-day range when allowSingleDayRange is set', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDateRangeInput({ onChange, allowSingleDayRange: true }),
    );
    act(() => result.current.setRange([d(10), d(10)]));
    expect(result.current.range).toEqual([d(10), d(10)]);
    expect(onChange).toHaveBeenCalledWith([d(10), d(10)]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useDateRangeInput.test.ts`
Expected: FAIL — cannot resolve `./useDateRangeInput`.

- [ ] **Step 3: Write the implementation**

`src/hooks/useDateRangeInput.ts`:

```ts
import { useCallback, useState } from 'react';
import type { Boundary, DateRange } from '../types';
import { isSingleDay, swapIfNeeded } from '../utils/dateRange';

export interface UseDateRangeInputOptions {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;
  /** When false (default), a both-ends-set single-day range is not committed. */
  allowSingleDayRange?: boolean;
}

export interface DateRangeInputState {
  range: DateRange;
  focusedBoundary: Boundary;
  setFocusedBoundary: (b: Boundary) => void;
  setBoundary: (b: Boundary, date: Date | null) => void;
  setRange: (range: DateRange) => void;
}

/**
 * Single source of truth for the range value. Supports controlled (`value` +
 * `onChange`) and uncontrolled (`defaultValue`) modes. Every committed range is
 * ordered start <= end.
 */
export function useDateRangeInput(opts: UseDateRangeInputOptions): DateRangeInputState {
  const { value, defaultValue, onChange, allowSingleDayRange } = opts;
  const isControlled = value !== undefined;

  const [internal, setInternal] = useState<DateRange>(defaultValue ?? [null, null]);
  const [focusedBoundary, setFocusedBoundary] = useState<Boundary>('start');

  const range: DateRange = isControlled ? value! : internal;

  const commit = useCallback(
    (next: DateRange) => {
      const ordered = swapIfNeeded(next);
      // Reject a both-ends-set single-day range unless explicitly allowed.
      if (!allowSingleDayRange && isSingleDay(ordered)) return;
      if (!isControlled) setInternal(ordered);
      onChange?.(ordered);
    },
    [isControlled, onChange, allowSingleDayRange],
  );

  const setRange = useCallback((next: DateRange) => commit(next), [commit]);

  const setBoundary = useCallback(
    (b: Boundary, date: Date | null) => {
      const next: DateRange =
        b === 'start' ? [date, range[1]] : [range[0], date];
      commit(next);
    },
    [range, commit],
  );

  return { range, focusedBoundary, setFocusedBoundary, setBoundary, setRange };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useDateRangeInput.test.ts`
Expected: PASS — all 8 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDateRangeInput.ts src/hooks/useDateRangeInput.test.ts
git commit -m "feat: date-range state machine hook"
```

---

## Task 8: Popover component

**Files:**
- Create: `src/components/Popover.tsx`
- Test: `src/components/Popover.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/Popover.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Popover } from './Popover';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={<button>open</button>}
    >
      <div>panel content</div>
    </Popover>
  );
}

describe('Popover', () => {
  it('hides content until the trigger is clicked', async () => {
    render(<Harness />);
    expect(screen.queryByText('panel content')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('open'));
    expect(screen.getByText('panel content')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByText('open'));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('panel content')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Popover.test.tsx`
Expected: FAIL — cannot resolve `./Popover`.

- [ ] **Step 3: Write the implementation**

`src/components/Popover.tsx`:

```tsx
import { cloneElement, type ReactElement, type ReactNode } from 'react';
import {
  useFloating, autoUpdate, offset, flip, shift,
  useClick, useDismiss, useRole, useInteractions,
  FloatingPortal, FloatingFocusManager,
} from '@floating-ui/react';

export interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactElement;
  children: ReactNode;
  className?: string;
}

/** Anchored, dismissible popover built on floating-ui. */
export function Popover({ open, onOpenChange, trigger, children, className }: PopoverProps) {
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  return (
    <>
      {cloneElement(
        trigger,
        getReferenceProps({ ref: refs.setReference, ...trigger.props }),
      )}
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className={className}
              {...getFloatingProps()}
            >
              {children}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Popover.test.tsx`
Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/Popover.tsx src/components/Popover.test.tsx
git commit -m "feat: popover component"
```

---

## Task 9: RangeCalendar component

**Files:**
- Create: `src/components/RangeCalendar.tsx`
- Test: `src/components/RangeCalendar.test.tsx`

**Notes:** `react-day-picker` v9 uses its own range type `{ from, to }`. This component converts between that and our `DateRange` tuple, maps our slots onto rdp's `classNames` keys, and renders one `DayPicker` (contiguous) or two (non-contiguous).

- [ ] **Step 1: Write the failing test**

`src/components/RangeCalendar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RangeCalendar } from './RangeCalendar';

describe('RangeCalendar', () => {
  it('renders a single grid when contiguous', () => {
    const { container } = render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        contiguous
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    expect(container.querySelectorAll('.rdp-root')).toHaveLength(1);
  });

  it('renders two grids when non-contiguous', () => {
    const { container } = render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        contiguous={false}
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    expect(container.querySelectorAll('.rdp-root')).toHaveLength(2);
  });

  it('calls onChange with a tuple when a day is clicked', async () => {
    const onChange = vi.fn();
    render(
      <RangeCalendar
        value={[null, null]}
        onChange={onChange}
        contiguous
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    await userEvent.click(screen.getByText('15'));
    expect(onChange).toHaveBeenCalled();
    const arg = onChange.mock.calls[0][0];
    expect(Array.isArray(arg)).toBe(true);
    expect(arg[0]).toEqual(new Date(2026, 4, 15));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/RangeCalendar.test.tsx`
Expected: FAIL — cannot resolve `./RangeCalendar`.

- [ ] **Step 3: Write the implementation**

`src/components/RangeCalendar.tsx`:

```tsx
import { useState } from 'react';
import { DayPicker, type DateRange as RdpRange, type Matcher } from 'react-day-picker';
import 'react-day-picker/style.css';
import type { Locale } from 'date-fns';
import { addMonths } from 'date-fns';
import type { ClassNames, DateRange } from '../types';
import { mergeSlot } from '../utils/mergeClassNames';

export interface RangeCalendarProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  contiguous: boolean;
  defaultMonth?: Date;
  minDate?: Date;
  maxDate?: Date;
  disabledDays?: Matcher | Matcher[];
  locale?: Locale;
  classNames?: ClassNames;
}

/** Converts our tuple into the rdp `{ from, to }` shape. */
function toRdpRange(range: DateRange): RdpRange | undefined {
  const [from, to] = range;
  if (!from) return undefined;
  return { from, to: to ?? undefined };
}

/** Converts an rdp range back into our tuple. */
function fromRdpRange(range: RdpRange | undefined): DateRange {
  if (!range?.from) return [null, null];
  return [range.from, range.to ?? null];
}

/** Maps our slot overrides onto react-day-picker's classNames keys. */
function rdpClassNames(classNames?: ClassNames): Record<string, string> {
  const navBtn = mergeSlot('navButton', classNames);
  return {
    root: mergeSlot('calendar', classNames) + ' rdp-root',
    month: mergeSlot('month', classNames),
    month_caption: mergeSlot('caption', classNames),
    nav: mergeSlot('nav', classNames),
    button_previous: navBtn,
    button_next: navBtn,
    weekday: mergeSlot('weekday', classNames),
    week: mergeSlot('week', classNames),
    day_button: mergeSlot('day', classNames),
    selected: mergeSlot('daySelected', classNames),
    range_start: mergeSlot('dayRangeStart', classNames),
    range_end: mergeSlot('dayRangeEnd', classNames),
    range_middle: mergeSlot('dayRangeMiddle', classNames),
    today: mergeSlot('dayToday', classNames),
    disabled: mergeSlot('dayDisabled', classNames),
    outside: mergeSlot('dayOutside', classNames),
  };
}

/** Builds the rdp `disabled` matcher list from bounds + custom matchers. */
function buildDisabled(
  minDate?: Date,
  maxDate?: Date,
  disabledDays?: Matcher | Matcher[],
): Matcher[] {
  const matchers: Matcher[] = [];
  if (minDate) matchers.push({ before: minDate });
  if (maxDate) matchers.push({ after: maxDate });
  if (Array.isArray(disabledDays)) matchers.push(...disabledDays);
  else if (disabledDays) matchers.push(disabledDays);
  return matchers;
}

/** A range calendar: one grid when contiguous, two independent grids otherwise. */
export function RangeCalendar({
  value, onChange, contiguous, defaultMonth,
  minDate, maxDate, disabledDays, locale, classNames,
}: RangeCalendarProps) {
  const baseMonth = defaultMonth ?? value[0] ?? new Date();
  const [leftMonth, setLeftMonth] = useState<Date>(baseMonth);
  const [rightMonth, setRightMonth] = useState<Date>(addMonths(baseMonth, 1));

  const shared = {
    mode: 'range' as const,
    selected: toRdpRange(value),
    onSelect: (range: RdpRange | undefined) => onChange(fromRdpRange(range)),
    disabled: buildDisabled(minDate, maxDate, disabledDays),
    locale,
    classNames: rdpClassNames(classNames),
  };

  if (contiguous) {
    return (
      <DayPicker
        {...shared}
        numberOfMonths={2}
        month={leftMonth}
        onMonthChange={setLeftMonth}
      />
    );
  }

  return (
    <div className="flex gap-2">
      <DayPicker {...shared} month={leftMonth} onMonthChange={setLeftMonth} />
      <DayPicker {...shared} month={rightMonth} onMonthChange={setRightMonth} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/RangeCalendar.test.tsx`
Expected: PASS — all 3 tests green.

If the `.rdp-root` count assertion fails, inspect the rendered DOM (`screen.debug()`) and adjust the selector to whatever class rdp v9 applies to its root element; the `root` class concatenation above forces `rdp-root` onto it deliberately.

- [ ] **Step 5: Commit**

```bash
git add src/components/RangeCalendar.tsx src/components/RangeCalendar.test.tsx
git commit -m "feat: range calendar with contiguous toggle"
```

---

## Task 10: DateInputField component

**Files:**
- Create: `src/components/DateInputField.tsx`
- Test: `src/components/DateInputField.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/DateInputField.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateInputField } from './DateInputField';
import { useDateParsing } from '../hooks/useDateParsing';

function Harness({ onCommit }: { onCommit: (d: Date | null) => void }) {
  const parsing = useDateParsing({});
  return (
    <DateInputField
      value={null}
      parsing={parsing}
      onCommit={onCommit}
      onFocus={() => {}}
      placeholder="start"
    />
  );
}

describe('DateInputField', () => {
  it('commits a parsed date on blur', async () => {
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '2026-05-20');
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledWith(new Date(2026, 4, 20));
  });

  it('marks the field invalid for an unparseable value', async () => {
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, 'garbage');
    await userEvent.tab();
    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('commits null when cleared', async () => {
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} />);
    const input = screen.getByPlaceholderText('start');
    await userEvent.type(input, '2026-05-20');
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onCommit).toHaveBeenLastCalledWith(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/DateInputField.test.tsx`
Expected: FAIL — cannot resolve `./DateInputField`.

- [ ] **Step 3: Write the implementation**

`src/components/DateInputField.tsx`:

```tsx
import { useEffect, useState, type KeyboardEvent } from 'react';
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
  /** Extra slot applied alongside `input`: 'inputStart' or 'inputEnd'. */
  sideSlot?: Extract<Slot, 'inputStart' | 'inputEnd'>;
  classNames?: ClassNames;
}

/** A single text field that parses its value into a Date on blur / Enter. */
export function DateInputField({
  value, parsing, onCommit, onFocus,
  placeholder, disabled, sideSlot, classNames,
}: DateInputFieldProps) {
  const [text, setText] = useState<string>(parsing.format(value));
  const [invalid, setInvalid] = useState(false);

  // Keep the text in sync when the value changes from outside (calendar, presets).
  useEffect(() => {
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
      setInvalid(false);
      onCommit(parsed);
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
      onFocus={onFocus}
      onBlur={commit}
      onKeyDown={handleKeyDown}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/DateInputField.test.tsx`
Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/DateInputField.tsx src/components/DateInputField.test.tsx
git commit -m "feat: date input field"
```

---

## Task 11: ShortcutsPanel component

**Files:**
- Create: `src/components/ShortcutsPanel.tsx`
- Test: `src/components/ShortcutsPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/ShortcutsPanel.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShortcutsPanel } from './ShortcutsPanel';
import type { Shortcut } from '../types';

const shortcuts: Shortcut[] = [
  { label: 'A', range: [new Date(2026, 4, 1), new Date(2026, 4, 7)] },
  { label: 'B', range: [new Date(2026, 4, 8), new Date(2026, 4, 14)] },
];

describe('ShortcutsPanel', () => {
  it('renders one button per shortcut', () => {
    render(<ShortcutsPanel shortcuts={shortcuts} value={[null, null]} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'B' })).toBeInTheDocument();
  });

  it('calls onSelect with the shortcut range when clicked', async () => {
    const onSelect = vi.fn();
    render(<ShortcutsPanel shortcuts={shortcuts} value={[null, null]} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onSelect).toHaveBeenCalledWith(shortcuts[1].range);
  });

  it('marks the active shortcut with aria-pressed', () => {
    render(
      <ShortcutsPanel shortcuts={shortcuts} value={shortcuts[0].range} onSelect={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'false');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ShortcutsPanel.test.tsx`
Expected: FAIL — cannot resolve `./ShortcutsPanel`.

- [ ] **Step 3: Write the implementation**

`src/components/ShortcutsPanel.tsx`:

```tsx
import { isSameDay } from 'date-fns';
import type { ClassNames, DateRange, Shortcut } from '../types';
import { mergeSlot } from '../utils/mergeClassNames';

export interface ShortcutsPanelProps {
  shortcuts: Shortcut[];
  value: DateRange;
  onSelect: (range: DateRange) => void;
  classNames?: ClassNames;
}

/** True when two ranges cover the same start and end day. */
function sameRange(a: DateRange, b: DateRange): boolean {
  const dayEq = (x: Date | null, y: Date | null) =>
    (x === null && y === null) || (!!x && !!y && isSameDay(x, y));
  return dayEq(a[0], b[0]) && dayEq(a[1], b[1]);
}

/** Sidebar of preset ranges. */
export function ShortcutsPanel({ shortcuts, value, onSelect, classNames }: ShortcutsPanelProps) {
  return (
    <div className={mergeSlot('shortcutsPanel', classNames)}>
      {shortcuts.map((shortcut) => {
        const active = sameRange(shortcut.range, value);
        return (
          <button
            key={shortcut.label}
            type="button"
            aria-pressed={active}
            className={mergeSlot(
              'shortcut',
              classNames,
              active && mergeSlot('shortcutActive', classNames),
            )}
            onClick={() => onSelect(shortcut.range)}
          >
            {shortcut.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ShortcutsPanel.test.tsx`
Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/ShortcutsPanel.tsx src/components/ShortcutsPanel.test.tsx
git commit -m "feat: shortcuts panel"
```

---

## Task 12: TimePicker component

**Files:**
- Create: `src/components/TimePicker.tsx`
- Test: `src/components/TimePicker.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/TimePicker.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimePicker } from './TimePicker';

describe('TimePicker', () => {
  it('renders hours and minutes for minute precision', () => {
    render(<TimePicker value={new Date(2026, 4, 20, 9, 30)} precision="minute" onChange={vi.fn()} />);
    expect(screen.getByLabelText('hours')).toHaveValue(9);
    expect(screen.getByLabelText('minutes')).toHaveValue(30);
    expect(screen.queryByLabelText('seconds')).not.toBeInTheDocument();
  });

  it('renders seconds for second precision', () => {
    render(<TimePicker value={new Date(2026, 4, 20, 9, 30, 15)} precision="second" onChange={vi.fn()} />);
    expect(screen.getByLabelText('seconds')).toHaveValue(15);
  });

  it('merges an edited hour into the date', async () => {
    const onChange = vi.fn();
    render(<TimePicker value={new Date(2026, 4, 20, 9, 30)} precision="minute" onChange={onChange} />);
    const hours = screen.getByLabelText('hours');
    await userEvent.clear(hours);
    await userEvent.type(hours, '14');
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 4, 20, 14, 30));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/TimePicker.test.tsx`
Expected: FAIL — cannot resolve `./TimePicker`.

- [ ] **Step 3: Write the implementation**

`src/components/TimePicker.tsx`:

```tsx
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

  const update = (next: Date) => onChange(next);

  return (
    <div className={mergeSlot('timePicker', classNames)}>
      <input
        type="number"
        aria-label="hours"
        min={0}
        max={23}
        value={base.getHours()}
        className={inputClass}
        onChange={(e) => update(setHours(base, Number(e.target.value)))}
      />
      <span>:</span>
      <input
        type="number"
        aria-label="minutes"
        min={0}
        max={59}
        value={base.getMinutes()}
        className={inputClass}
        onChange={(e) => update(setMinutes(base, Number(e.target.value)))}
      />
      {precision === 'second' && (
        <>
          <span>:</span>
          <input
            type="number"
            aria-label="seconds"
            min={0}
            max={59}
            value={base.getSeconds()}
            className={inputClass}
            onChange={(e) => update(setSeconds(base, Number(e.target.value)))}
          />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/TimePicker.test.tsx`
Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/TimePicker.tsx src/components/TimePicker.test.tsx
git commit -m "feat: time picker"
```

---

## Task 13: DateRangeInput composition + public exports

**Files:**
- Create: `src/DateRangeInput.tsx`, `src/index.ts`
- Test: `src/DateRangeInput.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/DateRangeInput.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangeInput } from './DateRangeInput';

describe('DateRangeInput', () => {
  it('renders two text inputs', () => {
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} />);
    expect(screen.getByPlaceholderText('from')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('to')).toBeInTheDocument();
  });

  it('opens the calendar popover on focus', async () => {
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} />);
    await userEvent.click(screen.getByPlaceholderText('from'));
    // rdp renders a grid role for the calendar
    expect(await screen.findByRole('grid')).toBeInTheDocument();
  });

  it('commits a typed range via onChange', async () => {
    const onChange = vi.fn();
    render(
      <DateRangeInput placeholder={{ start: 'from', end: 'to' }} onChange={onChange} />,
    );
    await userEvent.type(screen.getByPlaceholderText('from'), '2026-05-10');
    await userEvent.type(screen.getByPlaceholderText('to'), '2026-05-20');
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith([
      new Date(2026, 4, 10),
      new Date(2026, 4, 20),
    ]);
  });

  it('renders the shortcuts panel when shortcuts are enabled', async () => {
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} shortcuts />);
    await userEvent.click(screen.getByPlaceholderText('from'));
    expect(await screen.findByRole('button', { name: 'Last 7 days' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/DateRangeInput.test.tsx`
Expected: FAIL — cannot resolve `./DateRangeInput`.

- [ ] **Step 3: Write `src/DateRangeInput.tsx`**

```tsx
import { useMemo, useState } from 'react';
import type { DateRange, DateRangeInputProps, Shortcut } from './types';
import { useDateRangeInput } from './hooks/useDateRangeInput';
import { useDateParsing } from './hooks/useDateParsing';
import { createDefaultShortcuts } from './utils/shortcuts';
import { mergeSlot } from './utils/mergeClassNames';
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
  const state = useDateRangeInput({ value, defaultValue, onChange, allowSingleDayRange });
  const parsing = useDateParsing({ formatDate, parseDate, locale });
  const presets = useMemo(() => resolveShortcuts(shortcuts), [shortcuts]);

  const handleCalendarChange = (range: DateRange) => {
    state.setRange(range);
    if (closeOnSelection && range[0] && range[1]) setOpen(false);
  };

  const inputGroup = (
    <div className={mergeSlot('inputGroup', classNames)}>
      <DateInputField
        value={state.range[0]}
        parsing={parsing}
        onCommit={(d) => state.setBoundary('start', d)}
        onFocus={() => { state.setFocusedBoundary('start'); setOpen(true); }}
        placeholder={placeholder?.start}
        disabled={disabled}
        sideSlot="inputStart"
        classNames={classNames}
      />
      <span className={mergeSlot('separator', classNames)}>→</span>
      <DateInputField
        value={state.range[1]}
        parsing={parsing}
        onCommit={(d) => state.setBoundary('end', d)}
        onFocus={() => { state.setFocusedBoundary('end'); setOpen(true); }}
        placeholder={placeholder?.end}
        disabled={disabled}
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
```

- [ ] **Step 4: Write `src/index.ts`**

```ts
export { DateRangeInput } from './DateRangeInput';
export { createDefaultShortcuts } from './utils/shortcuts';
export { defaultClassNames } from './styles/defaultClassNames';
export type {
  DateRange,
  Boundary,
  Shortcut,
  Slot,
  ClassNames,
  DateRangeInputProps,
} from './types';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/DateRangeInput.test.tsx`
Expected: PASS — all 4 tests green.

If the popover-open test cannot find `role="grid"`, use `screen.debug()` to confirm the role rdp v9 applies and adjust the query.

- [ ] **Step 6: Run the full suite**

Run: `npx vitest run`
Expected: PASS — every test from Tasks 3–13 green.

- [ ] **Step 7: Commit**

```bash
git add src/DateRangeInput.tsx src/index.ts src/DateRangeInput.test.tsx
git commit -m "feat: DateRangeInput composition and public exports"
```

---

## Task 14: Playground app

**Files:**
- Create: `playground/index.html`, `playground/main.tsx`, `playground/App.tsx`, `playground/styles.css`, `playground/vite.config.ts`

- [ ] **Step 1: Create `playground/vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { 'bp-mui-date-range-picker': resolve(__dirname, '../src/index.ts') },
  },
});
```

- [ ] **Step 2: Create `playground/styles.css`**

```css
@import "tailwindcss";
@source "../src";
```

- [ ] **Step 3: Create `playground/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>bp-mui-date-range-picker playground</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create `playground/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 5: Create `playground/App.tsx`**

```tsx
import { useState } from 'react';
import { DateRangeInput, type DateRange } from 'bp-mui-date-range-picker';

export function App() {
  const [range, setRange] = useState<DateRange>([null, null]);
  const [contiguous, setContiguous] = useState(true);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-xl font-semibold">DateRangeInput playground</h1>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={contiguous}
          onChange={(e) => setContiguous(e.target.checked)}
        />
        Contiguous calendar months
      </label>

      <DateRangeInput
        value={range}
        onChange={setRange}
        contiguousCalendarMonths={contiguous}
        shortcuts
        placeholder={{ start: 'Start date', end: 'End date' }}
      />

      <pre className="rounded bg-zinc-100 p-3 text-sm">
        {JSON.stringify(range.map((d) => d?.toISOString() ?? null), null, 2)}
      </pre>

      <h2 className="text-lg font-medium">Custom styling</h2>
      <DateRangeInput
        placeholder={{ start: 'From', end: 'To' }}
        classNames={{
          input: 'rounded-lg border-zinc-300 focus:ring-2 focus:ring-emerald-500',
          daySelected: 'bg-emerald-600 text-white',
          dayRangeMiddle: 'bg-emerald-100',
        }}
      />
    </div>
  );
}
```

- [ ] **Step 6: Verify the playground runs**

Run: `npm run dev`
Expected: Vite starts; opening the printed URL shows the heading, both `DateRangeInput` instances render, focusing an input opens the calendar, and the contiguous checkbox toggles between one and two calendars. Stop the server with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add playground
git commit -m "feat: playground app"
```

---

## Task 15: Build verification and README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Run the production build**

Run: `npm run build`
Expected: `dist/` contains `index.js` (ESM), `index.cjs` (CJS), and `index.d.ts`, with no errors.

- [ ] **Step 2: Run typecheck and the full test suite**

Run: `npm run typecheck && npm test`
Expected: typecheck reports no errors; every test green.

- [ ] **Step 3: Create `README.md`**

````markdown
# bp-mui-date-range-picker

Blueprint-style `DateRangeInput` for React 19 with slot-based Tailwind styling.

## Install

```bash
npm install bp-mui-date-range-picker
```

Peer dependencies: `react` and `react-dom` 19+.

## Tailwind setup

This library ships raw Tailwind classes. Your app must use Tailwind v4 and
include the library in its source scan so the utility classes are generated:

```css
@import "tailwindcss";
@source "../node_modules/bp-mui-date-range-picker/dist";
```

## Usage

```tsx
import { DateRangeInput, type DateRange } from 'bp-mui-date-range-picker';

function Example() {
  const [range, setRange] = useState<DateRange>([null, null]);
  return (
    <DateRangeInput
      value={range}
      onChange={setRange}
      shortcuts
      contiguousCalendarMonths
      placeholder={{ start: 'Start', end: 'End' }}
    />
  );
}
```

## Styling

Override any slot through the `classNames` prop. Consumer classes win
Tailwind conflicts:

```tsx
<DateRangeInput
  classNames={{
    input: 'rounded-lg focus:ring-2 focus:ring-indigo-500',
    daySelected: 'bg-indigo-600 text-white',
    dayRangeMiddle: 'bg-indigo-100',
  }}
/>
```

See the `Slot` type for the full slot list.
````

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README"
```

---

## Self-Review Notes

- **Spec coverage:** Stack (Task 1), date handling via date-fns (Tasks 3–6), package structure (all tasks), public API (Task 2 + Task 13), contiguous toggle (Task 9 + Task 13), slot styling (Task 5 + every component), data flow / controlled-uncontrolled (Task 7 + Task 13), error handling — invalid input / bounds / disabled / swap / single-day (Tasks 3, 7, 9, 10), testing (every task). Hover-preview is delegated to react-day-picker (noted under File Structure and Task 9).
- **`allowSingleDayRange`:** enforced centrally in `useDateRangeInput.commit` (Task 7) — every input path (text, shortcuts, calendar) commits through it, so a both-ends-set single-day range is rejected unless the prop is set. The prop is declared in Task 2 and threaded through `DateRangeInput` in Task 13.
- **Type consistency:** `DateRange` tuple, `Slot`, `ClassNames`, `Boundary`, `DateParsing`, `DateRangeInputState` names are used identically across tasks.
