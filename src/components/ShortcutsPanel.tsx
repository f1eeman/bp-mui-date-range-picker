import { isSameDay } from 'date-fns';
import type { ClassNames, DateRange, Shortcut } from '../types';
import { mergeSlot } from '../utils/mergeClassNames';

export interface ShortcutsPanelProps {
  shortcuts: Shortcut[];
  value: DateRange;
  onSelect: (range: DateRange) => void;
  classNames?: ClassNames;
}

/** True when two ranges cover the same start and end day. */
function sameRange(a: DateRange, b: DateRange): boolean {
  const dayEq = (x: Date | null, y: Date | null) =>
    (x === null && y === null) || (!!x && !!y && isSameDay(x, y));
  return dayEq(a[0], b[0]) && dayEq(a[1], b[1]);
}

/** Sidebar of preset ranges. */
export function ShortcutsPanel({ shortcuts, value, onSelect, classNames }: ShortcutsPanelProps) {
  return (
    <div className={mergeSlot('shortcutsPanel', classNames)}>
      {shortcuts.map((shortcut) => {
        const active = sameRange(shortcut.range, value);
        return (
          <button
            key={shortcut.label}
            type="button"
            aria-pressed={active}
            className={mergeSlot(
              'shortcut',
              classNames,
              active && mergeSlot('shortcutActive', classNames),
            )}
            onClick={() => onSelect(shortcut.range)}
          >
            {shortcut.label}
          </button>
        );
      })}
    </div>
  );
}
