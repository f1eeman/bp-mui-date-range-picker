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

### If you use Tailwind, you have layers whether you declared them or not

Tailwind 3 emits preflight unlayered, and unlayered beats every layered rule.
So `*, ::before, ::after { border-width: 0 }` and
`button, input, … { padding: 0 }` outrank `bp-drp`, and the fields arrive with
no border and no inner padding. The tokens still apply, which makes it read
like a theming problem rather than a cascade one: `--drp-input-border-width`
computes to `1px` while the border computes to `0px`.

Put preflight in a named layer and order `bp-drp` after it:

```css
/* index.html <head>, before any stylesheet */
<style>@layer tw-preflight, bp-drp;</style>
```

```css
/* your CSS entry */
@layer tw-preflight {
  @tailwind base;
}
@tailwind components;   /* leave these unlayered so utilities still win */
@tailwind utilities;
```

The order declaration belongs in the document head, not in your CSS entry: a
layer takes its position the first time the browser sees the name, and this
package's `styles.css` is usually imported from a component — which is earlier
than your own CSS gets a chance to speak.

Tailwind 4 users already name layers, so the one-liner at the top of this
section is enough.

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

This works at any depth, not only at `:root` — on a wrapper, or in `style` on
the component itself. Seeds are declared on `:root`; part tokens are not
declared at all, and carry their default in the fallback of every read
(`var(--drp-input-radius, var(--drp-radius))`). That is what defers the whole
chain to the element reading it, so overriding a seed on a subtree moves the
part tokens that follow it. Before 4.0.0 part tokens were declared on `:root`
alongside the seeds, which resolved them there and made a scoped override of a
seed a no-op for anything downstream of it — see `docs/adr/0004`.

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
| `--drp-input-label-padding-x` | `0.25rem` |
| `--drp-input-label-float-scale` | `0.75` |
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
| `--drp-input-group-radius` | `var(--drp-radius)` |
| `--drp-input-group-border-hover` | `var(--drp-input-group-border-color)` |
| `--drp-input-group-border-invalid` | `var(--drp-invalid-border)` |
| `--drp-input-group-border-focus` | `var(--drp-input-group-border-color)` |
| `--drp-input-group-border-width-focus` | `var(--drp-input-group-border-width)` |
| `--drp-input-border-color` | `var(--drp-border)` |
| `--drp-input-radius` | `var(--drp-radius)` |
| `--drp-input-bg` | `var(--drp-bg)` |
| `--drp-input-fg` | `var(--drp-fg)` |
| `--drp-input-placeholder-fg` | `var(--drp-muted-fg)` |
| `--drp-input-border-hover` | `var(--drp-input-border-color)` |
| `--drp-input-border-focus` | `var(--drp-accent)` |
| `--drp-input-border-width-focus` | `var(--drp-input-border-width)` |
| `--drp-input-focus-ring-width` | `var(--drp-focus-ring-width)` |
| `--drp-input-disabled-bg` | `var(--drp-input-bg)` |
| `--drp-input-label-inset` | `var(--drp-input-padding-x)` |
| `--drp-input-label-font-size` | `var(--drp-font-size)` |
| `--drp-input-label-fg` | `var(--drp-muted-fg)` |
| `--drp-input-label-bg` | `var(--drp-input-bg)` |
| `--drp-input-label-focus-fg` | `var(--drp-input-border-focus)` |
| `--drp-input-label-invalid-fg` | `var(--drp-invalid-border)` |
| `--drp-input-label-disabled-fg` | `var(--drp-disabled-fg)` |
| `--drp-separator-fg` | `var(--drp-muted-fg)` |
| `--drp-popover-border-color` | `var(--drp-border)` |
| `--drp-popover-radius` | `var(--drp-radius)` |
| `--drp-popover-bg` | `var(--drp-bg)` |
| `--drp-popover-fg` | `var(--drp-fg)` |
| `--drp-shortcut-radius` | `var(--drp-radius)` |
| `--drp-shortcut-fg` | `var(--drp-fg)` |
| `--drp-shortcut-hover-bg` | `var(--drp-hover-bg)` |
| `--drp-caption-fg` | `var(--drp-fg)` |
| `--drp-dropdowns-gap` | `var(--drp-gap)` |
| `--drp-dropdown-border-color` | `var(--drp-border)` |
| `--drp-dropdown-radius` | `var(--drp-radius)` |
| `--drp-dropdown-bg` | `var(--drp-bg)` |
| `--drp-dropdown-caret-inset` | `var(--drp-dropdown-padding-x)` |
| `--drp-dropdown-fg` | `var(--drp-fg)` |
| `--drp-nav-radius` | `var(--drp-radius)` |
| `--drp-nav-fg` | `var(--drp-fg)` |
| `--drp-nav-hover-bg` | `var(--drp-hover-bg)` |
| `--drp-weekday-fg` | `var(--drp-muted-fg)` |
| `--drp-day-radius` | `var(--drp-radius)` |
| `--drp-day-hover-bg` | `var(--drp-hover-bg)` |
| `--drp-day-selected-bg` | `var(--drp-accent)` |
| `--drp-day-selected-fg` | `var(--drp-accent-fg)` |
| `--drp-day-today-fg` | `var(--drp-accent)` |
| `--drp-day-disabled-fg` | `var(--drp-disabled-fg)` |
| `--drp-day-outside-fg` | `var(--drp-muted-fg)` |
| `--drp-day-focus-ring-width` | `var(--drp-focus-ring-width)` |
| `--drp-time-input-border-color` | `var(--drp-input-border-color)` |
| `--drp-time-input-radius` | `var(--drp-input-radius)` |
| `--drp-time-input-bg` | `var(--drp-input-bg)` |
| `--drp-time-input-fg` | `var(--drp-input-fg)` |
| `--drp-time-focus-ring-width` | `var(--drp-focus-ring-width)` |
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
`inputLabelFloating` is the same kind of pair for the label: `inputLabel` is the
element, and the floating class is added alongside it while the label is up on
the border.

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

