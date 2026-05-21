import { describe, expect, it, vi } from 'vitest';
import { DRP_TOKENS, readThemeTokens } from './tokens';

describe('DRP_TOKENS', () => {
  it('is non-empty and every name is a --drp-* custom property', () => {
    expect(DRP_TOKENS.length).toBeGreaterThan(0);
    for (const name of DRP_TOKENS) {
      expect(name.startsWith('--drp-')).toBe(true);
    }
  });
});

describe('readThemeTokens', () => {
  it('returns an object and does not throw for an unstyled element', () => {
    const el = document.createElement('div');
    expect(() => readThemeTokens(el)).not.toThrow();
    expect(typeof readThemeTokens(el)).toBe('object');
  });

  it('mirrors whatever getComputedStyle exposes for a token', () => {
    const el = document.createElement('div');
    el.style.setProperty('--drp-accent', 'rgb(1, 2, 3)');
    document.body.appendChild(el);
    const exposed = getComputedStyle(el).getPropertyValue('--drp-accent').trim();
    const tokens = readThemeTokens(el) as Record<string, string>;
    if (exposed) {
      expect(tokens['--drp-accent']).toBe(exposed);
    } else {
      expect(tokens['--drp-accent']).toBeUndefined();
    }
    el.remove();
  });

  it('collects non-empty token values and skips empty ones', () => {
    const stub: Record<string, string> = {
      '--drp-accent': 'rgb(1, 2, 3)',
      '--drp-bg': '#ffffff',
    };
    const spy = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) => stub[name] ?? '',
    } as unknown as CSSStyleDeclaration);

    const tokens = readThemeTokens(document.createElement('div')) as Record<string, string>;

    expect(tokens['--drp-accent']).toBe('rgb(1, 2, 3)');
    expect(tokens['--drp-bg']).toBe('#ffffff');
    // a token getComputedStyle reports as empty must be skipped entirely
    expect('--drp-fg' in tokens).toBe(false);

    spy.mockRestore();
  });
});
