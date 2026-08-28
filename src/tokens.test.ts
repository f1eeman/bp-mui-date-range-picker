import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  readTokens,
  readUsedTokens,
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
    const missing = readUsedTokens(css).filter((n) => !names.includes(n));
    expect(missing).toEqual([]);
  });

  it('reads every token it declares', () => {
    // A declared-but-unused token is a promise in the docs with nothing behind
    // it — the same defect as a slot naming a node that never renders.
    const used = readUsedTokens(css);
    const unused = names.filter((n) => !used.includes(n));
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
    expect([...extractReadmeTokens(readme)].sort()).toEqual([...names].sort());
    expect(renderReadme(readme, declared)).toBe(readme);
  });

  it('gives part tokens a seed to fall back to, not a repeated literal', () => {
    // The two-level scheme is the whole reason a host can set one value and
    // have the component follow. A part token that hardcodes its own colour
    // silently opts out of that.
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
      const token = declared.find((t) => t.name === name);
      expect(token, name).toBeDefined();
      expect(token!.value, name).toMatch(/^var\(--drp-/);
    }
  });
});
