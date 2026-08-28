# The package does not import react-day-picker's stylesheet

`RangeCalendar` imported `react-day-picker/style.css`: 457 lines of unlayered
third-party CSS carrying a second, parallel vocabulary of roughly 35 `--rdp-*`
variables that arrived with a JS import and that no host could layer, scope, or
switch off. It also silently capped the component's flexibility — `.rdp-day`
fixes the day *cell* at 44px while `--drp-day-size` only sizes the button
inside it, so a host could not make the calendar compact by any means the
package documented. The package now maps every react-day-picker class key onto
its own slots and ships all the rules itself, inside `@layer bp-drp`.

## Considered Options

Bridging the two vocabularies (`--rdp-day-width: var(--drp-day-size)`) was
cheaper and was rejected: it keeps two dictionaries forever, leaves the
unlayered third-party sheet beating layered host utilities, and makes any
react-day-picker release able to change the component's appearance.

## Consequences

Roughly 200 lines of CSS become the package's own, and a react-day-picker major
now requires re-checking that every class key is still mapped. A test asserts
the mapping is exhaustive so this fails loudly rather than visually.
