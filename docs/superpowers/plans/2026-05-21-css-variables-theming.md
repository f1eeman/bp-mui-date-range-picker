# CSS-Variables Theming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the library's appearance themeable via CSS custom properties (no Tailwind required), while keeping the existing slot-based `classNames` overrides — slot overrides always win.

**Architecture:** The library ships a hand-written `styles.css`: each component part carries a stable `drp-*` class, and `styles.css` styles those classes using `var(--drp-*)` tokens, with every selector wrapped in `:where()` (zero specificity) so any consumer `classNames` override outranks it. The Tailwind utility defaults are replaced by these `drp-*` base classes.

**Tech Stack:** TypeScript, React 19, react-day-picker v9, tsup, Vitest + React Testing Library, plain CSS.

---

## File Structure

```
src/styles.css                          — NEW: shipped themeable stylesheet (tokens + :where() rules)
src/styles.test.ts                       — NEW: content-sanity test for styles.css
tsup.config.ts                           — copy styles.css into dist/ on build
package.json                             — add the ./styles.css export
src/styles/defaultClassNames.ts          — Tailwind strings -> stable drp-* classes
src/utils/mergeClassNames.test.ts         — rewrite for the drp-* base-class model
src/components/RangeCalendar.tsx          — rdpClassNames maps to drp-* classes (no Tailwind extras)
src/DateRangeInput.test.tsx               — add drp-* base-class assertions
playground/main.tsx, playground/App.tsx   — import styles.css; add a --drp-* theming demo
README.md                                 — document styles.css import + the token table
```

The `drp-*` class for each slot is `drp-` + the kebab-cased slot name (e.g. `daySelected` → `drp-day-selected`, `inputInvalid` → `drp-input-invalid`). The full map is locked in Task 2.

Three tasks: Task 1 creates and ships `styles.css` (an asset, inert until wired). Task 2 switches all class emission to `drp-*` so the stylesheet takes effect. Task 3 wires the playground and docs.

---

## Task 1: Create and ship `styles.css`

