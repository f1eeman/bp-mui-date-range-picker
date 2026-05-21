# Popover Default Styles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the date picker's popover panel and day-state styling visible by default (it currently renders unstyled).

**Architecture:** Two independent fixes. (A) The day `<button>` (`.drp-day`) sets an explicit `color`, blocking state colors set on the parent `<td>` from cascading in — open the cascade by switching the button to `color: inherit`. (B) The popover is portalled out of `.drp-root` by `FloatingPortal`, so it loses every `--drp-*` token — forward the resolved tokens from `.drp-root` onto the popover element as inline style.

**Tech Stack:** React 19, TypeScript, react-day-picker v9, @floating-ui/react, Vitest + Testing Library, plain CSS with custom properties.

**Spec:** `docs/superpowers/specs/2026-05-21-popover-default-styles-design.md`

---

## File Structure

- `src/styles.css` — modify: open the day-state color cascade (Fix A).
- `src/styles.test.ts` — modify: assert the new CSS shape.
- `src/styles/tokens.ts` — create: `DRP_TOKENS` list + `readThemeTokens` helper (Fix B).
- `src/styles/tokens.test.ts` — create: tests for the helper.
- `src/components/Popover.tsx` — modify: accept and apply a `style` prop (Fix B).
- `src/components/Popover.test.tsx` — modify: assert forwarded style reaches the panel.
- `src/DateRangeInput.tsx` — modify: read tokens on open, forward to `Popover` (Fix B).

---

## Task 1: Fix A — open the day-state color cascade

**Files:**
- Modify: `src/styles.css`
- Test: `src/styles.test.ts`

- [ ] **Step 1: Write the failing test**

Add this `it` block to `src/styles.test.ts`, inside the existing `describe('styles.css', ...)` block (after the last existing `it`):

```ts
  it('opens the day-state color cascade into the day button', () => {
    // .drp-day must use color:inherit so a state color set on the parent <td>
    // (default or consumer override) reaches the button text.
    expect(css).toMatch(/:where\(\.drp-day\)\s*\{[^}]*color:\s*inherit/);
    // disabled needs a button-targeted rule — text-decoration/cursor do not
    // cross the <button> boundary.
    expect(css).toContain(':where(.drp-day-disabled) :where(.drp-day)');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/styles.test.ts`
Expected: FAIL — the new test fails (`css` still has `color: var(--drp-fg)` in `.drp-day`, and no `:where(.drp-day-disabled) :where(.drp-day)` rule). The 3 existing tests pass.

- [ ] **Step 3: Edit `.drp-day` — switch to `color: inherit`**

In `src/styles.css`, find the `:where(.drp-day)` rule:

```css
:where(.drp-day) {
  width: var(--drp-day-size);
  height: var(--drp-day-size);
  border: none;
  background: none;
  border-radius: var(--drp-radius);
  font-size: var(--drp-font-size);
  color: var(--drp-fg);
  cursor: pointer;
}
```

Replace the line `  color: var(--drp-fg);` with `  color: inherit;`.

- [ ] **Step 4: Edit `.drp-calendar` — add the default text color**

In `src/styles.css`, find the `:where(.drp-calendar)` rule:

```css
:where(.drp-calendar) {
  padding: var(--drp-panel-padding);
}
```

Replace it with:

```css
:where(.drp-calendar) {
  padding: var(--drp-panel-padding);
  color: var(--drp-fg);
}
```

- [ ] **Step 5: Edit `.drp-day-disabled` — split cell vs. button rules**

In `src/styles.css`, find the `:where(.drp-day-disabled)` rule:

```css
:where(.drp-day-disabled) {
  color: var(--drp-disabled-fg);
  text-decoration: line-through;
  cursor: default;
}
```

Replace it with:

```css
:where(.drp-day-disabled) {
  color: var(--drp-disabled-fg);
}
:where(.drp-day-disabled) :where(.drp-day) {
  text-decoration: line-through;
  cursor: default;
}
```

Leave the `drp-day-selected`, `drp-day-range-*`, `drp-day-today`, `drp-day-outside` rules unchanged — their backgrounds show through the transparent button and their `color`/`font-weight` now cascade in.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- src/styles.test.ts`
Expected: PASS — all 4 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/styles.css src/styles.test.ts
git commit -m "fix: cascade day-state colors into the day button

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Fix B (part 1) — the `tokens` module

**Files:**
- Create: `src/styles/tokens.ts`
- Test: `src/styles/tokens.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/styles/tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { DRP_TOKENS, readThemeTokens } from './tokens';

