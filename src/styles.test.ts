import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('styles.css', () => {
  const css = readFileSync('src/styles.css', 'utf8');

  it('ships every rule inside the bp-drp cascade layer', () => {
    // Unlayered CSS outranks any layered rule, so a single unlayered rule here
    // would silently beat every utility class a layered host writes.
    expect(css).toContain('@layer bp-drp {');
    const outsideLayer = css.slice(0, css.indexOf('@layer bp-drp'));
    expect(outsideLayer.replace(/\/\*[\s\S]*?\*\//g, '').trim()).toBe('');
    expect(css.trimEnd().endsWith('}')).toBe(true);
  });

  it('declares token defaults on :root, not on the component element', () => {
    expect(css).toMatch(/:root \{/);
    expect(css).toContain('--drp-accent:');
    expect(css).toContain('--drp-radius:');
    expect(css).toContain('--drp-day-size:');
  });

  it('never declares a --drp-* token on .drp-root', () => {
    // A custom property set on an element beats the same property inherited
    // into it. Declaring a default here would make it unoverridable from any
    // ancestor, which is exactly the bug ADR 0001 records.
    const rootRule = css.match(/\n {2}\.drp-root \{([\s\S]*?)\n {2}\}/);
    expect(rootRule).not.toBeNull();
    expect(rootRule![1]).not.toMatch(/--drp-[a-z-]+:/);
  });

  it('does not rely on :where() to lose — the layer does that', () => {
    expect(css).not.toContain(':where(');
  });

  it('spaces a month with flex gap, not an adjacent-sibling margin', () => {
    // `navLayout="around"` renders the previous-month button before the caption
    // in the first month and the next-month button after it in the last. The
    // buttons are absolutely positioned but still count as siblings, so a
    // `.drp-month > * + *` margin landed on one month's caption and not the
    // other's, leaving the two grids 8px out of line. Absolutely positioned
    // children are excluded from flex layout, so `gap` cannot see them.
    expect(css).not.toMatch(/\.drp-month\s*>\s*\*\s*\+\s*\*/);
    expect(css).toMatch(/\.drp-month \{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.drp-month \{[^}]*gap:/);
  });

  it('drives styled values from --drp-* tokens', () => {
    expect(css).toContain('var(--drp-accent');
    expect(css).toContain('var(--drp-border');
  });

  it('opens the day-state color cascade into the day button', () => {
    // .drp-day must use color:inherit so a state color set on the parent <td>
    // (default or consumer override) reaches the button text.
    expect(css).toMatch(/\.drp-day \{[^}]*color:\s*inherit/);
    // disabled needs a button-targeted rule — text-decoration/cursor do not
    // cross the <button> boundary.
    expect(css).toContain('.drp-day-disabled .drp-day');
    // disabled strike-through must land on the button element
    expect(css).toContain('text-decoration: line-through');
    // .drp-calendar carries the default text color the button inherits
    expect(css).toMatch(/\.drp-calendar \{[^}]*color:\s*var\(--drp-fg\)/);
  });
});
