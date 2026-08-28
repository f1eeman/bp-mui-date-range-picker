import { useState, type CSSProperties } from 'react';
import { DateRangeInput, type DateRange } from 'bp-mui-date-range-picker';

export function App() {
  const [range, setRange] = useState<DateRange>([null, null]);
  const [contiguous, setContiguous] = useState(true);
  // Callback ref rather than useRef: the container has to be a rendered
  // element on the render that mounts the popover, and a ref object is
  // still null then.
  const [scope, setScope] = useState<HTMLDivElement | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-xl font-semibold">DateRangeInput playground</h1>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={contiguous}
          onChange={(e) => setContiguous(e.target.checked)}
        />
        Contiguous calendar months
      </label>

      <DateRangeInput
        value={range}
        onChange={setRange}
        contiguousCalendarMonths={contiguous}
        shortcuts
        placeholder={{ start: 'Start date', end: 'End date' }}
      />

      <pre className="rounded bg-zinc-100 p-3 text-sm">
        {JSON.stringify(range.map((d) => d?.toISOString() ?? null), null, 2)}
      </pre>

      <h2 className="text-lg font-medium">Custom styling</h2>
      <DateRangeInput
        placeholder={{ start: 'From', end: 'To' }}
        classNames={{
          input: 'rounded-lg border-zinc-300 focus:ring-2 focus:ring-emerald-500',
          daySelected: 'bg-emerald-600 text-white',
          dayRangeMiddle: 'bg-emerald-100',
        }}
      />

      <h2 className="text-lg font-medium">Theme via CSS variables</h2>
      {/*
        Tokens set on a wrapper reach the input group by inheritance, but the
        popover is portalled to document.body and sits outside that wrapper —
        so a subtree-scoped retheme has to point `container` back at it.
        A host that declares its tokens at :root needs none of this.
      */}
      <div
        ref={setScope}
        style={{ '--drp-accent': '#db2777', '--drp-radius': '12px' } as CSSProperties}
      >
        <DateRangeInput
          placeholder={{ start: 'From', end: 'To' }}
          container={scope}
          shortcuts
        />
      </div>
    </div>
  );
}
