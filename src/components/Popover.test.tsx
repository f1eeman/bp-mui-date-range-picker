import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type CSSProperties } from 'react';
import { Popover } from './Popover';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={<button>open</button>}
    >
      <div>panel content</div>
    </Popover>
  );
}

describe('Popover', () => {
  it('hides content until the trigger is clicked', async () => {
    render(<Harness />);
    expect(screen.queryByText('panel content')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('open'));
    expect(screen.getByText('panel content')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByText('open'));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('panel content')).not.toBeInTheDocument();
  });

  it('applies a forwarded style to the floating panel', async () => {
    function StyledHarness() {
      const [open, setOpen] = useState(false);
      return (
        <Popover
          open={open}
          onOpenChange={setOpen}
          trigger={<button>open</button>}
          style={{ '--drp-accent': 'rgb(1, 2, 3)' } as CSSProperties}
        >
          <div>panel content</div>
        </Popover>
      );
    }
    render(<StyledHarness />);
    await userEvent.click(screen.getByText('open'));
    // The floating panel is the parent of the rendered children.
    const panel = screen.getByText('panel content').parentElement as HTMLElement;
    expect(panel.style.getPropertyValue('--drp-accent')).toBe('rgb(1, 2, 3)');
    // floating-ui positioning must survive the merge.
    expect(panel.style.position).toBeTruthy();
  });
});
