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
| `--drp-dropdown-padding-x` | `0.5rem` |
| `--drp-dropdown-padding-y` | `0.125rem` |
| `--drp-dropdown-caret-size` | `0.6rem` |
| `--drp-dropdown-caret` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5l5-5' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")` |
| `--drp-nav-button-size` | `1.75rem` |
| `--drp-day-size` | `2.25rem` |
| `--drp-day-range-bg` | `#e0e7ff` |
| `--drp-day-range-fg` | `#312e81` |
| `--drp-time-input-width` | `3rem` |
| `--drp-time-input-height` | `2rem` |
| `--drp-time-divider-width` | `0.75rem` |
| `--drp-time-arrow-height` | `1.25rem` |

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
| `--drp-dropdowns-gap` | `var(--drp-gap)` |
| `--drp-dropdown-caret-inset` | `var(--drp-dropdown-padding-x)` |
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
| `--drp-time-arrow-color` | `var(--drp-muted-fg)` |
| `--drp-time-arrow-hover-color` | `var(--drp-fg)` |

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

### Shortcuts

`shortcuts={true}` gives you five presets in English. That is the quick start,
and English is the only language it speaks.

For anything else — a translation, a different set, a different order, or a
preset of your own — build the list yourself. The package exports the range
arithmetic separately from the labels, so you do not have to reimplement "the
last seven days" just to rename it:

```tsx
import { DateRangeInput, shortcutRanges } from 'bp-mui-date-range-picker';
import { ru } from 'date-fns/locale/ru';

<DateRangeInput
  locale={ru}
  shortcuts={[
    { label: 'Сегодня', range: shortcutRanges.today() },
    { label: 'Неделю назад', range: shortcutRanges.last7Days() },
    { label: 'Эта неделя', range: shortcutRanges.thisWeek(new Date(), ru) },
    { label: 'Квартал', range: myOwnQuarter() },
  ]}
/>;
```

`today`, `last7Days`, `last30Days`, `thisWeek` and `thisMonth` each take
`(now?)` and return a `[Date, Date]`. Pass the locale to `thisWeek` — weeks
start on Sunday by default, and a calendar rendered with `ru` starts them on
Monday, so without it the shortcut disagrees with the grid beside it.

### Time

`timePrecision` puts an hours/minutes editor under the calendar — one per
boundary — and widens the text pattern to match:

| `timePrecision` | pattern |
| --- | --- |
| — | `2026-05-20` |
| `'minute'` | `2026-05-20 09:05` |
| `'second'` | `2026-05-20 09:05:30` |

A day and its clock are edited independently. Picking a day in the calendar, or
retyping just the date part of a field, keeps the time that boundary already
had. A boundary getting its **first** date opens the day for `start`
(`00:00:00.000`) and closes it for `end` (`23:59:59.999`), so two clicks give
you the whole span rather than a zero-length one at midnight.

The clock can be set before the day. A boundary with no date yet still shows
the clock it would open with, and dialling it picks the day too:

| what is already picked | the day the clock lands on |
| --- | --- |
| nothing | today |
| the other end | the day beside it — a start before its end, an end after its start |
| the other end, under `allowSingleDayRange` | that same day |

`showArrowButtons` puts a step button above and below each field. Off by
default; the fields take <kbd>↑</kbd>/<kbd>↓</kbd> either way, and stepping
wraps round the unit rather than sticking at its ends (23 steps up to 00).

A typed field commits when it is left or on <kbd>Enter</kbd>, not on every
keystroke — otherwise typing `14` would publish the hour `1` on the way there.

The field is forgiving about an under-specified clock. At `'second'` precision
both of these are accepted:

```
2026-05-20 14:30   ->  14:30:00
2026-05-20         ->  this day, at the time this boundary already had
```

Shortcuts set their own times — "today" means the whole of today, not today at
whatever hour you last dialled in. A boundary with no date yet shows its time
fields disabled: there is no clock to edit until a day exists, and editing one
would have to invent the day too.

### Date order and separator

The fields default to `yyyy-MM-dd`. `datePattern` takes a date-fns pattern for
the date half instead, and is used both to write the fields and to read them
back, so display and parsing cannot drift apart:

```tsx
<DateRangeInput datePattern="dd/MM/yyyy" />           // 20/05/2026
<DateRangeInput datePattern="dd-MM-yyyy" />           // 20-05-2026
<DateRangeInput datePattern="dd.MM.yyyy" />           // 20.05.2026
<DateRangeInput datePattern="MM/dd/yyyy" />           // 05/20/2026
<DateRangeInput datePattern="dd/MM/yyyy" timePrecision="minute" />
                                                     // 20/05/2026 09:05
```

Everything above still holds under it: `timePrecision` appends the clock, and
the forgiveness about an under-specified one survives the change of pattern —
`20/05/2026` on its own keeps the time that boundary already had.

The clock itself is fixed at `HH:mm(:ss)`, because the time fields beside it are
numeric 24-hour controls: a 12-hour text pattern would name a clock the picker
cannot set. For anything `datePattern` cannot express, `formatDate` /
`parseDate` still override the pattern completely, and a `parseDate` of your own
owns the time in whatever it returns.

### Props

Beyond the ones below, `DateRangeInputProps` extends the root `<div>`'s props,
so `className`, `style`, `id`, `ref`, `data-*` and `aria-*` all land on it.

| Prop | Default | |
| --- | --- | --- |
| `value` / `defaultValue` / `onChange` | — | the range, as a `[Date \| null, Date \| null]` tuple |
| `open` / `defaultOpen` / `onOpenChange` | `false` | popover state, controlled or not |
| `numberOfMonths` | `2` | how many months to show |
| `linkedNavigation` | `true` | one grid stepping together, or independent grids |
| `separator` | `'—'` | node between the fields; `null` removes it |
| `shortcuts` | `false` | `true` for the built-in presets, or your own list |
| `closeOnSelection` | `false` | close once a complete range is picked |
| `allowSingleDayRange` | `false` | treat a single day as a complete range |
| `timePrecision` | — | `'minute'` or `'second'` to add time fields, and widen the text pattern |
| `showArrowButtons` | `false` | a step button above and below each time field |
| `minDate` / `maxDate` / `disabledDays` | — | bounds and exclusions |
| `datePattern` | `'yyyy-MM-dd'` | date-fns pattern for the date half of the fields |
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
