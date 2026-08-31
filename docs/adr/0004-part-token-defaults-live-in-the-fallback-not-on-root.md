# Part token defaults live in the fallback, not on `:root`

ADR 0001 moved token defaults off the component element and onto `:root`, and
claimed that a part token declared there stays lazy:

> Because custom property substitution is lazy, a token that defaults to
> another token (`--drp-input-radius: var(--drp-radius)`) inherits as an
> unresolved literal and resolves in the scope of whichever element uses it.

That is wrong, and the README repeated it. A custom property's value is
substituted at computed-value time **on the element carrying the declaration**,
not on the element that reads it. So

```css
:root {
  --drp-radius: 0.375rem;
  --drp-input-radius: var(--drp-radius);
}
```

computes `--drp-input-radius` to `0.375rem` on `:root` and inherits the
finished length downwards. A host that sets `--drp-radius` lower in the tree
moves everything reading the seed directly and nothing reading the part token —
the part token was decided before the override existed.

The first host to theme a single instance hit this immediately: with
`style={{ '--drp-input-group-border-width': '1px' }}` on the component the
field had a border at rest and lost it on focus, because
`--drp-input-group-border-width-focus` had already resolved to the package
default of `0` up on `:root`. Only a `:root` override worked — which is exactly
the scoping freedom ADR 0001 set out to win, lost again one level down.

Part tokens are therefore not declared anywhere. Their default is written into
the fallback of every read, expanded down the whole chain:

```css
.drp-time-input {
  background: var(--drp-time-input-bg, var(--drp-input-bg, var(--drp-bg)));
}
```

Nothing is resolved until the element that reads it, so an override of any link
— the part token, the part token it follows, or the seed at the end — wins,
declared at any depth.

## Consequences

Rules get longer, and a part token that follows another part token spells out
the whole chain. Accepted: the alternative is a two-level vocabulary that only
works from one place in the document.

Seeds keep their `:root` declarations. They hold literals, so there is nothing
to resolve early, and having them in one readable block is worth keeping.

A part token now exists only as a name inside a `var()`, so nothing declares
the list. `scripts/tokens.ts` collects part tokens from the stylesheet body
instead of the `:root` block, and `tokens.test.ts` enforces the invariants that
replace the old declaration: no part token on `:root`, every part token read
with a fallback, and the same fallback everywhere so one name cannot mean two
things.