describe('DRP_TOKENS', () => {
  it('is non-empty and every name is a --drp-* custom property', () => {
    expect(DRP_TOKENS.length).toBeGreaterThan(0);
    for (const name of DRP_TOKENS) {
      expect(name.startsWith('--drp-')).toBe(true);
    }
  });
});

describe('readThemeTokens', () => {
  it('returns an object and does not throw for an unstyled element', () => {
    const el = document.createElement('div');
    expect(() => readThemeTokens(el)).not.toThrow();
    expect(typeof readThemeTokens(el)).toBe('object');
  });

  it('mirrors whatever getComputedStyle exposes for a token', () => {
    const el = document.createElement('div');
    el.style.setProperty('--drp-accent', 'rgb(1, 2, 3)');
    document.body.appendChild(el);
    const exposed = getComputedStyle(el).getPropertyValue('--drp-accent').trim();
    const tokens = readThemeTokens(el) as Record<string, string>;
    if (exposed) {
      expect(tokens['--drp-accent']).toBe(exposed);
    } else {
      expect(tokens['--drp-accent']).toBeUndefined();
    }
    el.remove();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/styles/tokens.test.ts`
Expected: FAIL — `Failed to resolve import './tokens'` (the module does not exist yet).

- [ ] **Step 3: Create the `tokens` module**

Create `src/styles/tokens.ts`:

```ts
import type { CSSProperties } from 'react';

/** Every `--drp-*` theme token declared on `.drp-root` in `styles.css`.
 *  Kept in sync with that file by hand — CSS exposes no token list to JS;
 *  `tokens.test.ts` guards the `--drp-` prefix against typos. */
export const DRP_TOKENS = [
  '--drp-accent',
  '--drp-accent-fg',
  '--drp-bg',
  '--drp-fg',
  '--drp-muted-fg',
  '--drp-border',
  '--drp-hover-bg',
  '--drp-range-bg',
  '--drp-range-fg',
  '--drp-today-fg',
  '--drp-disabled-fg',
  '--drp-shortcut-active-bg',
  '--drp-shortcut-active-fg',
  '--drp-invalid-border',
  '--drp-invalid-ring',
  '--drp-focus-ring',
  '--drp-radius',
  '--drp-day-size',
  '--drp-input-height',
  '--drp-nav-button-size',
  '--drp-popover-shadow',
  '--drp-panel-padding',
  '--drp-shortcuts-width',
  '--drp-gap',
  '--drp-font-family',
  '--drp-font-size',
  '--drp-font-size-sm',
  '--drp-font-weight-medium',
] as const;

/**
 * Reads the resolved value of every `--drp-*` token off `el` and returns them
 * as an inline-style object. Used to forward the theme onto the popover, which
 * `FloatingPortal` renders outside `.drp-root` — so it cannot inherit the
 * tokens. Tokens that resolve empty (e.g. in jsdom, which does not apply
 * stylesheets) are skipped.
 */
export function readThemeTokens(el: HTMLElement): CSSProperties {
  const computed = getComputedStyle(el);
  const tokens: Record<string, string> = {};
  for (const name of DRP_TOKENS) {
    const value = computed.getPropertyValue(name).trim();
    if (value) tokens[name] = value;
  }
  return tokens as CSSProperties;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/styles/tokens.test.ts`
Expected: PASS — all 3 tests pass.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens.ts src/styles/tokens.test.ts
git commit -m "feat: add DRP_TOKENS list and readThemeTokens helper

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Fix B (part 2) — forward tokens through the popover

**Files:**
- Modify: `src/components/Popover.tsx`
- Modify: `src/components/Popover.test.tsx`
- Modify: `src/DateRangeInput.tsx`

- [ ] **Step 1: Write the failing test**

Add this `it` block to `src/components/Popover.test.tsx`, inside the existing `describe('Popover', ...)` block (after the last existing `it`):

```ts
  it('applies a forwarded style to the floating panel', async () => {
    function StyledHarness() {
      const [open, setOpen] = useState(false);
      return (
        <Popover
          open={open}
          onOpenChange={setOpen}
          trigger={<button>open</button>}
          style={{ '--drp-accent': 'rgb(1, 2, 3)' } as CSSProperties}
        >
          <div>panel content</div>
        </Popover>
      );
    }
    render(<StyledHarness />);
    await userEvent.click(screen.getByText('open'));
    // The floating panel is the parent of the rendered children.
    const panel = screen.getByText('panel content').parentElement as HTMLElement;
    expect(panel.style.getPropertyValue('--drp-accent')).toBe('rgb(1, 2, 3)');
    // floating-ui positioning must survive the merge.
    expect(panel.style.position).toBeTruthy();
  });
```

Also update the React import at the top of the file from:

```ts
import { useState } from 'react';
```

to:

```ts
import { useState, type CSSProperties } from 'react';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Popover.test.tsx`
Expected: FAIL — TypeScript/runtime error: `Popover` has no `style` prop. The 2 existing tests pass.

- [ ] **Step 3: Add the `style` prop to `Popover`**

In `src/components/Popover.tsx`, update the React import from:

```ts
import { cloneElement, type ReactElement, type ReactNode } from 'react';
```

to:

```ts
import { cloneElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';
```

In the `PopoverProps` interface, add this member after `className?: string;`:

```ts
  /** Extra inline style for the floating panel. Merged *under* `floatingStyles`
   *  so positioning always wins. Used to forward `--drp-*` theme tokens onto
   *  the portalled panel, which cannot inherit them from `.drp-root`. */
  style?: CSSProperties;
```

Update the destructuring in the function signature from:

```ts
export function Popover({ open, onOpenChange, trigger, children, className, disableClickToggle }: PopoverProps) {
```

to:

```ts
export function Popover({ open, onOpenChange, trigger, children, className, style, disableClickToggle }: PopoverProps) {
```

Update the floating `<div>` from:

```tsx
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className={className}
              {...getFloatingProps()}
            >
```

to:

```tsx
            <div
              ref={refs.setFloating}
              style={{ ...style, ...floatingStyles }}
              className={className}
              {...getFloatingProps()}
            >
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/Popover.test.tsx`
Expected: PASS — all 3 tests pass.

- [ ] **Step 5: Wire token forwarding into `DateRangeInput`**

In `src/DateRangeInput.tsx`, update the React import from:

```ts
import { useCallback, useMemo, useState } from 'react';
```

to:

```ts
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
```

Add this import alongside the other local imports (e.g. after the `mergeSlot` import):

```ts
import { readThemeTokens } from './styles/tokens';
```

Inside the `DateRangeInput` function, after the line `const [open, setOpen] = useState(false);`, add:

```ts
  const rootRef = useRef<HTMLDivElement>(null);
  const [popoverTokens, setPopoverTokens] = useState<CSSProperties>({});

  // The popover is portalled outside `.drp-root` by FloatingPortal, so it can
  // not inherit the `--drp-*` theme tokens. Forward the resolved values onto
  // the panel when it opens. useLayoutEffect runs before paint — no unthemed
  // flash.
  useLayoutEffect(() => {
    if (open && rootRef.current) {
      setPopoverTokens(readThemeTokens(rootRef.current));
    }
  }, [open]);
```

Update the root `<div>` from:

```tsx
    <div className={mergeSlot('root', classNames)}>
```

to:

```tsx
    <div ref={rootRef} className={mergeSlot('root', classNames)}>
```

Update the `<Popover>` element from:

```tsx
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger={inputGroup}
        className={mergeSlot('popover', classNames)}
        disableClickToggle
      >
```

to:

```tsx
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger={inputGroup}
        className={mergeSlot('popover', classNames)}
        style={popoverTokens}
        disableClickToggle
      >
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: PASS — all test files green, no regressions.

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/Popover.tsx src/components/Popover.test.tsx src/DateRangeInput.tsx
git commit -m "fix: forward --drp-* theme tokens to the portalled popover

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Manual verification (after all tasks)

The token cascade and the popover backdrop cannot be verified in jsdom (it does
not compute CSS). After the tasks, in the playground (`npm run dev`):

1. The calendar popover has a white background, border, rounded corners, shadow.
2. Selecting a range: start/end days are accent-filled with light text;
   middle days have the muted range background.
3. Today is bold/accent-colored; disabled days are struck through; outside-month
   days are muted.
4. The "Theme via CSS variables" demo recolors the popover too (pink accent).
