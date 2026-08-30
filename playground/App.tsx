import { useEffect, useState, type CSSProperties } from 'react';
import {
  DateRangeInput,
  type DateRange,
  type TimePrecision,
} from 'bp-mui-date-range-picker';

type Skin = 'default' | 'merged' | 'material';

/** Everything a skin cannot say in tokens, because it is structure. */
const skinProps: Record<Skin, { separator?: string; numberOfMonths?: number }> = {
  default: {},
  // This one draws an em dash between the fields, not an arrow.
  merged: { separator: '—' },
  material: {},
};

export function App() {
  const [range, setRange] = useState<DateRange>([null, null]);
  const [months, setMonths] = useState(2);
  const [linked, setLinked] = useState(true);
  const [openCount, setOpenCount] = useState(0);
  const [skin, setSkin] = useState<Skin>('default');
  const [dark, setDark] = useState(false);
  // Callback ref rather than useRef: the container has to be a rendered
  // element on the render that mounts the popover, and a ref object is
  // still null then.
  const [scope, setScope] = useState<HTMLDivElement | null>(null);
  const [timed, setTimed] = useState<DateRange>([null, null]);
  const [precision, setPrecision] = useState<TimePrecision>('minute');
  const [showArrowButtons, setShowArrowButtons] = useState(true);

  // On <html>, so the portalled popover inherits the tokens the same way it
  // would in a host that declares them at :root. Nothing is forwarded to it.
  useEffect(() => {
    const el = document.documentElement;
    if (skin === 'default') el.removeAttribute('data-skin');
    else el.setAttribute('data-skin', skin);
    if (dark) el.setAttribute('data-scheme', 'dark');
    else el.removeAttribute('data-scheme');
  }, [skin, dark]);

  const extra = skinProps[skin];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-xl font-semibold">DateRangeInput playground</h1>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          Skin
          <select
            className="rounded border border-zinc-300 px-1 py-0.5"
            value={skin}
            onChange={(e) => setSkin(e.target.value as Skin)}
          >
            <option value="default">package default</option>
            <option value="merged">merged field</option>
            <option value="material">material</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={dark}
            disabled={skin !== 'material'}
            onChange={(e) => setDark(e.target.checked)}
          />
          Dark
        </label>
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
        {/* Named after the state it turns on, not the one it turns off. The
            prop is `linkedNavigation` and defaults to true, but nobody goes
            looking for "linked navigation" — they go looking for the month and
            year dropdowns paging one calendar without dragging its neighbour
            along, which is what unchecking it does. */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!linked}
            onChange={(e) => setLinked(!e.target.checked)}
          />
          Page each month independently
        </label>
        <span className="opacity-60">opened {openCount}x</span>
      </div>

      <p className="text-sm opacity-70">
        Both skins are `--drp-*` assignments and nothing else — see
        playground/skins.css. Only the separator is a prop, because it is a node
        rather than a value.
      </p>

      <DateRangeInput
        value={range}
        onChange={setRange}
        numberOfMonths={months}
        linkedNavigation={linked}
        onOpenChange={(open) => open && setOpenCount((n) => n + 1)}
        shortcuts
        placeholder={{ start: 'Start date', end: 'End date' }}
        {...extra}
      />

      <pre className="rounded bg-zinc-100 p-3 text-sm">
        {JSON.stringify(range.map((d) => d?.toISOString() ?? null), null, 2)}
      </pre>

      <h2 className="text-lg font-medium">Time</h2>
      {/*
        The acceptance check for the feature is here rather than in a test: set
        a time, then move the day in the calendar and retype the date by hand.
        The clock has to survive both.
      */}
      <label className="flex items-center gap-2 text-sm">
        Precision
        <select
          className="rounded border px-2 py-1"
          value={precision}
          onChange={(e) => setPrecision(e.target.value as TimePrecision)}
        >
          <option value="minute">minute</option>
          <option value="second">second</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showArrowButtons}
          onChange={(e) => setShowArrowButtons(e.target.checked)}
        />
        Arrow buttons
      </label>
      <DateRangeInput
        value={timed}
        onChange={setTimed}
        timePrecision={precision}
        showArrowButtons={showArrowButtons}
        shortcuts
        placeholder={{ start: 'Start', end: 'End' }}
      />
      <pre className="rounded bg-zinc-100 p-3 text-sm">
        {JSON.stringify(timed.map((d) => d?.toISOString() ?? null), null, 2)}
      </pre>

      <h2 className="text-lg font-medium">Slot overrides</h2>
      <DateRangeInput
        placeholder={{ start: 'From', end: 'To' }}
        separator="—"
        classNames={{
          input: 'rounded-lg border-zinc-300 focus:ring-2 focus:ring-emerald-500',
          daySelected: 'bg-emerald-600 text-white',
          dayRangeMiddle: 'bg-emerald-100',
        }}
      />

      <h2 className="text-lg font-medium">Theme scoped to a subtree</h2>
      {/*
        Tokens set on a wrapper reach the input group by inheritance, but the
        popover is portalled to document.body and sits outside that wrapper —
        so a subtree-scoped retheme has to point `container` back at it.
        A host that declares its tokens at :root, as the skins do, needs none
        of this.
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
          needs no extra element. */}
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
