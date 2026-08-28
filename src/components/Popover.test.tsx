import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
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

  it('portals the panel into document.body by default', async () => {
    const { container: mountPoint } = render(<Harness />);
    await userEvent.click(screen.getByText('open'));
    const panel = screen.getByText('panel content');
    expect(mountPoint.contains(panel)).toBe(false);
    expect(document.body.contains(panel)).toBe(true);
  });

  it('portals the panel into a given container', async () => {
    // Tokens reach the panel by inheritance, so a host that scopes its retheme
    // to a subtree points `container` at that subtree instead of the body.
    const scope = document.createElement('div');
    scope.id = 'scope';
    document.body.appendChild(scope);

    function ScopedHarness() {
      const [open, setOpen] = useState(false);
      return (
        <Popover
          open={open}
          onOpenChange={setOpen}
          trigger={<button>open</button>}
          container={scope}
        >
          <div>panel content</div>
        </Popover>
      );
    }
    render(<ScopedHarness />);
    await userEvent.click(screen.getByText('open'));
    expect(scope.contains(screen.getByText('panel content'))).toBe(true);

    scope.remove();
  });
});
