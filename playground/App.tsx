import { useState, type CSSProperties } from 'react';
import { DateRangeInput, type DateRange } from 'bp-mui-date-range-picker';

export function App() {
  const [range, setRange] = useState<DateRange>([null, null]);
  const [months, setMonths] = useState(2);
  const [linked, setLinked] = useState(true);
  const [openCount, setOpenCount] = useState(0);
  // Callback ref rather than useRef: the container has to be a rendered
  // element on the render that mounts the popover, and a ref object is
  // still null then.
  const [scope, setScope] = useState<HTMLDivElement | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-xl font-semibold">DateRangeInput playground</h1>

      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          Months
          <select
            className="rounded border border-zinc-300 px-1 py-0.5"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={linked}
            onChange={(e) => setLinked(e.target.checked)}
          />
          Linked navigation
        </label>
        <span className="text-zinc-500">opened {openCount}x</span>
      </div>

      <DateRangeInput
        value={range}
        onChange={setRange}
        numberOfMonths={months}
        linkedNavigation={linked}
        onOpenChange={(open) => open && setOpenCount((n) => n + 1)}
        shortcuts
        placeholder={{ start: 'Start date', end: 'End date' }}
      />

      <pre className="rounded bg-zinc-100 p-3 text-sm">
        {JSON.stringify(range.map((d) => d?.toISOString() ?? null), null, 2)}
      </pre>

      <h2 className="text-lg font-medium">Custom styling</h2>
      <DateRangeInput
        placeholder={{ start: 'From', end: 'To' }}
        separator="—"
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

      <h2 className="text-lg font-medium">Per-instance theme, no wrapper</h2>
      {/* `style` now lands on the component's own root, so a one-off retheme
          needs no extra element. The popover still portals out, so it is told
          to stay inside this instance. */}
      <DateRangeInput
        placeholder={{ start: 'From', end: 'To' }}
        data-testid="inline-themed"
        style={
          {
            '--drp-accent': '#0891b2',
            '--drp-day-radius': '50%',
            '--drp-day-size': '1.75rem',
          } as CSSProperties
        }
      />
    </div>
  );
}
