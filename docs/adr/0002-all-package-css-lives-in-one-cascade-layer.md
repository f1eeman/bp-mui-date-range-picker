# All package CSS lives in one cascade layer

Unlayered CSS outranks every layered rule regardless of specificity, so an
unlayered package stylesheet silently defeats a host that does use layers. In
one of the reference hosts, whose layer order is `theme, base, mui,
components, utilities`, the package's zero-specificity `:where()` rules beat
every Tailwind utility —
meaning the `classNames` escape hatch did not work there at all. Wrapping
everything the package ships in `@layer bp-drp` makes the package lose by
construction, which is the behaviour a guest stylesheet should have.

## Consequences

`:where()` is no longer needed for defeat-ability and is dropped; the layer
does that job, and normal specificity becomes available inside the package
again.

A host that already declares a layer order must name `bp-drp` in it. A layer
that first appears later is appended *after* the declared ones and would become
the strongest — the opposite of the intent. Hosts with no layers at all need no
change: everything they write is unlayered and therefore already wins.

That last sentence is true and still insufficient, which one of the reference
hosts found the hard way. What a host writes is not only its own rules: a
Tailwind 3 app emits preflight unlayered too, and `*, ::before, ::after
{ border-width: 0 }` beating `bp-drp` leaves the package unable to draw a
border anywhere — its own dropdowns lost the padding reserving room for their
caret, and it drew over the text. The tokens still resolve, so it reads as a
theming bug rather than a cascade one. Losing by construction means losing to
a host's normalisation as much as to its intent, and the cascade cannot tell
the two apart while both sit outside every layer. The fix is the host's, is
two lines, and is the reason the README now has a Tailwind section: put
preflight in a layer and order `bp-drp` after it. Nothing here can substitute
for it — a package rule inside a layer cannot outrank an unlayered one at any
specificity.

This is also why `react-day-picker/style.css` could not simply be left in
place — see ADR 0003.
