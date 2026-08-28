# bp-mui-date-range-picker

A date range input for React that is meant to live inside someone else's design
system. It ships no design opinions it will not let you overrule: colour, shape,
size and typography come from CSS custom properties, every rendered node has a
class you can attach to, and all of it sits in a cascade layer that loses to
your stylesheet.

## Install

```bash
npm install bp-mui-date-range-picker
```

Peer dependencies: `react` and `react-dom` (18.3 or 19), and `date-fns` 4 —
`locale` takes a date-fns `Locale`, so it is part of the public type surface
rather than an implementation detail.

## Setup

```ts
import 'bp-mui-date-range-picker/styles.css';
```

**If your app declares a cascade layer order, name `bp-drp` in it.** One line,
and it matters:

```css
@layer theme, base, bp-drp, components, utilities;
```

Unlayered CSS outranks every layered rule, so a package that shipped its styles
unlayered would beat your utility classes no matter how specific they were.
Everything here is in the `bp-drp` layer instead. Where you put that layer
decides who wins:

| `bp-drp` sits… | Result |
| --- | --- |
| after `base`, before `components` | correct — the package overrides browser and preflight resets, your classes override the package |
| unnamed, registered last | the package beats your utility classes |
| unnamed, registered first | your preflight beats the package (`input { border-radius: 0 }` wins, and fields render square) |

The declaration must also be **loaded before** the package stylesheet: a layer
name takes its position the first time the browser sees it.

Apps with no layers at all need no change — everything they write is unlayered
and already outranks the package.

## Theming

Set `--drp-*` custom properties anywhere above the component. `:root` or
`<html>` is the usual place, and it is the only place that needs no extra work,
because the popover is portalled to `document.body` and inherits from there.

```css
:root {
  --drp-accent: var(--brand-500);
  --drp-radius: 4px;
  --drp-font-family: Roboto, sans-serif;
}
```

Tokens come in two levels. **Seeds** are the handful you usually set. **Part
tokens** default to a seed, so you can disagree with one detail without
restating the rest:

```css
:root {
  --drp-radius: 4px;   /* fields, popover and days all follow */
  --drp-day-radius: 50%; /* …except the days */
}
```

Substitution is lazy, so this works scoped to a subtree as well as globally.

### Scoping a theme to part of the page

Tokens set on a wrapper reach the fields by inheritance, but the popover is
portalled outside that wrapper. Point `container` back at the wrapper so it
lands inside the scope:

```tsx
const [scope, setScope] = useState<HTMLDivElement | null>(null);

<div ref={setScope} style={{ '--drp-accent': '#db2777' } as CSSProperties}>
  <DateRangeInput container={scope} />
</div>
```

A callback ref rather than `useRef`: the container has to be a real element on
the render that mounts the popover, and a ref object is still `null` then.

### Dark mode

Declare the dark values wherever your app marks the scheme, and set
`--drp-color-scheme`:

```css
:root[data-theme='dark'] {
  --drp-color-scheme: dark;
  --drp-bg: #151f2e;
  --drp-fg: #eff2f5;
  --drp-popover-bg: #1d2b3e;
}
```

`--drp-color-scheme` is not decoration. The month and year dropdowns are native
`<select>` elements and the time fields are native `<input>`s; the browser
paints their popup lists, spinners and carets from `color-scheme` and ignores
every other token here. If your app already sets `color-scheme` on `<html>`, the
default of `inherit` picks it up and you need nothing.

### Tokens

<!-- tokens:start -->

Seeds — set these first; everything else follows.

