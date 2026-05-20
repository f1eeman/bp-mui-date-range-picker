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
