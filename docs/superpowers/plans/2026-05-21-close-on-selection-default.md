# closeOnSelection Default Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the default of the `closeOnSelection` prop from `true` to `false`, so the calendar popover stays open after a complete range is selected unless the consumer opts into closing.

**Architecture:** `closeOnSelection` already exists and is honored in `DateRangeInput`'s `handleCalendarChange` (`if (closeOnSelection && complete) setOpen(false)`). Only the default value in the props destructure changes; the closing logic is untouched.

**Tech Stack:** TypeScript, React 19, Vitest + React Testing Library.

---

## File Structure

```
src/DateRangeInput.tsx                          — flip the closeOnSelection default
src/types.ts                                    — JSDoc the closeOnSelection prop
src/DateRangeInput.test.tsx                      — new test + adjust the existing close test
docs/superpowers/specs/2026-05-20-date-range-input-design.md — sync the API note
```

One task — the change is a single coupled unit (flipping the default breaks the existing "closes" test unless that test is updated in the same step).

---

## Task 1: Flip the `closeOnSelection` default to `false`

**Files:**
- Modify: `src/DateRangeInput.tsx`
- Modify: `src/types.ts`
- Modify: `src/DateRangeInput.test.tsx`
- Modify: `docs/superpowers/specs/2026-05-20-date-range-input-design.md`

- [ ] **Step 1: Write the failing test in `src/DateRangeInput.test.tsx`**

Add this test inside the existing `describe('DateRangeInput', ...)` block, immediately after the test `'closes the popover when a two-day range is completed'` (which currently ends at the line with `expect(last[1].getDate()).toBe(20);` followed by `});`):

```tsx
  it('keeps the popover open after a complete range by default', async () => {
    const onChange = vi.fn();
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} onChange={onChange} />);
    await userEvent.click(screen.getByPlaceholderText('from'));
    await userEvent.click(screen.getAllByText('10')[0]);
    await userEvent.click(screen.getAllByText('20')[0]);
    // closeOnSelection defaults to false — the popover stays open
    expect(screen.queryAllByRole('grid').length).toBeGreaterThan(0);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/DateRangeInput.test.tsx`
Expected: FAIL — the new test fails because `closeOnSelection` currently defaults to `true`, so completing a two-day range closes the popover (`queryAllByRole('grid')` returns `0`, not `> 0`). Confirm RED before implementing.

- [ ] **Step 3: Apply the change (four edits together)**

**3a. `src/DateRangeInput.tsx` — flip the default.**

In the props destructure, this line currently reads:

```ts
    closeOnSelection = true,
```

Change it to:

```ts
    closeOnSelection = false,
```

**3b. `src/types.ts` — add a JSDoc to `closeOnSelection`.**

The interface currently has this bare line:

```ts
  closeOnSelection?: boolean;
```

Replace it with:

```ts
  /**
   * When true, the popover closes once a complete range (two different days)
   * is selected via the calendar or a shortcut. Defaults to false — the
   * popover stays open until dismissed (Escape or click outside).
   */
  closeOnSelection?: boolean;
```

**3c. `src/DateRangeInput.test.tsx` — make the existing close test opt in explicitly.**

The test `'closes the popover when a two-day range is completed'` currently renders without `closeOnSelection`, relying on the old default. Its render line is:

```tsx
    render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} onChange={onChange} />);
```

Change that line (within that test only) to pass `closeOnSelection` explicitly:

```tsx
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        onChange={onChange}
        closeOnSelection
      />,
    );
```

**3d. `docs/superpowers/specs/2026-05-20-date-range-input-design.md` — sync the API note.**

In section 4 (Public API), the `closeOnSelection` line in the props interface currently ends with the comment `// default true`. Change that comment to `// default false`. (Only the `closeOnSelection` line; leave the rest of the block unchanged.)

- [ ] **Step 4: Run the test file to verify it passes**

Run: `npx vitest run src/DateRangeInput.test.tsx`
Expected: PASS — both the new `'keeps the popover open after a complete range by default'` test and the adjusted `'closes the popover when a two-day range is completed'` test pass, along with the rest of the file.

- [ ] **Step 5: Run the full suite, typecheck, and build**

Run: `npx vitest run`
Expected: PASS — every test green (63 before this plan + 1 new = 64; if the observed pre-existing count differs, trust it — the gate is "all green").

Run: `npx tsc --noEmit`
Expected: PASS — no errors.

Run: `npm run build`
Expected: success — `dist/` rebuilt, no errors or warnings.

- [ ] **Step 6: Commit**

```bash
git add src/DateRangeInput.tsx src/types.ts src/DateRangeInput.test.tsx docs/superpowers/specs/2026-05-20-date-range-input-design.md
git commit -m "feat: default closeOnSelection to false"
```

(No build artifacts — `dist/` and `playground/dist/` are git-ignored. Do not stage them.)

---

## Self-Review Notes

- **Spec coverage:** behavior change — `closeOnSelection = false` default (Step 3a); `handleCalendarChange` logic untouched (not edited); JSDoc on the prop (Step 3b); existing close test made explicit + new default-open test (Steps 1, 3c); design-doc sync (Step 3d). Testing — default keeps popover open, explicit `closeOnSelection` closes, existing tests green (Steps 4-5).
- **Placeholder scan:** no TBDs; all four edits show complete before/after code.
- **Type consistency:** `closeOnSelection` is the same prop name in `types.ts`, `DateRangeInput.tsx`, and the tests; type unchanged (`boolean`), only the default differs.
- **Test count:** 63 before, +1 new (`keeps the popover open after a complete range by default`) = 64; the existing close test is modified, not added.