| Token | Default |
| --- | --- |
| `--drp-accent` | `#4f46e5` |
| `--drp-accent-fg` | `#ffffff` |
| `--drp-bg` | `#ffffff` |
| `--drp-fg` | `#18181b` |
| `--drp-muted-fg` | `#a1a1aa` |
| `--drp-border` | `#d4d4d8` |
| `--drp-hover-bg` | `#f4f4f5` |
| `--drp-radius` | `0.375rem` |
| `--drp-gap` | `0.5rem` |
| `--drp-transition` | `150ms ease` |
| `--drp-font-family` | `inherit` |
| `--drp-font-size` | `0.875rem` |
| `--drp-line-height` | `1.5` |
| `--drp-font-size-sm` | `0.75rem` |
| `--drp-font-weight-medium` | `500` |
| `--drp-color-scheme` | `inherit` |
| `--drp-disabled-fg` | `#d4d4d8` |
| `--drp-invalid-border` | `#ef4444` |
| `--drp-invalid-ring` | `#fecaca` |
| `--drp-focus-ring` | `#c7d2fe` |
| `--drp-focus-ring-width` | `2px` |
| `--drp-input-group-bg` | `transparent` |
| `--drp-input-group-border-color` | `transparent` |
| `--drp-input-group-border-width` | `0` |
| `--drp-input-group-height` | `auto` |
| `--drp-input-group-padding-x` | `0` |
| `--drp-input-border-width` | `1px` |
| `--drp-input-height` | `2.25rem` |
| `--drp-input-width` | `auto` |
| `--drp-input-padding-x` | `0.75rem` |
| `--drp-input-text-align` | `start` |
| `--drp-popover-shadow` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` |
| `--drp-popover-z-index` | `50` |
| `--drp-panel-padding` | `0.75rem` |
| `--drp-shortcuts-width` | `10rem` |
| `--drp-shortcut-active-bg` | `#eef2ff` |
| `--drp-shortcut-active-fg` | `#4338ca` |
| `--drp-months-gap` | `2rem` |
| `--drp-nav-button-size` | `1.75rem` |
| `--drp-day-size` | `2.25rem` |
| `--drp-day-range-bg` | `#e0e7ff` |
| `--drp-day-range-fg` | `#312e81` |
| `--drp-time-input-width` | `3rem` |
| `--drp-time-input-height` | `2rem` |

Part tokens — each defaults to a seed, override one to disagree with a detail.

| Token | Default |
| --- | --- |
| `--drp-input-group-gap` | `var(--drp-gap)` |
| `--drp-input-group-border-hover` | `var(--drp-input-group-border-color)` |
| `--drp-input-group-border-focus` | `var(--drp-input-group-border-color)` |
| `--drp-input-group-border-width-focus` | `var(--drp-input-group-border-width)` |
| `--drp-input-group-radius` | `var(--drp-radius)` |
| `--drp-input-bg` | `var(--drp-bg)` |
| `--drp-input-fg` | `var(--drp-fg)` |
| `--drp-input-placeholder-fg` | `var(--drp-muted-fg)` |
| `--drp-input-border-color` | `var(--drp-border)` |
| `--drp-input-border-hover` | `var(--drp-input-border-color)` |
| `--drp-input-border-focus` | `var(--drp-accent)` |
| `--drp-input-border-width-focus` | `var(--drp-input-border-width)` |
| `--drp-input-radius` | `var(--drp-radius)` |
| `--drp-input-disabled-bg` | `var(--drp-input-bg)` |
| `--drp-separator-fg` | `var(--drp-muted-fg)` |
| `--drp-popover-bg` | `var(--drp-bg)` |
| `--drp-popover-fg` | `var(--drp-fg)` |
| `--drp-popover-border-color` | `var(--drp-border)` |
| `--drp-popover-radius` | `var(--drp-radius)` |
| `--drp-shortcut-fg` | `var(--drp-fg)` |
| `--drp-shortcut-hover-bg` | `var(--drp-hover-bg)` |
| `--drp-shortcut-radius` | `var(--drp-radius)` |
| `--drp-caption-fg` | `var(--drp-fg)` |
| `--drp-weekday-fg` | `var(--drp-muted-fg)` |
| `--drp-dropdown-bg` | `var(--drp-bg)` |
| `--drp-dropdown-fg` | `var(--drp-fg)` |
| `--drp-dropdown-border-color` | `var(--drp-border)` |
| `--drp-dropdown-radius` | `var(--drp-radius)` |
| `--drp-nav-fg` | `var(--drp-fg)` |
| `--drp-nav-hover-bg` | `var(--drp-hover-bg)` |
| `--drp-nav-radius` | `var(--drp-radius)` |
| `--drp-day-radius` | `var(--drp-radius)` |
| `--drp-day-hover-bg` | `var(--drp-hover-bg)` |
| `--drp-day-selected-bg` | `var(--drp-accent)` |
| `--drp-day-selected-fg` | `var(--drp-accent-fg)` |
| `--drp-day-today-fg` | `var(--drp-accent)` |
| `--drp-day-disabled-fg` | `var(--drp-disabled-fg)` |
| `--drp-day-outside-fg` | `var(--drp-muted-fg)` |
| `--drp-time-input-bg` | `var(--drp-input-bg)` |
| `--drp-time-input-fg` | `var(--drp-input-fg)` |
| `--drp-time-input-border-color` | `var(--drp-input-border-color)` |
| `--drp-time-input-radius` | `var(--drp-input-radius)` |

