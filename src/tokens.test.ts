import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  readTokens,
  readUsedTokens,
  readBareReads,
  readParts,
  extractReadmeTokens,
  renderReadme,
} from '../scripts/tokens';

/**
 * There used to be a hand-written `DRP_TOKENS` array kept in step with the
 * stylesheet by hand. With 86 tokens that is not a discipline, it is a
 * countdown — and the README, which nothing checked at all, was already
 * describing behaviour the package did not have.
 *
 * `src/styles.css` is the single source of truth now. These tests fail the
 * build the moment anything else disagrees with it.
 */
describe('theme tokens', () => {
  const css = readFileSync('src/styles.css', 'utf8');
  const declared = readTokens(css);
  const names = declared.map((t) => t.name);

  it('declares a default for every token it reads', () => {
    // A `var(--drp-x)` with no default resolves to nothing when the host does
    // not set it, and the property silently falls back to its initial value.
    // Seeds carry their default on `:root`; part tokens carry it in the
    // fallback of every read, so both count as declared.
    const withFallback = new Set(Object.keys(readParts(css)));
    const missing = readUsedTokens(css).filter(
      (n) => !names.includes(n) && !withFallback.has(n),
    );
    expect(missing).toEqual([]);
  });

  it('reads every token it declares', () => {
    // A declared-but-unused token is a promise in the docs with nothing behind
    // it — the same defect as a slot naming a node that never renders. A seed
    // counts as read when a rule reads it directly or a part token falls back
    // to it.
    const used = new Set(readUsedTokens(css));
    const unused = names.filter((n) => !used.has(n));
    expect(unused).toEqual([]);
  });

  it('names every token with the --drp- prefix and no duplicates', () => {
    expect(names.every((n) => n.startsWith('--drp-'))).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });

  it('keeps the README token table in step with the stylesheet', () => {
    // Regenerate with `npm run docs:tokens`.
    const readme = readFileSync('README.md', 'utf8');
    // The table groups seeds ahead of part tokens, so it does not follow source
    // order — compare the sets here, and let the exact re-render below catch
    // order, values and formatting.
    const parts = readParts(css);
    const all = [...names, ...Object.keys(parts)];
    expect([...extractReadmeTokens(readme)].sort()).toEqual([...all].sort());
    expect(renderReadme(readme, declared, parts)).toBe(readme);
  });

  it('declares no part token on :root', () => {
    // A custom property is substituted where it is declared, not where it is
    // read. This pair
    //   :root { --drp-a: 0; --drp-a-focus: var(--drp-a); }
    // computes --drp-a-focus to zero on :root and inherits the finished zero
    // downwards, so a host that overrides --drp-a on the component itself never
    // reaches the part token. Part tokens are therefore not declared at all —
    // their default lives in the fallback of each read. See docs/adr/0004.
    const partsOnRoot = declared
      .filter((t) => t.value.startsWith('var(--drp-'))
      .map((t) => t.name);
    expect(partsOnRoot).toEqual([]);
  });

  it('reads every part token with a fallback', () => {
    // A part token is declared nowhere, so without a fallback it resolves to
    // nothing and the property silently drops to its initial value.
    const seeds = new Set(names);
    const bare = readBareReads(css).filter((n) => !seeds.has(n));
    expect(bare).toEqual([]);
  });

  it('reads a part token with the same fallback everywhere', () => {
    // Two different fallbacks for one name are two different tokens wearing
    // it, and a host cannot predict which one it is overriding.
    const conflicting = Object.entries(readParts(css))
      .filter(([, values]) => values.length > 1)
      .map(([name, values]) => `${name}: ${values.join(' | ')}`);
    expect(conflicting).toEqual([]);
  });

  it('gives part tokens a seed to fall back to, not a repeated literal', () => {
    // The two-level scheme is the whole reason a host can set one value and
    // have the component follow. A part token that hardcodes its own colour
    // silently opts out of that.
    const parts = readParts(css);
    const partsExpectedToFollowASeed = [
      '--drp-input-bg',
      '--drp-input-fg',
      '--drp-input-radius',
      '--drp-popover-bg',
      '--drp-popover-radius',
      '--drp-day-radius',
      '--drp-day-selected-bg',
      '--drp-day-selected-fg',
      '--drp-nav-fg',
      '--drp-shortcut-fg',
    ];
    for (const name of partsExpectedToFollowASeed) {
      const fallbacks = parts[name];
      expect(fallbacks, name).toBeDefined();
      expect(fallbacks[0], name).toMatch(/^var\(--drp-/);
    }
  });
});
