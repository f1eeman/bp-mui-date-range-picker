# Nav-Around Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposition the calendar navigation arrows so the "previous" arrow sits left of the first month's month/year dropdowns and the "next" arrow sits right of the last month's dropdowns, in both calendar modes.

**Architecture:** Use react-day-picker v9's built-in `navLayout="around"`, which renders the previous-month button inside the first month (before its caption) and the next-month button inside the last month (after its caption), and stops rendering the standalone `<Nav>`. Because this library overrides rdp's default classes, rdp's own `navLayout` CSS does not apply — positioning is supplied through the library's own Tailwind slots.

**Tech Stack:** TypeScript, React 19, react-day-picker v9, Vitest + React Testing Library.

---

## File Structure

```
src/types.ts                          — remove the now-dead 'nav' slot from the Slot union
src/styles/defaultClassNames.ts        — remove the 'nav' entry; adjust 'month' and 'caption'
src/components/RangeCalendar.tsx        — add navLayout="around"; position the nav buttons; drop 'nav'
src/components/RangeCalendar.test.tsx   — new tests
```

This is one cohesive change: removing the `nav` slot from the `Slot` union
simultaneously requires removing it from `defaultClassNames` (typed
`Record<Slot, string>`) and from `RangeCalendar`'s `rdpClassNames` (which calls
`mergeSlot('nav', …)`). Splitting these would leave an intermediate state that
does not typecheck, so it is a single task whose source edits are applied
together.

---

## Task 1: Position the nav arrows around the calendar

**Files:**
- Modify: `src/types.ts`
- Modify: `src/styles/defaultClassNames.ts`
- Modify: `src/components/RangeCalendar.tsx`
- Test: `src/components/RangeCalendar.test.tsx`

**Notes on react-day-picker v9:** With `navLayout="around"`, rdp does NOT render
the standalone `<nav>` element; instead it renders `PreviousMonthButton` as the
first child of the first month and `NextMonthButton` after the last month's
caption. The month grid carries `role="grid"`; day-cell `<button>`s live inside
it, so nav buttons are exactly the `<button>`s NOT inside a `[role="grid"]`
element.

- [ ] **Step 1: Write the failing tests in `src/components/RangeCalendar.test.tsx`**

Add these three tests inside the existing `describe('RangeCalendar', ...)` block. The file already imports `describe, it, expect, vi` from vitest and `render, screen` from `@testing-library/react`.

```tsx
  it('renders no standalone <nav> element (navLayout around)', () => {
    const { container } = render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        contiguous
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    expect(container.querySelector('nav')).toBeNull();
  });

  it('places the prev arrow before the first caption and the next arrow after the last', () => {
    const { container } = render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        contiguous
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    // nav buttons are the <button>s that are NOT day cells; day cells live
    // inside the month grid ([role="grid"]).
    const navButtons = Array.from(container.querySelectorAll('button')).filter(
      (b) => !b.closest('[role="grid"]'),
    );
    expect(navButtons).toHaveLength(2); // contiguous: exactly one prev + one next
    const [prevBtn, nextBtn] = navButtons;
    const selects = container.querySelectorAll('select');
    const firstSelect = selects[0];
    const lastSelect = selects[selects.length - 1];
    // the prev arrow comes before the first month's dropdowns
    expect(
      prevBtn.compareDocumentPosition(firstSelect) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // the next arrow comes after the last month's dropdowns
    expect(
      nextBtn.compareDocumentPosition(lastSelect) &
        Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
  });

  it('gives each calendar its own pair of arrows in non-contiguous mode', () => {
    const { container } = render(
      <RangeCalendar
        value={[null, null]}
        onChange={vi.fn()}
        contiguous={false}
        defaultMonth={new Date(2026, 4, 1)}
      />,
    );
    const navButtons = Array.from(container.querySelectorAll('button')).filter(
      (b) => !b.closest('[role="grid"]'),
    );
    expect(navButtons).toHaveLength(4); // two calendars x (prev + next)
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/RangeCalendar.test.tsx`
Expected: FAIL — the three new tests fail. Currently rdp renders a standalone `<nav>` (so the first test fails), and the prev/next buttons live inside that `<nav>` (not around the captions), so the DOM-order and count assertions fail. The pre-existing tests still pass. Confirm RED before implementing.

- [ ] **Step 3: Apply the source change across the three files**

These three edits MUST be applied together — any one alone leaves the project not typechecking.

**3a. `src/types.ts` — remove `'nav'` from the `Slot` union.**

The calendar-elements line currently reads:

```ts
  | 'calendar' | 'month' | 'caption' | 'dropdowns' | 'dropdown' | 'nav' | 'navButton'
```

Change it to (drop `'nav' | `):

```ts
  | 'calendar' | 'month' | 'caption' | 'dropdowns' | 'dropdown' | 'navButton'
```

**3b. `src/styles/defaultClassNames.ts` — remove the `nav` entry and adjust `month` + `caption`.**

Delete this entry entirely:

```ts
  nav: 'flex items-center justify-between',
```

