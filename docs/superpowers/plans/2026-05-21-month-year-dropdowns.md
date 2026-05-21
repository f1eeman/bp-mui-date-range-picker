# Month/Year Dropdowns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add month and year dropdown selectors to the calendar caption of `bp-mui-date-range-picker`, so users can jump straight to any month/year instead of clicking the nav arrows repeatedly.

**Architecture:** `react-day-picker` v9 has this built in via `captionLayout="dropdown"`. `RangeCalendar` enables it and bounds the year dropdown with `startMonth`/`endMonth` (derived from `minDate`/`maxDate`, or the current year ±10). Two new style slots (`dropdowns`, `dropdown`) keep the dropdowns consumer-styleable like every other element.

**Tech Stack:** TypeScript, React 19, `react-day-picker` v9, Vitest + React Testing Library.

---

## File Structure

```
src/types.ts                        — add 'dropdowns','dropdown' to the Slot union
src/styles/defaultClassNames.ts      — add default Tailwind classes for the two slots
src/components/RangeCalendar.tsx      — enable captionLayout, compute year bounds, map slots
src/components/RangeCalendar.test.tsx — new tests for the dropdowns
src/DateRangeInput.test.tsx           — one integration check
```

Two tasks: Task 1 adds the style slots (a prerequisite, since `RangeCalendar`'s
slot mapping references them and `defaultClassNames` is typed `Record<Slot, string>`).
Task 2 wires up the dropdowns in `RangeCalendar` and tests them.

---

## Task 1: Add `dropdowns` and `dropdown` style slots

**Files:**
- Modify: `src/types.ts`
- Modify: `src/styles/defaultClassNames.ts`

- [ ] **Step 1: Add the two slot names to the `Slot` union in `src/types.ts`**

The `Slot` type currently contains this line for the calendar elements:

```ts
  | 'calendar' | 'month' | 'caption' | 'nav' | 'navButton'
```

Replace that single line with:

```ts
  | 'calendar' | 'month' | 'caption' | 'dropdowns' | 'dropdown' | 'nav' | 'navButton'
```

- [ ] **Step 2: Verify it fails to typecheck**

Run: `npx tsc --noEmit`
Expected: FAIL — `src/styles/defaultClassNames.ts` errors because `defaultClassNames` is typed `Record<Slot, string>` and is now missing the `dropdowns` and `dropdown` keys.

- [ ] **Step 3: Add default classes for the two slots in `src/styles/defaultClassNames.ts`**

The file has this entry for the caption:

```ts
  caption: 'text-sm font-medium text-zinc-900',
```

Immediately after that line, add:

```ts
  dropdowns: 'flex items-center gap-1',
  dropdown:
    'rounded border border-zinc-300 bg-white px-1 py-0.5 text-sm text-zinc-900',
```

- [ ] **Step 4: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: PASS — no errors.

- [ ] **Step 5: Run the existing suite to confirm nothing broke**

