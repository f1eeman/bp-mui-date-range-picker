/**
 * Single source of truth for the token reference: `src/styles.css`.
 *
 * The old approach was a hand-maintained list in TypeScript that had to be kept
 * in step with the CSS by hand. With 86 tokens that is not a discipline, it is
 * a countdown. The README table is generated from the stylesheet, and
 * `tokens.test.ts` fails the build when the two drift.
 *
 * Plain TypeScript run straight by Node (type stripping, Node >= 22.18). No
 * build step for a script whose whole job is to read one file.
 */
import { readFileSync } from 'node:fs';

const START = '<!-- tokens:start -->';
const END = '<!-- tokens:end -->';

/** `--drp-*` declarations from the `:root` block, in source order. */
export interface Token {
  name: string;
  value: string;
}

export function readTokens(css: string = readFileSync('src/styles.css', 'utf8')): Token[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rootStart = withoutComments.indexOf(':root {');
  if (rootStart < 0) throw new Error('no :root block in styles.css');
  const block = withoutComments.slice(rootStart, withoutComments.indexOf('\n  }', rootStart));
  return [...block.matchAll(/(--drp-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => ({
    name: m[1],
    value: m[2].trim(),
  }));
}

/** Every `--drp-*` read through `var()` anywhere in the stylesheet. */
export function readUsedTokens(css: string = readFileSync('src/styles.css', 'utf8')): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...new Set([...withoutComments.matchAll(/var\((--drp-[a-z0-9-]+)/g)].map((m) => m[1]))];
}

/**
 * A token whose default is another token is a part token; the rest are seeds.
 * Seeds are what a host sets first, so they lead the table.
 */
export function renderTable(tokens: Token[]): string {
  const row = (t: Token) => `| \`${t.name}\` | \`${t.value}\` |`;
  const seeds = tokens.filter((t) => !t.value.startsWith('var('));
  const parts = tokens.filter((t) => t.value.startsWith('var('));
  return [
    'Seeds — set these first; everything else follows.',
    '',
    '| Token | Default |',
    '| --- | --- |',
    ...seeds.map(row),
    '',
    'Part tokens — each defaults to a seed, override one to disagree with a detail.',
    '',
    '| Token | Default |',
    '| --- | --- |',
    ...parts.map(row),
  ].join('\n');
}

export function renderReadme(readme: string, tokens: Token[]): string {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start < 0 || end < 0) throw new Error(`README is missing ${START} / ${END}`);
  return (
    readme.slice(0, start + START.length) +
    '\n\n' +
    renderTable(tokens) +
    '\n\n' +
    readme.slice(end)
  );
}

export function extractReadmeTokens(readme: string): string[] {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start < 0 || end < 0) throw new Error(`README is missing ${START} / ${END}`);
  const section = readme.slice(start, end);
  return [...new Set([...section.matchAll(/\|\s*`(--drp-[a-z0-9-]+)`\s*\|/g)].map((m) => m[1]))];
}

// `node scripts/tokens.mjs` rewrites the README table in place. Compared via
// pathToFileURL because a hand-built `file://` prefix does not match on
// Windows, where argv[1] is a drive path and import.meta.url has three slashes.
const { pathToFileURL } = await import('node:url');
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { writeFileSync } = await import('node:fs');
  const tokens = readTokens();
  writeFileSync('README.md', renderReadme(readFileSync('README.md', 'utf8'), tokens));
  console.log(`README token table regenerated: ${tokens.length} tokens`);
}
