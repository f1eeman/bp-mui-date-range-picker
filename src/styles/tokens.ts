import type { CSSProperties } from 'react';

/** Every `--drp-*` theme token declared on `.drp-root` in `styles.css`.
 *  Kept in sync with that file by hand — CSS exposes no token list to JS;
 *  `tokens.test.ts` guards the `--drp-` prefix against typos. */
export const DRP_TOKENS = [
  '--drp-accent',
  '--drp-accent-fg',
  '--drp-bg',
  '--drp-fg',
  '--drp-muted-fg',
  '--drp-border',
  '--drp-hover-bg',
  '--drp-range-bg',
  '--drp-range-fg',
  '--drp-today-fg',
  '--drp-disabled-fg',
  '--drp-shortcut-active-bg',
  '--drp-shortcut-active-fg',
  '--drp-invalid-border',
  '--drp-invalid-ring',
  '--drp-focus-ring',
  '--drp-radius',
  '--drp-day-size',
  '--drp-input-height',
  '--drp-nav-button-size',
  '--drp-popover-shadow',
  '--drp-panel-padding',
  '--drp-shortcuts-width',
  '--drp-gap',
  '--drp-font-family',
  '--drp-font-size',
  '--drp-font-size-sm',
  '--drp-font-weight-medium',
] as const;

/**
 * Reads the resolved value of every `--drp-*` token off `el` and returns them
 * as an inline-style object. Used to forward the theme onto the popover, which
 * `FloatingPortal` renders outside `.drp-root` — so it cannot inherit the
 * tokens. Tokens that resolve empty (e.g. in jsdom, which does not apply
 * stylesheets) are skipped.
 */
export function readThemeTokens(el: HTMLElement): CSSProperties {
  const computed = getComputedStyle(el);
  const tokens: Record<string, string> = {};
  for (const name of DRP_TOKENS) {
    const value = computed.getPropertyValue(name).trim();
    if (value) tokens[name] = value;
  }
  return tokens as CSSProperties;
}