Run: `npx vitest run`
Expected: PASS — all existing tests still green (54 tests).

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/styles/defaultClassNames.ts
git commit -m "feat: add dropdowns/dropdown style slots"
```

---

## Task 2: Enable month/year dropdowns in `RangeCalendar`

**Files:**
- Modify: `src/components/RangeCalendar.tsx`
- Test: `src/components/RangeCalendar.test.tsx`
- Test: `src/DateRangeInput.test.tsx`

**Notes on react-day-picker v9:** `captionLayout="dropdown"` replaces the
caption's month label with two `<select>` elements (month, year). The year
dropdown's range is bounded by the `startMonth` and `endMonth` props. The
`<select>` elements expose the ARIA role `combobox`; their `<option>` elements
expose role `option`. The exact `classNames` keys for the dropdown elements
(expected: `dropdowns` for the container, `dropdown` for each `<select>`) must
be verified against the installed rdp v9 — see Step 6.

- [ ] **Step 1: Write the failing tests in `src/components/RangeCalendar.test.tsx`**

Add this helper and these four tests inside the existing `describe('RangeCalendar', ...)` block. The file already imports `describe, it, expect, vi` from vitest, `render, screen` from `@testing-library/react`, and `userEvent` from `@testing-library/user-event`.

```tsx
  /** Year-only option texts (4-digit), deduped and sorted ascending. */
  function visibleYearOptions(): number[] {
    const years = screen
      .getAllByRole('option')
      .map((o) => o.textContent ?? '')
      .filter((t) => /^\d{4}$/.test(t))
      .map(Number);
    return [...new Set(years)].sort((a, b) => a - b);
  }

  it('renders month and year dropdowns in the caption', () => {
    render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        contiguous
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(2);
  });

  it('bounds the year dropdown by minDate and maxDate', () => {
    render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        contiguous
        defaultMonth={new Date(2026, 4, 1)}
        minDate={new Date(2025, 0, 1)}
        maxDate={new Date(2027, 11, 31)}
      />,
    );
    expect(visibleYearOptions()).toEqual([2025, 2026, 2027]);
  });

  it('defaults the year dropdown to the current year +/- 10', () => {
    render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        contiguous
        defaultMonth={new Date()}
      />,
    );
    const currentYear = new Date().getFullYear();
    const years = visibleYearOptions();
    expect(years[0]).toBe(currentYear - 10);
    expect(years[years.length - 1]).toBe(currentYear + 10);
  });

  it('keeps a selected year applied (dropdown drives the displayed month)', async () => {
    render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        contiguous
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    const yearSelect = screen
      .getAllByRole('combobox')
      .find((el) =>
        Array.from((el as HTMLSelectElement).options).some((o) =>
          /^\d{4}$/.test(o.textContent ?? ''),
        ),
      ) as HTMLSelectElement;
    expect(yearSelect).toBeDefined();
    const opt2028 = Array.from(yearSelect.options).find(
      (o) => o.textContent === '2028',
    )!;
    await userEvent.selectOptions(yearSelect, opt2028);
    // The select is controlled by rdp via the `month` prop; the value sticks
    // only if onMonthChange round-tripped the change.
    expect(yearSelect.value).toBe(opt2028.value);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/RangeCalendar.test.tsx`
Expected: FAIL — the four new tests fail because no dropdowns render yet (`getAllByRole('combobox')` finds nothing). The three pre-existing tests still pass.

- [ ] **Step 3: Add the `yearBounds` helper to `src/components/RangeCalendar.tsx`**

Insert this function just above the `RangeCalendar` component definition (after `buildDisabled`):

```ts
/**
 * Year-range bounds for the caption dropdowns. Uses minDate/maxDate when given,
 * otherwise the current year +/- 10. The returned months also bound month
 * navigation, which is intentional (see the design doc).
 */
function yearBounds(
  minDate?: Date,
  maxDate?: Date,
): { startMonth: Date; endMonth: Date } {
  const currentYear = new Date().getFullYear();
  return {
    startMonth: minDate ?? new Date(currentYear - 10, 0, 1),
    endMonth: maxDate ?? new Date(currentYear + 10, 11, 31),
  };
}
```

- [ ] **Step 4: Enable the dropdown caption in the `shared` object**

In `RangeCalendar`, the component body currently builds `shared` like this:

```ts
  const shared = {
    mode: 'range' as const,
    selected: toRdpRange(value),
    onSelect: handleSelect,
    disabled: buildDisabled(minDate, maxDate, disabledDays),
    locale,
    classNames: rdpClassNames(classNames),
  };
```

Replace that block with:

```ts
  const { startMonth, endMonth } = yearBounds(minDate, maxDate);

  const shared = {
    mode: 'range' as const,
    selected: toRdpRange(value),
    onSelect: handleSelect,
    disabled: buildDisabled(minDate, maxDate, disabledDays),
    captionLayout: 'dropdown' as const,
    startMonth,
    endMonth,
    locale,
    classNames: rdpClassNames(classNames),
  };
```

- [ ] **Step 5: Map the two new slots in `rdpClassNames`**

In `src/components/RangeCalendar.tsx`, the `rdpClassNames` function returns an object with a `month_caption` entry:

```ts
    month_caption: mergeSlot('caption', classNames),   // UI.MonthCaption = "month_caption"
```

Immediately after that line, add:

```ts
    dropdowns: mergeSlot('dropdowns', classNames),     // UI.Dropdowns = "dropdowns"
    dropdown: mergeSlot('dropdown', classNames),       // UI.Dropdown = "dropdown"
```

- [ ] **Step 6: Verify rdp v9 classNames keys and run the tests**

Run: `npx vitest run src/components/RangeCalendar.test.tsx`
Expected: PASS — all 7 tests (3 pre-existing + 4 new) green.

If a test fails, check the installed `react-day-picker` v9 API under
`node_modules/react-day-picker`:
- Confirm the `classNames` keys for the dropdown container and the `<select>`
  elements. If v9 names them differently than `dropdowns` / `dropdown`, use the
  correct v9 keys in the `rdpClassNames` mapping (the library slot names
  `dropdowns` / `dropdown` stay the same — only the rdp-side keys change).
- Confirm `captionLayout="dropdown"` is the correct prop value (vs
  `"dropdown-buttons"` or similar) for showing both month and year dropdowns.
- The behavior must hold: month + year `<select>`s render, the year list is
  bounded by `startMonth`/`endMonth`, and selecting a value navigates the month.

Report any rdp-key adjustment made.

- [ ] **Step 7: Add an integration check in `src/DateRangeInput.test.tsx`**

Add this test inside the existing `describe('DateRangeInput', ...)` block:

```tsx
  it('shows month and year dropdowns once the calendar is open', async () => {
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} />);
    await userEvent.click(screen.getByPlaceholderText('from'));
    expect((await screen.findAllByRole('combobox')).length).toBeGreaterThanOrEqual(2);
  });
