# Theme tokens are not declared on the component root

A custom property set on an element always beats the same property inherited
into it, so `.drp-root { --drp-accent: … }` made every `--drp-*` default
unoverridable from anywhere outside the component. The documented per-instance
and per-wrapper theming in the README never worked, and the one host already
using the package discovered this the hard way and rethemed the component
entirely through slot classes and `!important` instead. Package defaults therefore live at `:root`
inside the package layer, where a host declaration at any depth outranks them.

## Consequences

The `--drp-*` names are now visible in the global scope rather than scoped to
the component — accepted, because a token whose whole purpose is to be set from
outside was never really encapsulated.

Because custom property substitution is lazy, a token that defaults to another
token (`--drp-input-radius: var(--drp-radius)`) inherits as an unresolved
literal and resolves in the scope of whichever element uses it. That is what
lets a host scope a retheme to a subtree, and it is the reason the two-level
token vocabulary works at all.

This also removed the reason `readThemeTokens` existed. The popover is
portalled outside the component, could not inherit tokens from `.drp-root`, and
so had 28 resolved values copied onto it as inline styles once per open — which
went stale if the host switched colour scheme while the popover was open. With
tokens inheriting from `:root` the portal picks them up live, and the snapshot
is gone.
