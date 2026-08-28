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

This is also why `react-day-picker/style.css` could not simply be left in
place — see ADR 0003.
