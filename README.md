# bp-mui-date-range-picker

Blueprint-style `DateRangeInput` for React 19 with CSS-variable theming and slot overrides.

## Install

```bash
npm install bp-mui-date-range-picker
```

Peer dependencies: `react` and `react-dom` 19+.

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
      contiguousCalendarMonths
      placeholder={{ start: 'Start', end: 'End' }}
    />
  );
}
```

## Slot overrides

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

Slot classes always win over the `--drp-*` theme (the base styles use
zero-specificity `:where()` selectors).
