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
  // This one draws an arrow between the fields rather than the default em dash.
  merged: { separator: '→' },
  material: {},
};

/**
 * One row per pattern in the Date pattern section. The prop is the only
 * difference between the rows, and they share a value — so the same two days
 * read differently in each, which is the whole point of the prop.
 */
const DATE_PATTERNS: { pattern: string; timePrecision?: TimePrecision }[] = [
  { pattern: 'yyyy-MM-dd' },
  { pattern: 'dd/MM/yyyy' },
  { pattern: 'dd-MM-yyyy' },
  { pattern: 'dd.MM.yyyy' },
  { pattern: 'MM/dd/yyyy' },
  { pattern: 'dd MMM yyyy' },
  { pattern: 'dd/MM/yyyy', timePrecision: 'minute' },
  { pattern: 'dd.MM.yyyy', timePrecision: 'second' },
];

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
  const [datePattern, setDatePattern] = useState('dd-MM-yyyy');
  const [showArrowButtons, setShowArrowButtons] = useState(true);
  // Per-section rather than shared with the one up top, so toggling it here
  // does not silently repage a calendar somewhere else on the page.
  const [timedLinked, setTimedLinked] = useState(true);
  const [timedMonths, setTimedMonths] = useState(2);
  const [patternLinked, setPatternLinked] = useState(true);
  const [patternMonths, setPatternMonths] = useState(2);
  // Seeded, so every row below shows its shape without anything being typed.
  const [patterned, setPatterned] = useState<DateRange>(() => [
    new Date(2026, 4, 20, 9, 5),
    new Date(2026, 5, 3, 18, 30, 45),
  ]);

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

      <p className="text-sm opacity-70">
        `label` captions each field. It rests over the field while that field is
        empty and unfocused, then floats onto the top border — so the
        placeholder below only prints once the label is out of its way. The
        material skin is where to judge it.
      </p>

      <DateRangeInput
        value={range}
        onChange={setRange}
        numberOfMonths={months}
        linkedNavigation={linked}
        onOpenChange={(open) => open && setOpenCount((n) => n + 1)}
        shortcuts
        label={{ start: 'Start date', end: 'End date' }}
        placeholder={{ start: 'yyyy-mm-dd', end: 'yyyy-mm-dd' }}
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
        Date pattern
        <select
          className="rounded border px-2 py-1"
          value={datePattern}
          onChange={(e) => setDatePattern(e.target.value)}
        >
          <option value="yyyy-MM-dd">yyyy-MM-dd</option>
          <option value="dd/MM/yyyy">dd/MM/yyyy</option>
          <option value="dd-MM-yyyy">dd-MM-yyyy</option>
          <option value="dd.MM.yyyy">dd.MM.yyyy</option>
          <option value="MM/dd/yyyy">MM/dd/yyyy</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        Months
        <input
          className="w-16 rounded border px-2 py-1"
          type="number"
          min={1}
          max={3}
          value={timedMonths}
          onChange={(e) => setTimedMonths(Number(e.target.value))}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!timedLinked}
          onChange={(e) => setTimedLinked(!e.target.checked)}
        />
        Page each month independently
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
        datePattern={datePattern}
        numberOfMonths={timedMonths}
        linkedNavigation={timedLinked}
        showArrowButtons={showArrowButtons}
        shortcuts
        label={{ start: 'Start', end: 'End' }}
      />
      <pre className="rounded bg-zinc-100 p-3 text-sm">
        {JSON.stringify(timed.map((d) => d?.toISOString() ?? null), null, 2)}
      </pre>

      <h2 className="text-lg font-medium">Date pattern</h2>
      <p className="text-sm opacity-70">
        The fields default to `dd-MM-yyyy`. `datePattern` takes a date-fns
        pattern instead — it writes the fields and reads them back, so pick a
        range in any row and type over it to see both directions. All rows share
        one value.
      </p>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          Months
          <input
            className="w-16 rounded border px-2 py-1"
            type="number"
            min={1}
            max={3}
            value={patternMonths}
            onChange={(e) => setPatternMonths(Number(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!patternLinked}
            onChange={(e) => setPatternLinked(!e.target.checked)}
          />
          Page each month independently
        </label>
      </div>
      <div className="space-y-3">
        {DATE_PATTERNS.map(({ pattern, timePrecision }) => (
          <div
            key={`${pattern} ${timePrecision ?? ''}`}
            className="flex flex-wrap items-center gap-x-4 gap-y-1"
          >
            <code className="w-80 shrink-0 text-xs opacity-70">
              datePattern="{pattern}"
              {timePrecision ? ` timePrecision="${timePrecision}"` : ''}
            </code>
            <DateRangeInput
              value={patterned}
              onChange={setPatterned}
              datePattern={pattern}
              timePrecision={timePrecision}
              numberOfMonths={patternMonths}
              linkedNavigation={patternLinked}
              label={{ start: 'From', end: 'To' }}
            />
          </div>
        ))}
      </div>

      <h2 className="text-lg font-medium">Slot overrides</h2>
      <DateRangeInput
        label={{ start: 'From', end: 'To' }}
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
          label={{ start: 'From', end: 'To' }}
          container={scope}
          shortcuts
        />
      </div>

      <h2 className="text-lg font-medium">Per-instance theme, no wrapper</h2>
      {/* `style` now lands on the component's own root, so a one-off retheme
          needs no extra element. */}
      <DateRangeInput
        label={{ start: 'From', end: 'To' }}
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
