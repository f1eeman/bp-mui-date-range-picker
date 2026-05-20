import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShortcutsPanel } from './ShortcutsPanel';
import type { Shortcut } from '../types';

const shortcuts: Shortcut[] = [
  { label: 'A', range: [new Date(2026, 4, 1), new Date(2026, 4, 7)] },
  { label: 'B', range: [new Date(2026, 4, 8), new Date(2026, 4, 14)] },
];

describe('ShortcutsPanel', () => {
  it('renders one button per shortcut', () => {
    render(<ShortcutsPanel shortcuts={shortcuts} value={[null, null]} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'B' })).toBeInTheDocument();
  });

  it('calls onSelect with the shortcut range when clicked', async () => {
    const onSelect = vi.fn();
    render(<ShortcutsPanel shortcuts={shortcuts} value={[null, null]} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onSelect).toHaveBeenCalledWith(shortcuts[1].range);
  });

  it('marks the active shortcut with aria-pressed', () => {
    render(
      <ShortcutsPanel shortcuts={shortcuts} value={shortcuts[0].range} onSelect={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'false');
  });
});