```

- [ ] **Step 8: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: PASS — every test green (54 from before + 5 new = 59). If the
observed pre-existing count differs, trust it; the gate is "all green."

Run: `npx tsc --noEmit`
Expected: PASS — no errors.

- [ ] **Step 9: Build**

Run: `npm run build`
Expected: success — `dist/` rebuilt, no errors or warnings.

- [ ] **Step 10: Commit**

```bash
git add src/components/RangeCalendar.tsx src/components/RangeCalendar.test.tsx src/DateRangeInput.test.tsx
git commit -m "feat: month/year dropdowns in the calendar caption"
```

---

## Self-Review Notes

- **Spec coverage:** §1 RangeCalendar changes — `captionLayout` (Task 2 Step 4),
  `startMonth`/`endMonth` from minDate/maxDate else current year ±10 via
  `yearBounds` (Task 2 Step 3-4); navigation-bounding side effect is inherent to
  `startMonth`/`endMonth`. §2 slots — `dropdowns`/`dropdown` added to `Slot`
  (Task 1), `defaultClassNames` entries (Task 1), mapped in `rdpClassNames`
  (Task 2 Step 5). §3 files — all touched. §4 error handling — none needed
  (finite list). §5 testing — dropdowns render, year bounds from min/max, ±10
  default, selection drives the month (Task 2 Step 1), `DateRangeInput`
  integration check (Task 2 Step 7).
- **Test count:** the suite is 54 before this plan; Task 2 adds 4 `RangeCalendar`
  tests + 1 `DateRangeInput` test = **59** total. (If the actual pre-existing
  count differs, trust the observed number; the gate is "all green.")
- **Placeholder scan:** no TBDs; all code blocks are complete.
- **Type consistency:** slot names `dropdowns`/`dropdown` are identical in
  `types.ts`, `defaultClassNames.ts`, and the `rdpClassNames` mapping;
  `yearBounds` returns `{ startMonth, endMonth }`, consumed by the same names.
