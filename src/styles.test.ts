import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('styles.css', () => {
  const css = readFileSync('src/styles.css', 'utf8');

  it('defines the theme tokens on .drp-root', () => {
    expect(css).toContain('.drp-root');
    expect(css).toContain('--drp-accent:');
    expect(css).toContain('--drp-radius:');
    expect(css).toContain('--drp-day-size:');
  });

  it('styles parts through zero-specificity :where() selectors', () => {
    expect(css).toContain(':where(.drp-input)');
    expect(css).toContain(':where(.drp-day-selected)');
  });

  it('drives styled values from --drp-* tokens', () => {
    expect(css).toContain('var(--drp-accent');
    expect(css).toContain('var(--drp-border');
  });

  it('opens the day-state color cascade into the day button', () => {
    // .drp-day must use color:inherit so a state color set on the parent <td>
    // (default or consumer override) reaches the button text.
    expect(css).toMatch(/:where\(\.drp-day\)\s*\{[^}]*color:\s*inherit/);
    // disabled needs a button-targeted rule — text-decoration/cursor do not
    // cross the <button> boundary.
    expect(css).toContain(':where(.drp-day-disabled .drp-day)');
    // disabled strike-through must land on the button element
    expect(css).toContain('text-decoration: line-through');
    // .drp-calendar carries the default text color the button inherits
    expect(css).toMatch(/:where\(\.drp-calendar\)\s*\{[^}]*color:\s*var\(--drp-fg\)/);
  });
});
