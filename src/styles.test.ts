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

  it('centres itself when a parent row stretches it', () => {
    // The component sits in filter rows beside taller controls. Its root is a
    // flex column, so `align-items: stretch` on the row makes it as tall as the
    // row and the fields pin to the top unless the main axis is centred. This
    // used to be handled by a wrapper element in the host; the root owns it now.
    expect(css).toMatch(/\.drp-root \{[^}]*justify-content:\s*center/);
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

  it('defaults part tokens from seeds rather than repeating literals', () => {
    // The two-level scheme only works if part tokens reference seeds: a host
    // that sets --drp-radius must move the input, day and popover corners with
    // one declaration.
    expect(css).toMatch(/--drp-input-radius:\s*var\(--drp-radius\)/);
    expect(css).toMatch(/--drp-day-radius:\s*var\(--drp-radius\)/);
    expect(css).toMatch(/--drp-popover-radius:\s*var\(--drp-radius\)/);
    expect(css).toMatch(/--drp-input-border-focus:\s*var\(--drp-accent\)/);
    expect(css).toMatch(/--drp-day-selected-bg:\s*var\(--drp-accent\)/);
  });

  it('exposes the popover stacking order as a token', () => {
    // Hardcoded at 50 before, which put the popover behind any Material UI
    // dialog (1300) with no way for the host to say otherwise.
    expect(css).toContain('--drp-popover-z-index:');
    expect(css).toMatch(/z-index:\s*var\(--drp-popover-z-index\)/);
  });

  it('lets the host hand a colour scheme to the native controls', () => {
    // The month/year dropdowns and the time fields are native elements the
    // browser paints from `color-scheme`, not from these tokens.
    expect(css).toContain('--drp-color-scheme: inherit');
    expect(css).toMatch(/color-scheme:\s*var\(--drp-color-scheme\)/);
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
    // .drp-calendar carries the default text color the button inherits. It
    // follows the popover surface it sits on rather than --drp-fg directly,
    // so a host that darkens only the popover keeps readable days;
    // --drp-popover-fg defaults to --drp-fg, so the default is unchanged.
    expect(css).toMatch(/\.drp-calendar \{[^}]*color:\s*var\(--drp-popover-fg\)/);
    expect(css).toMatch(/--drp-popover-fg:\s*var\(--drp-fg\)/);
  });

  it("lets a selection fill own the day number's colour, even on today", () => {
    // .drp-day-today and the selection classes all land on the same cell as
    // single-class selectors, so equal specificity leaves the cascade to settle
    // them on source order — and today's rule sits last. Since
    // --drp-day-today-fg and --drp-day-selected-bg are both --drp-accent, today
    // as an end of the range was painted in its own background and the number
    // vanished. Today keeps its weight wherever it falls; its colour applies
    // only where no fill has already chosen a paired foreground.
    const rules = [...css.matchAll(/\n {2}([^{}\n]+)\{([^}]*)\}/g)];
    const todayColour = rules.find(
      ([, selector, body]) => selector.includes('.drp-day-today') && /(^|;)\s*color:/.test(body),
    );
    expect(todayColour).toBeDefined();
    for (const filled of [
      'drp-day-selected',
      'drp-day-range-start',
      'drp-day-range-end',
      'drp-day-range-middle',
    ]) {
      expect(todayColour![1]).toContain(`:not(.${filled})`);
    }
  });
});
