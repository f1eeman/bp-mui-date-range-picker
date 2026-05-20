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
});