### Labels

`label` captions each field. A label rests over its field, where the placeholder
would print, and floats up onto the top border once there is something to
caption — the field has focus, or it already holds text. That is the shape a
Material UI outlined field draws, and it is the reason the border has a notch in
it:

```tsx
<DateRangeInput
  label={{ start: 'Start date', end: 'End date' }}
  placeholder={{ start: 'yyyy-mm-dd', end: 'yyyy-mm-dd' }}
/>
```

Both at once is fine. The placeholder waits until the label has floated out of
its way, so the two never print on top of each other — an empty unfocused field
shows `Start date`, and the same field focused shows `Start date` on the border
with `yyyy-mm-dd` underneath it.

The notch is painted, not cut: the floated label covers the border line with
`--drp-input-label-bg`, which follows `--drp-input-bg`. That is right whenever
the field has a background of its own. **If your fields are transparent, name
the surface behind them:**

```css
:root {
  --drp-input-bg: transparent;
  --drp-input-label-bg: #ffffff; /* the page, in this case */
}
```

CSS cannot read what is painted behind an element, so this is the one thing a
token has to be told. Everything else follows the field: the label takes
`--drp-input-border-focus` on focus and `--drp-invalid-border` when the field
goes invalid, both overridable on their own (`--drp-input-label-focus-fg`,
`--drp-input-label-invalid-fg`).

Each field is wrapped in an `inputRoot` element — that is what the label is
positioned against — and it renders whether or not you pass a label.

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

### Order of the two ends

A date that would put the end before its start is **refused**, not reordered.
The field marks itself invalid — `aria-invalid`, and the `inputInvalid` slot —
exactly as an out-of-bounds date does, and the value is not committed:

```
from: 2026-05-20   to: 2026-05-05   ->  the end field goes invalid, nothing commits
from: 2026-05-20   to: 2026-05-20   ->  accepted; refusing is about the order, not the length
```

The same gate stands in front of the time fields under a `timePrecision`. A
clock dialled past the other end is not taken, and the field snaps back to the
value it had rather than sit there showing a number nothing accepted.

Two places are deliberately outside the gate, because in neither does the user
name the offending value:

- **A calendar click.** react-day-picker keeps the range ordered by itself, so a
  click cannot reverse it. What it can do is land both ends on one day — click
  the day a boundary already sits on — and under a `timePrecision` the clocks
  carried there were inherited, not chosen: a start carrying 18:00 beside an end
  carrying 09:00. Those two are ordered rather than the click refused.
- **A shortcut**, which names a whole range and sets both ends at once.

Before 3.0.0 a reversed range was silently swapped instead. That moved the date
just typed into the *other* field, which read as the component losing the input.
If you relied on the swap, order the range yourself before handing it in — a
`value` you pass is used as given, and was never swapped even then.

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
| `label` | — | caption per field, floating onto the border on focus |
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
