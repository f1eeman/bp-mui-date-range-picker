# Context

Domain glossary for `bp-mui-date-range-picker`. Terms only — no implementation
detail, no plans, no decisions. Decisions live in `docs/adr/`.

## Host

An application that embeds the picker. The host owns its own design system,
its own cascade, and its own React/Tailwind versions. The picker is a guest in
it and never assumes it is the only stylesheet on the page.

Two hosts define what "flexible enough" means, and disagree on almost
everything: `the adopting host` (React 18, MUI 6, Tailwind 3, plain `:root`
custom properties, light only, no cascade layers) and `the other reference host`
(React 19, MUI 7, Tailwind 4, MUI CSS-variable palette, light and dark,
strict layer order). A change that only satisfies one of them has not
satisfied the requirement.

## Reference host

A host whose visual language the picker must be able to reproduce without
patching the package. Both hosts above are reference hosts. Being a reference
host does **not** mean the host uses the picker everywhere — `the other reference host`
keeps its own MUI range input and serves as a styling target only.

## Theme token

An inherited CSS custom property named `--drp-*` that the host may set to any
value. Tokens are the primary theming channel: a host retheme is a list of
token assignments and nothing else.

A token's package default must be *losable* — a host declaration anywhere
above the component in the tree has to win. A default that the package
re-declares on the component's own element is not a token, because a custom
property set on an element always beats the same property inherited into it.

## Slot

A named node of the rendered tree that the host can attach classes to
(`day`, `popover`, `inputGroup`, …). Slots are the escape hatch for anything
the token vocabulary cannot express, and the only channel for structural
change. A slot with no rule behind it is not a slot — it is a promise the
package does not keep.

## Package layer

The single CSS cascade layer (`bp-drp`) that carries every rule the package
ships. Its purpose is to lose: anything the host writes — layered later or
unlayered entirely — outranks it. Stylesheets the package pulls in from its
own dependencies belong inside this layer too, or they are not covered.

## Boundary

One end of the range, `start` or `end`. Either may be unset independently;
an unset boundary is `null`, never a sentinel date.

## Range

A pair of boundaries. A range with both ends on the same day is a *single-day
range* — always a valid value, but only *complete* when the host says single
days count.

## Shortcut

A named preset that fills both boundaries at once. Concrete on both ends by
definition: a shortcut never produces a half-filled range.
