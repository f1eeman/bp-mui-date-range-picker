import { useState } from 'react';
import { DateRangeInput, type DateRange } from 'bp-mui-date-range-picker';

export function App() {
  const [range, setRange] = useState<DateRange>([null, null]);
  const [contiguous, setContiguous] = useState(true);

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
    </div>
  );
}