<!-- tokens:end -->

## Slots

Every rendered node carries a stable `drp-*` class, and `classNames` adds your
own alongside it:

```tsx
<DateRangeInput
  classNames={{
    day: 'transition-transform hover:scale-110',
    dayRangeMiddle: 'bg-indigo-100',
  }}
/>
```

Your classes are passed through untouched, in order. The package does not
rewrite them — it cannot know which Tailwind major you are on, and its own
defaults are `drp-*` classes that no conflict resolver has anything to say
about. What settles a conflict is the cascade, which is what the layer above is
for.

See the `Slot` type for the full list. `day` is the day button; `dayCell` is the
table cell around it, and that is what carries the size of the grid.

## Usage

```tsx
import { useState } from 'react';
import { DateRangeInput, type DateRange } from 'bp-mui-date-range-picker';

function Example() {
  const [range, setRange] = useState<DateRange>([null, null]);
  return (
    <DateRangeInput
      value={range}
      onChange={setRange}
      shortcuts
      placeholder={{ start: 'Start', end: 'End' }}
    />
  );
}
```

### Props

Beyond the ones below, `DateRangeInputProps` extends the root `<div>`'s props,
so `className`, `style`, `id`, `ref`, `data-*` and `aria-*` all land on it.

| Prop | Default | |
| --- | --- | --- |
| `value` / `defaultValue` / `onChange` | — | the range, as a `[Date \| null, Date \| null]` tuple |
| `open` / `defaultOpen` / `onOpenChange` | `false` | popover state, controlled or not |
| `numberOfMonths` | `2` | how many months to show |
| `linkedNavigation` | `true` | one grid stepping together, or independent grids |
| `separator` | `'→'` | node between the fields; `null` removes it |
| `shortcuts` | `false` | `true` for the built-in presets, or your own list |
| `closeOnSelection` | `false` | close once a complete range is picked |
| `allowSingleDayRange` | `false` | treat a single day as a complete range |
| `timePrecision` | — | `'minute'` or `'second'` to add time fields |
| `minDate` / `maxDate` / `disabledDays` | — | bounds and exclusions |
| `locale` / `formatDate` / `parseDate` | — | date-fns locale and custom formatting |
| `container` | `document.body` | node the popover portals into |
| `classNames` | — | per-slot class overrides |

## Development

```bash
npm run dev       # playground, including skins that reproduce two host
                  # design systems from tokens alone
npm run verify    # typecheck against @types/react 19 and 18, then tests
```

The playground's `skins.css` is the real acceptance test for the theming
contract: if a design cannot be reached from there without a slot override, the
token vocabulary is missing something.

## License

MIT