Change the `month` entry from:

```ts
  month: 'space-y-2',
```
to:
```ts
  month: 'relative space-y-2',
```

Change the `caption` entry from:

```ts
  caption: 'text-sm font-medium text-zinc-900',
```
to:
```ts
  caption: 'flex justify-center px-8 text-sm font-medium text-zinc-900',
```

**3c. `src/components/RangeCalendar.tsx` — enable `navLayout`, drop the `nav` mapping, position the buttons.**

In `rdpClassNames`, the `const navBtn` line and the `nav`/`button_previous`/`button_next` entries currently are:

```ts
  const navBtn = mergeSlot('navButton', classNames);
  return {
    ...
    nav: mergeSlot('nav', classNames),                 // UI.Nav = "nav"
    button_previous: navBtn,                           // UI.PreviousMonthButton = "button_previous"
    button_next: navBtn,                               // UI.NextMonthButton = "button_next"
    ...
```

Replace those four lines with (remove `navBtn`, remove the `nav` entry, give each button side-specific positioning):

```ts
  return {
    ...
    // navLayout="around" positions the buttons absolutely within each month;
    // `month` is `relative`, the buttons pin to its left/right edge.
    button_previous: mergeSlot('navButton', classNames, 'absolute left-0 top-0'),
    button_next: mergeSlot('navButton', classNames, 'absolute right-0 top-0'),
    ...
```

(The `const navBtn = ...` line is deleted; `rdpClassNames` no longer has a `nav` key.)

In the `shared` object, add `navLayout`. It currently is:

```ts
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

Add `navLayout: 'around' as const`:

```ts
  const shared = {
    mode: 'range' as const,
    selected: toRdpRange(value),
    onSelect: handleSelect,
    disabled: buildDisabled(minDate, maxDate, disabledDays),
    captionLayout: 'dropdown' as const,
    navLayout: 'around' as const,
    startMonth,
    endMonth,
    locale,
    classNames: rdpClassNames(classNames),
  };
```

- [ ] **Step 4: Verify against the real react-day-picker v9 API and run the tests**

Run: `npx tsc --noEmit` — expected: clean.
Run: `npx vitest run src/components/RangeCalendar.test.tsx` — expected: PASS, all tests green (the 3 new + the pre-existing ones).

If a test fails, check the installed `react-day-picker` v9 under `node_modules/react-day-picker`:
- Confirm `navLayout` accepts `"around"` and that with it the standalone `<Nav>` is not rendered while `PreviousMonthButton`/`NextMonthButton` are rendered inside the first/last month.
- The required behavior: no standalone `<nav>`; in contiguous mode exactly one prev + one next button; the prev button precedes the first month's caption in DOM order and the next button follows the last month's caption.
- Report any adjustment you had to make and why.

If the nav buttons render but are not visually positioned at the month edges, the cause is the Tailwind positioning — `month` must be `relative` and the button slots must carry `absolute left-0 top-0` / `absolute right-0 top-0`. Vertical alignment of the buttons against the caption row may be tuned (e.g. the `top` value or button height) so the arrows line up with the dropdowns; keep the change within the `defaultClassNames` `navButton`/`caption` entries or the positioning extras.

- [ ] **Step 5: Run the full suite, typecheck, and build**

Run: `npx vitest run`
Expected: PASS — every test green (60 before this plan + 3 new = 63; if the observed pre-existing count differs, trust it — the gate is "all green").

Run: `npx tsc --noEmit`
Expected: PASS — no errors.

Run: `npm run build`
Expected: success — `dist/` rebuilt, no errors or warnings.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/styles/defaultClassNames.ts src/components/RangeCalendar.tsx src/components/RangeCalendar.test.tsx
git commit -m "feat: position nav arrows around the calendar (navLayout=around)"
```

(No build artifacts — `dist/` and `playground/dist/` are git-ignored. Do not stage them.)

---

## Self-Review Notes

- **Spec coverage:** §1 behavior — `navLayout: 'around'` in `shared` (Step 3c), applied to both contiguous and non-contiguous `DayPicker`s; the standalone `<nav>` removal is inherent to `navLayout`. §2 styling — `month` gets `relative`, `caption` gets centering + horizontal padding (Step 3b), `navButton` stays one slot with side-specific positioning appended in `rdpClassNames` (Step 3c). §3 dead `nav` slot — removed from `Slot` (3a), `defaultClassNames` (3b), and `rdpClassNames` (3c). §5 error handling — none needed (layout change). §6 testing — no `<nav>`, one prev + one next in contiguous, DOM order, non-contiguous gets four buttons (Step 1); existing tests confirmed green in Step 5.
- **Placeholder scan:** no TBDs; all edits show complete before/after code.
- **Type consistency:** `'nav'` is removed from `Slot`, `defaultClassNames`, and `rdpClassNames` in the same step — no dangling reference. The `navButton` slot name is unchanged and still present in all three places.
- **Test count:** 60 before, +3 new = 63 after. (If the observed pre-existing count differs, trust the observed number; the gate is "all green.")
