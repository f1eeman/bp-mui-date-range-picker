# Context

Domain glossary for `bp-mui-date-range-picker`. Terms only — no implementation
detail, no plans, no decisions. Decisions live in `docs/adr/`.

## Host

An application that embeds the picker. The host owns its own design system,
its own cascade, and its own React/Tailwind versions. The picker is a guest in
it and never assumes it is the only stylesheet on the page.

Two reference hosts define what "flexible enough" means, and they disagree on
almost everything: one on React 18, Material UI 6 and Tailwind 3, themed with
plain `:root` custom properties, light only, and declaring a layer order of
exactly two names — Tailwind's preflight and `bp-drp` — because Tailwind 3
emits preflight unlayered and it otherwise outranks the whole package; the
other on React 19, Material UI 7 and Tailwind 4, themed from a CSS-variable
palette, light and dark, with a layer order of its own for everything it
loads. A change that only satisfies one of them has not satisfied the
requirement.

## Reference host

A host whose visual language the picker must be able to reproduce without
patching the package. Being a reference host does **not** mean the host uses
the picker everywhere — one of the two keeps its own range input and serves as
a styling target only.

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
change.

What makes a slot real is that it reaches a node the component actually
renders, under a class name that does not move. Whether the package also
styles that node by default is a separate question — a slot the package
leaves unstyled is still a working override point. A slot that names a node
the component never renders is the broken case: it reads as an extension
point and can never do anything.

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

Its two halves have different owners. The **range** — "the last seven days",
"this month" — is the same calculation in every application, and belongs to
the package. The **label** is the host's copy, in the host's language, and
never does. A package that ships them welded together forces a host that needs
its own wording to reimplement the arithmetic too.

Where a week begins is part of the calculation, not a detail of it, and it is
decided by the locale rather than by the package.
