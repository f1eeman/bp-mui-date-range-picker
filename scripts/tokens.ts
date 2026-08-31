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

/** Closing brace of the `:root` block, at its indentation inside the layer. */
const ROOT_BLOCK_END = '\n  }';

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
 * Every `var(--drp-*)` occurrence outside the `:root` block, with the fallback
 * it was given. Hand-rolled scan rather than a regex: a fallback is itself
 * often a `var()`, and nested parens are exactly what a regex cannot balance.
 */
export interface VarRead {
  name: string;
  fallback: string | null;
}

export function readVarReads(css: string = readFileSync('src/styles.css', 'utf8')): VarRead[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rootStart = withoutComments.indexOf(':root {');
  const rootEnd = rootStart < 0 ? -1 : withoutComments.indexOf(ROOT_BLOCK_END, rootStart);
  const body =
    rootEnd < 0
      ? withoutComments
      : withoutComments.slice(0, rootStart) + withoutComments.slice(rootEnd);

  const reads: VarRead[] = [];
  const NEEDLE = 'var(';
  for (let i = body.indexOf(NEEDLE); i >= 0; i = body.indexOf(NEEDLE, i + 1)) {
    let j = i + NEEDLE.length;
    const nameStart = j;
    while (j < body.length && /[a-z0-9-]/.test(body[j])) j++;
    const name = body.slice(nameStart, j);
    if (!name.startsWith('--drp-')) continue;
    while (j < body.length && /\s/.test(body[j])) j++;
    if (body[j] === ')') {
      reads.push({ name, fallback: null });
      continue;
    }
    if (body[j] !== ',') continue;
    j++;
    let depth = 0;
    const fbStart = j;
    while (j < body.length) {
      const ch = body[j];
      if (ch === '(') depth++;
      else if (ch === ')') {
        if (depth === 0) break;
        depth--;
      }
      j++;
    }
    reads.push({ name, fallback: body.slice(fbStart, j).trim() });
  }
  return reads;
}

/** Names read through `var()` with no fallback at all. */
export function readBareReads(css: string = readFileSync('src/styles.css', 'utf8')): string[] {
  return [...new Set(readVarReads(css).filter((r) => r.fallback === null).map((r) => r.name))];
}

/**
 * Part tokens: name -> the distinct fallbacks it is read with. More than one
 * entry means the same name means different things in different rules.
 */
export function readParts(
  css: string = readFileSync('src/styles.css', 'utf8'),
): Record<string, string[]> {
  const parts: Record<string, Set<string>> = {};
  for (const r of readVarReads(css)) {
    if (r.fallback === null) continue;
    (parts[r.name] ??= new Set()).add(r.fallback);
  }
  return Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, [...v]]));
}

/**
 * A part token's fallback is written out in full at the point of use, so the
 * whole chain survives an override at any level:
 * `var(--drp-time-input-bg, var(--drp-input-bg, var(--drp-bg)))`. The table
 * wants only the next link — the seed or part this one follows.
 */
function immediateDefault(fallback: string): string {
  const m = /^var\((--drp-[a-z0-9-]+)/.exec(fallback);
  return m ? `var(${m[1]})` : fallback;
}

/**
 * Seeds are declared on `:root` and are what a host sets first, so they lead
 * the table. Part tokens are never declared — they exist only as the name in a
 * `var()` read — so they are collected from the stylesheet body instead, in
 * order of first appearance.
 */
export function renderTable(seeds: Token[], parts: Record<string, string[]>): string {
  const row = (t: Token) => `| \`${t.name}\` | \`${t.value}\` |`;
  const partRows = Object.entries(parts).map(([name, fallbacks]) => ({
    name,
    value: immediateDefault(fallbacks[0]),
  }));
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
    ...partRows.map(row),
  ].join('\n');
}

export function renderReadme(
  readme: string,
  seeds: Token[],
  parts: Record<string, string[]>,
): string {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start < 0 || end < 0) throw new Error(`README is missing ${START} / ${END}`);
  return (
    readme.slice(0, start + START.length) +
    '\n\n' +
    renderTable(seeds, parts) +
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
  const seeds = readTokens();
  const parts = readParts();
  writeFileSync('README.md', renderReadme(readFileSync('README.md', 'utf8'), seeds, parts));
  console.log(
    `README token table regenerated: ${seeds.length} seeds, ${Object.keys(parts).length} part tokens`,
  );
}