**Files:**
- Create: `src/styles.css`
- Create: `src/styles.test.ts`
- Modify: `tsup.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test in `src/styles.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('styles.css', () => {
  const css = readFileSync('src/styles.css', 'utf8');

  it('defines the theme tokens on .drp-root', () => {
    expect(css).toContain('.drp-root');
    expect(css).toContain('--drp-accent:');
    expect(css).toContain('--drp-radius:');
    expect(css).toContain('--drp-day-size:');
  });

  it('styles parts through zero-specificity :where() selectors', () => {
    expect(css).toContain(':where(.drp-input)');
    expect(css).toContain(':where(.drp-day-selected)');
  });

  it('drives styled values from --drp-* tokens', () => {
    expect(css).toContain('var(--drp-accent');
    expect(css).toContain('var(--drp-border');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/styles.test.ts`
Expected: FAIL — `src/styles.css` does not exist (`ENOENT`). Confirm before continuing.

- [ ] **Step 3: Create `src/styles.css`**

```css
/* bp-mui-date-range-picker — themeable styles.
   Import once in your app:  import 'bp-mui-date-range-picker/styles.css';
   Retheme by overriding any --drp-* token (globally, on a wrapper, or per
   instance via style={{ '--drp-accent': '...' }}).
   Every rule is wrapped in :where() (zero specificity) so any class passed
   through the `classNames` prop overrides it. */

.drp-root {
  /* colors */
  --drp-accent: #4f46e5;
  --drp-accent-fg: #ffffff;
  --drp-bg: #ffffff;
  --drp-fg: #18181b;
  --drp-muted-fg: #a1a1aa;
  --drp-border: #d4d4d8;
  --drp-hover-bg: #f4f4f5;
  --drp-range-bg: #e0e7ff;
  --drp-range-fg: #312e81;
  --drp-today-fg: #4f46e5;
  --drp-disabled-fg: #d4d4d8;
  --drp-shortcut-active-bg: #eef2ff;
  --drp-shortcut-active-fg: #4338ca;
  --drp-invalid-border: #ef4444;
  --drp-invalid-ring: #fecaca;
  --drp-focus-ring: #c7d2fe;
  /* shape & size */
  --drp-radius: 0.375rem;
  --drp-day-size: 2.25rem;
  --drp-input-height: 2.25rem;
  --drp-nav-button-size: 1.75rem;
  --drp-popover-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --drp-panel-padding: 0.75rem;
  --drp-shortcuts-width: 10rem;
  --drp-gap: 0.5rem;
  /* typography */
  --drp-font-family: inherit;
  --drp-font-size: 0.875rem;
  --drp-font-size-sm: 0.75rem;
  --drp-font-weight-medium: 500;
}

:where(.drp-root) {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  font-family: var(--drp-font-family);
}

:where(.drp-input-group) {
  display: inline-flex;
  align-items: center;
  gap: var(--drp-gap);
}

:where(.drp-input) {
  height: var(--drp-input-height);
  box-sizing: border-box;
  border: 1px solid var(--drp-border);
  border-radius: var(--drp-radius);
  background: var(--drp-bg);
  padding: 0 0.75rem;
  font-size: var(--drp-font-size);
  color: var(--drp-fg);
  outline: none;
}
:where(.drp-input:focus) {
  border-color: var(--drp-accent);
  box-shadow: 0 0 0 2px var(--drp-focus-ring);
}
:where(.drp-input-invalid) {
  border-color: var(--drp-invalid-border);
}
:where(.drp-input-invalid:focus) {
  border-color: var(--drp-invalid-border);
  box-shadow: 0 0 0 2px var(--drp-invalid-ring);
}

:where(.drp-separator) {
  color: var(--drp-muted-fg);
}

:where(.drp-popover) {
  z-index: 50;
  border: 1px solid var(--drp-border);
  border-radius: var(--drp-radius);
  background: var(--drp-bg);
  box-shadow: var(--drp-popover-shadow);
}

:where(.drp-panel) {
  display: flex;
}

:where(.drp-shortcuts-panel) {
  display: flex;
  width: var(--drp-shortcuts-width);
  flex-direction: column;
  gap: 0.25rem;
  border-right: 1px solid var(--drp-border);
  padding: 0.5rem;
}
:where(.drp-shortcut) {
  border: none;
  background: none;
  border-radius: var(--drp-radius);
  padding: 0.25rem 0.5rem;
  text-align: left;
  font-size: var(--drp-font-size);
  color: var(--drp-fg);
  cursor: pointer;
}
:where(.drp-shortcut:hover) {
  background: var(--drp-hover-bg);
}
:where(.drp-shortcut-active) {
  background: var(--drp-shortcut-active-bg);
  color: var(--drp-shortcut-active-fg);
  font-weight: var(--drp-font-weight-medium);
}

:where(.drp-calendar) {
  padding: var(--drp-panel-padding);
}
:where(.drp-month) {
  position: relative;
}
:where(.drp-month) > * + * {
  margin-top: 0.5rem;
}
:where(.drp-caption) {
  display: flex;
  justify-content: center;
  padding: 0 var(--drp-nav-button-size);
  font-size: var(--drp-font-size);
  font-weight: var(--drp-font-weight-medium);
  color: var(--drp-fg);
}
/* rdp renders a redundant label span next to the dropdowns — hidden */
:where(.drp-caption-label) {
  display: none;
}
:where(.drp-dropdowns) {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
:where(.drp-dropdown) {
  border: 1px solid var(--drp-border);
  border-radius: var(--drp-radius);
  background: var(--drp-bg);
  padding: 0.125rem 0.25rem;
  font-size: var(--drp-font-size);
  color: var(--drp-fg);
}

:where(.drp-nav-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--drp-nav-button-size);
  height: var(--drp-nav-button-size);
  border: none;
  background: none;
  border-radius: var(--drp-radius);
  color: var(--drp-fg);
  cursor: pointer;
}
:where(.drp-nav-button:hover) {
  background: var(--drp-hover-bg);
}
:where(.drp-nav-button--prev) {
  position: absolute;
  left: 0;
  top: 0;
}
:where(.drp-nav-button--next) {
  position: absolute;
  right: 0;
  top: 0;
}

:where(.drp-weekday) {
  font-size: var(--drp-font-size-sm);
  font-weight: 400;
  color: var(--drp-muted-fg);
}

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
:where(.drp-day:hover) {
  background: var(--drp-hover-bg);
}
:where(.drp-day-selected),
:where(.drp-day-range-start),
:where(.drp-day-range-end) {
  background: var(--drp-accent);
  color: var(--drp-accent-fg);
}
:where(.drp-day-range-middle) {
  background: var(--drp-range-bg);
  color: var(--drp-range-fg);
}
:where(.drp-day-today) {
  font-weight: 600;
  color: var(--drp-today-fg);
}
:where(.drp-day-disabled) {
  color: var(--drp-disabled-fg);
  text-decoration: line-through;
  cursor: default;
}
:where(.drp-day-outside) {
  color: var(--drp-muted-fg);
}

:where(.drp-time-picker) {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border-top: 1px solid var(--drp-border);
  padding: 0.5rem;
}
:where(.drp-time-picker-input) {
  width: 3rem;
  height: 2rem;
  border: 1px solid var(--drp-border);
  border-radius: var(--drp-radius);
  text-align: center;
  font-size: var(--drp-font-size);
  color: var(--drp-fg);
  background: var(--drp-bg);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/styles.test.ts`
Expected: PASS — all 3 tests green.

- [ ] **Step 5: Copy `styles.css` into `dist/` on build — modify `tsup.config.ts`**

The file currently is:

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

Replace it with (adds an `onSuccess` hook that copies the stylesheet):

```ts
import { defineConfig } from 'tsup';
import { copyFile } from 'node:fs/promises';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom'],
  async onSuccess() {
    await copyFile('src/styles.css', 'dist/styles.css');
  },
});
```

- [ ] **Step 6: Add the `./styles.css` export — modify `package.json`**

The `exports` field currently is:

```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
```

Change it to add the stylesheet entry:

```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./styles.css": "./dist/styles.css"
  },
```

- [ ] **Step 7: Verify the build emits the stylesheet**

Run: `npm run build`
Expected: success, no errors; `dist/styles.css` exists after the build (the `onSuccess` hook copied it).

- [ ] **Step 8: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: PASS — all tests green (the 3 new `styles.test.ts` tests plus the existing suite; nothing else is affected because no component uses the `drp-*` classes yet).

Run: `npx tsc --noEmit`
Expected: PASS — no errors.

- [ ] **Step 9: Commit**

```bash
git add src/styles.css src/styles.test.ts tsup.config.ts package.json
git commit -m "feat: ship themeable styles.css with --drp-* tokens"
```

---

## Task 2: Switch class emission to the `drp-*` classes

**Files:**
- Modify: `src/styles/defaultClassNames.ts`
- Modify: `src/components/RangeCalendar.tsx`
- Modify: `src/utils/mergeClassNames.test.ts`
- Test: `src/DateRangeInput.test.tsx`

After this task the component parts carry their stable `drp-*` classes, so the `styles.css` from Task 1 actually takes effect.

- [ ] **Step 1: Write the failing tests in `src/DateRangeInput.test.tsx`**

Add these two tests inside the existing `describe('DateRangeInput', ...)` block:

```tsx
  it('applies the drp-* base classes to its parts', () => {
    const { container } = render(<DateRangeInput placeholder={{ start: 'from', end: 'to' }} />);
    expect(container.querySelector('.drp-root')).not.toBeNull();
    expect(container.querySelector('.drp-input')).not.toBeNull();
  });

  it('appends a consumer slot class onto the base class', () => {
    render(
      <DateRangeInput
        placeholder={{ start: 'from', end: 'to' }}
        classNames={{ input: 'my-custom-input' }}
      />,
    );
    const input = screen.getByPlaceholderText('from');
    expect(input.className).toContain('drp-input');
    expect(input.className).toContain('my-custom-input');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/DateRangeInput.test.tsx`
Expected: FAIL — the two new tests fail because the parts currently carry Tailwind utility classes, not `drp-*` classes. Confirm RED before implementing.

- [ ] **Step 3: Replace `src/styles/defaultClassNames.ts`**

Replace the entire file content with:

```ts
import type { Slot } from '../types';

/** The stable `drp-*` base class for every slot. `styles.css` styles these
 *  classes; consumer `classNames` overrides are merged on top of them. */
export const defaultClassNames: Record<Slot, string> = {
  root: 'drp-root',
  inputGroup: 'drp-input-group',
  input: 'drp-input',
  inputStart: 'drp-input-start',
  inputEnd: 'drp-input-end',
  inputInvalid: 'drp-input-invalid',
  separator: 'drp-separator',
  popover: 'drp-popover',
  panel: 'drp-panel',
  shortcutsPanel: 'drp-shortcuts-panel',
  shortcut: 'drp-shortcut',
  shortcutActive: 'drp-shortcut-active',
  calendar: 'drp-calendar',
  month: 'drp-month',
  caption: 'drp-caption',
  dropdowns: 'drp-dropdowns',
  dropdown: 'drp-dropdown',
  navButton: 'drp-nav-button',
  weekday: 'drp-weekday',
  week: 'drp-week',
  day: 'drp-day',
  daySelected: 'drp-day-selected',
  dayRangeStart: 'drp-day-range-start',
  dayRangeEnd: 'drp-day-range-end',
  dayRangeMiddle: 'drp-day-range-middle',
  dayToday: 'drp-day-today',
  dayDisabled: 'drp-day-disabled',
  dayOutside: 'drp-day-outside',
  timePicker: 'drp-time-picker',
  timePickerInput: 'drp-time-picker-input',
};
```

- [ ] **Step 4: Rework `rdpClassNames` in `src/components/RangeCalendar.tsx`**

The `rdpClassNames` function currently maps slots to rdp keys and carries Tailwind "extras" (`'rdp-root'`, `caption_label: 'hidden'`, `'absolute left-0 top-0'` / `'absolute right-0 top-0'` on the nav buttons). Replace the whole `rdpClassNames` function with:

```ts
/**
 * Maps the library's slot classes onto react-day-picker v9's classNames keys.
 * The `rdp-root` extra is kept so a stable selector survives consumer overrides.
 * `caption_label` is mapped to `drp-caption-label`, which `styles.css` hides.
 * The nav buttons get side modifiers (`drp-nav-button--prev/--next`) that
 * `styles.css` positions for `navLayout="around"`.
 */
function rdpClassNames(classNames?: ClassNames): Record<string, string> {
  return {
    root: mergeSlot('calendar', classNames, 'rdp-root'),     // UI.Root
    month: mergeSlot('month', classNames),                   // UI.Month
    month_caption: mergeSlot('caption', classNames),         // UI.MonthCaption
    dropdowns: mergeSlot('dropdowns', classNames),           // UI.Dropdowns
    dropdown: mergeSlot('dropdown', classNames),             // UI.Dropdown
    caption_label: 'drp-caption-label',                      // UI.CaptionLabel (hidden via styles.css)
    button_previous: mergeSlot('navButton', classNames, 'drp-nav-button--prev'), // UI.PreviousMonthButton
    button_next: mergeSlot('navButton', classNames, 'drp-nav-button--next'),     // UI.NextMonthButton
    weekday: mergeSlot('weekday', classNames),               // UI.Weekday
    week: mergeSlot('week', classNames),                     // UI.Week
    day_button: mergeSlot('day', classNames),                // UI.DayButton
    selected: mergeSlot('daySelected', classNames),          // SelectionState.selected
    range_start: mergeSlot('dayRangeStart', classNames),     // SelectionState.range_start
    range_end: mergeSlot('dayRangeEnd', classNames),         // SelectionState.range_end
    range_middle: mergeSlot('dayRangeMiddle', classNames),   // SelectionState.range_middle
    today: mergeSlot('dayToday', classNames),                // DayFlag.today
    disabled: mergeSlot('dayDisabled', classNames),          // DayFlag.disabled
    outside: mergeSlot('dayOutside', classNames),            // DayFlag.outside
  };
}
```

Nothing else in `RangeCalendar.tsx` changes (`navLayout="around"`, `captionLayout`, the `shared` object, etc. stay as they are).

- [ ] **Step 5: Rewrite `src/utils/mergeClassNames.test.ts`**

Replace the entire `describe('mergeSlot', ...)` block with:

```ts
import { describe, it, expect } from 'vitest';
import { mergeSlot } from './mergeClassNames';

describe('mergeSlot', () => {
  it('returns the slot base class when no override is given', () => {
    expect(mergeSlot('separator')).toBe('drp-separator');
  });

  it('appends a consumer override onto the base class', () => {
    const result = mergeSlot('separator', { separator: 'text-red-500' });
    expect(result).toContain('drp-separator');
    expect(result).toContain('text-red-500');
  });

  it('resolves Tailwind conflicts among the consumer classes (later wins)', () => {
    const result = mergeSlot('input', { input: 'p-2' }, 'p-4');
    expect(result).toContain('drp-input');
    expect(result).toContain('p-4');
    expect(result).not.toContain('p-2');
  });

  it('ignores falsy extra classes', () => {
    expect(mergeSlot('input', undefined, false, 'ring-2')).toBe('drp-input ring-2');
  });
});
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/DateRangeInput.test.tsx src/utils/mergeClassNames.test.ts src/components/RangeCalendar.test.tsx`
Expected: PASS — the two new `DateRangeInput` tests, the rewritten `mergeSlot` tests, and the existing `RangeCalendar` tests all green.

If a `RangeCalendar` test fails: the nav DOM-order tests are behavioral (button position in the DOM, from `navLayout="around"`) and must still pass; the `.rdp-caption_label` test asserts that class is absent — it stays absent because `caption_label` now maps to `drp-caption-label`. If something genuinely broke, report it rather than weakening a test.

- [ ] **Step 7: Run the full suite, typecheck, and build**

Run: `npx vitest run`
Expected: PASS — every test green. (Behavioral tests are unaffected; only class-based assertions changed, and those were updated above.)

Run: `npx tsc --noEmit`
Expected: PASS — no errors.

Run: `npm run build`
Expected: success — `dist/` rebuilt including `dist/styles.css`, no errors or warnings.

- [ ] **Step 8: Commit**

```bash
git add src/styles/defaultClassNames.ts src/components/RangeCalendar.tsx src/utils/mergeClassNames.test.ts src/DateRangeInput.test.tsx
git commit -m "feat: emit stable drp-* classes for css-variable theming"
```

---

## Task 3: Playground demo and README

**Files:**
- Modify: `playground/main.tsx`
- Modify: `playground/App.tsx`
- Modify: `README.md`

No automated tests — verification is that the playground builds and the README is accurate.

- [ ] **Step 1: Import the stylesheet in `playground/main.tsx`**

The file currently imports the playground's own CSS:

```tsx
import './styles.css';
```

Add the library stylesheet import right above it:

```tsx
import '../src/styles.css';
import './styles.css';
```

- [ ] **Step 2: Add a CSS-variable theming demo in `playground/App.tsx`**

`App.tsx` currently renders a heading, a contiguous-toggle, a controlled `DateRangeInput`, a `<pre>`, an `<h2>Custom styling</h2>`, and a second `DateRangeInput` with `classNames`. After the second `DateRangeInput`, add a third section demonstrating token theming:

```tsx
      <h2 className="text-lg font-medium">Theme via CSS variables</h2>
      <div style={{ '--drp-accent': '#db2777', '--drp-radius': '12px' } as React.CSSProperties}>
        <DateRangeInput placeholder={{ start: 'From', end: 'To' }} />
      </div>
```

Ensure `React` is imported in `App.tsx` (the `as React.CSSProperties` cast needs it). The file currently imports `{ useState }` from `'react'`; change that import to also bring the namespace:

```tsx
import { useState } from 'react';
import type { CSSProperties } from 'react';
```

and use `as CSSProperties` instead of `as React.CSSProperties`:

```tsx
      <div style={{ '--drp-accent': '#db2777', '--drp-radius': '12px' } as CSSProperties}>
        <DateRangeInput placeholder={{ start: 'From', end: 'To' }} />
      </div>
```

- [ ] **Step 3: Verify the playground builds**

Run: `npx vite build --config playground/vite.config.ts`
Expected: success — no errors. (`../src/styles.css` resolves and is bundled.)

Run: `npm run typecheck`
Expected: PASS — no errors.

- [ ] **Step 4: Update `README.md`**

Replace the `## Tailwind setup` section with a `## Styling` section. The current section is:

````markdown
## Tailwind setup

This library ships raw Tailwind classes. Your app must use Tailwind v4 and
include the library in its source scan so the utility classes are generated:

```css
@import "tailwindcss";
@source "../node_modules/bp-mui-date-range-picker/dist";
```
````

Replace it with:

````markdown
## Styling

Import the stylesheet once:

```ts
import 'bp-mui-date-range-picker/styles.css';
```

The component is themed with CSS custom properties — override any `--drp-*`
token globally, on a wrapper, or per instance. No Tailwind required.

```css
.my-app {
  --drp-accent: #db2777;
  --drp-radius: 12px;
}
```

Per-instance:

```tsx
<div style={{ '--drp-accent': '#16a34a' } as React.CSSProperties}>
  <DateRangeInput />
</div>
```

Tokens: colors (`--drp-accent`, `--drp-accent-fg`, `--drp-bg`, `--drp-fg`,
`--drp-muted-fg`, `--drp-border`, `--drp-hover-bg`, `--drp-range-bg`,
`--drp-range-fg`, `--drp-today-fg`, `--drp-disabled-fg`,
`--drp-shortcut-active-bg`, `--drp-shortcut-active-fg`, `--drp-invalid-border`,
`--drp-invalid-ring`, `--drp-focus-ring`), shape/size (`--drp-radius`,
`--drp-day-size`, `--drp-input-height`, `--drp-nav-button-size`,
`--drp-popover-shadow`, `--drp-panel-padding`, `--drp-shortcuts-width`,
`--drp-gap`), typography (`--drp-font-family`, `--drp-font-size`,
`--drp-font-size-sm`, `--drp-font-weight-medium`).
````

In the existing `## Styling` section that documents the `classNames` slot
overrides, keep it but rename its heading to `## Slot overrides` so the two
sections do not collide, and add one sentence at its end:

```markdown
Slot classes always win over the `--drp-*` theme (the base styles use
zero-specificity `:where()` selectors).
```

- [ ] **Step 5: Commit**

```bash
git add playground/main.tsx playground/App.tsx README.md
git commit -m "docs: playground theming demo and styling README"
```

---

## Self-Review Notes

- **Spec coverage:** §1 two-layer architecture — `styles.css` with `:where()` (Task 1) + `drp-*` base classes emitted by `defaultClassNames`/`rdpClassNames` (Task 2); slots win via zero specificity (inherent to `:where()`). §2 ~28 tokens — all defined on `.drp-root` in Task 1's `styles.css`. §3 code changes — `styles.css` (T1), build copy + `exports` (T1), `defaultClassNames` → `drp-*` (T2), `mergeClassNames` test rewrite (T2), `RangeCalendar.rdpClassNames` rework (T2), playground + README (T3); `react-day-picker/style.css` import in `RangeCalendar` is left untouched; `src/types.ts` unchanged. §5 testing — `styles.css` content test (T1), `mergeSlot` rewrite + `drp-*` component assertions (T2), existing behavioral tests stay green, build emits `dist/styles.css` (T1/T2).
- **Placeholder scan:** no TBDs; `styles.css`, `defaultClassNames.ts`, `rdpClassNames`, and all tests are given in full.
- **Type consistency:** every `Slot` value maps to exactly one `drp-*` class in `defaultClassNames` (Task 2); `rdpClassNames` consumes those via `mergeSlot` with the same slot names; `drp-caption-label`, `drp-nav-button--prev`, `drp-nav-button--next` appear identically in `styles.css` (Task 1) and `rdpClassNames` (Task 2).
- **`mergeSlot` unchanged:** the function body (`twMerge(clsx(defaultClassNames[slot], overrides?.[slot], ...extra))`) still works — `tailwind-merge` passes the non-Tailwind `drp-*` class through and still dedupes Tailwind utilities among consumer overrides; only `mergeClassNames.test.ts` is rewritten, not `mergeClassNames.ts`.
