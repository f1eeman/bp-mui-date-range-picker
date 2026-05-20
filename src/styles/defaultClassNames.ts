import type { Slot } from '../types';

/** Default Tailwind classes for every slot. The component's out-of-the-box look. */
export const defaultClassNames: Record<Slot, string> = {
  root: 'relative inline-flex flex-col',
  inputGroup: 'inline-flex items-center gap-2',
  input:
    'h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 ' +
    'outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200',
  inputStart: '',
  inputEnd: '',
  inputInvalid: 'border-red-500 focus:border-red-500 focus:ring-red-200',
  separator: 'text-zinc-400',
  popover: 'z-50 mt-1 rounded-lg border border-zinc-200 bg-white shadow-lg',
  panel: 'flex',
  shortcutsPanel: 'flex w-40 flex-col gap-1 border-r border-zinc-200 p-2',
  shortcut: 'rounded px-2 py-1 text-left text-sm text-zinc-700 hover:bg-zinc-100',
  shortcutActive: 'bg-indigo-50 font-medium text-indigo-700',
  calendar: 'p-3',
  month: 'space-y-2',
  caption: 'text-sm font-medium text-zinc-900',
  nav: 'flex items-center justify-between',
  navButton: 'inline-flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-100',
  weekday: 'text-xs font-normal text-zinc-400',
  week: '',
  day: 'h-9 w-9 rounded text-sm text-zinc-700 hover:bg-zinc-100',
  daySelected: 'bg-indigo-600 text-white hover:bg-indigo-600',
  dayRangeStart: 'bg-indigo-600 text-white',
  dayRangeEnd: 'bg-indigo-600 text-white',
  dayRangeMiddle: 'bg-indigo-100 text-indigo-900',
  dayToday: 'font-semibold text-indigo-600',
  dayDisabled: 'text-zinc-300 line-through',
  dayOutside: 'text-zinc-300',
  timePicker: 'flex items-center gap-1 border-t border-zinc-200 p-2',
  timePickerInput: 'h-8 w-12 rounded border border-zinc-300 text-center text-sm',
};
