# Дизайн: дефолтные стили всплывающей панели и выбора дня

**Дата:** 2026-05-21
**Статус:** утверждён к реализации
**Базируется на:** библиотека `bp-mui-date-range-picker`

## Цель

После перехода на тематизацию через CSS-переменные у всплывающей панели нет
видимых стилей (прозрачный фон, без рамки и тени), а выделение дней в календаре
(`selected`, `range-*`, `today`, `disabled`, `outside`) визуально не проявляется.
Нужно, чтобы дефолтный вид этих частей работал «из коробки».

## Причины (две независимые)

**Причина A — стили дня навешены не на тот элемент.**
react-day-picker v9 рисует день как ячейку `<td>` + кнопку `<button>` внутри.
Классы состояния (`drp-day-selected`, `drp-day-range-*`, `drp-day-today`,
`drp-day-disabled`, `drp-day-outside`) rdp вешает на `<td>` (`UI.Day` через
`getClassNamesForModifiers`), а `drp-day` — на `<button>` (`UI.DayButton`).
В `styles.css` правила состояний красят `<td>`, но кнопка лежит поверх с
собственным непрозрачным `background` и собственным `color` — она перекрывает
ячейку. Подтверждено по `node_modules/react-day-picker/dist/esm`:
`DayPicker.js` (строка с `components.Day` получает `getClassNamesForModifiers(...)`),
`components/Day.js` → `<td>`, `components/DayButton.js` → `<button>`.

**Причина B — всплывающая панель «вываливается» из зоны переменных.**
Все `--drp-*` объявлены на `.drp-root`. `Popover` рендерит панель через
`FloatingPortal`, который переносит её в конец `<body>` — наружу из `.drp-root`.
CSS-переменные наследуются только вниз по дереву, поэтому внутри панели каждый
`var(--drp-bg)`, `var(--drp-border)`, `var(--drp-accent)` и т.д. не резолвится →
объявления недействительны → панель прозрачная, без рамки/тени, дни без цвета.
Это же ломает тематизацию панели через обёртку/инстанс, хотя README её обещает.

## Решение

### Правка A — стили состояний дня (`src/styles.css`)

Шесть правил состояний переписать так, чтобы они красили вложенную кнопку
`.drp-day`, а не ячейку. Селекторы остаются нулевой специфичности (`:where()`),
инвариант «слот потребителя выигрывает» сохраняется.

Было:
```css
:where(.drp-day-selected),
:where(.drp-day-range-start),
:where(.drp-day-range-end) { background: var(--drp-accent); color: var(--drp-accent-fg); }
```
Станет:
```css
:where(.drp-day-selected) :where(.drp-day),
:where(.drp-day-range-start) :where(.drp-day),
:where(.drp-day-range-end) :where(.drp-day) { background: var(--drp-accent); color: var(--drp-accent-fg); }
```
Аналогично для `drp-day-range-middle`, `drp-day-today`, `drp-day-disabled`,
`drp-day-outside` — каждый получает вложенный ` :where(.drp-day)`.

Правило `:where(.drp-day)` (базовый вид кнопки) и `:where(.drp-day:hover)`
не меняются.

### Правка B — проброс `--drp-*` в портал (вариант Б1)

Панель получает значения токенов inline-стилем, скопированные с `.drp-root`.
Так работают и дефолты, и любая тематизация (глобально / на обёртке /
per-instance), потому что `getComputedStyle` отдаёт уже разрешённое каскадом
значение.

**Новый файл `src/styles/tokens.ts`:** экспортирует `DRP_TOKENS` —
массив имён всех `--drp-*` токенов (тот же набор, что объявлен на `.drp-root`
в `styles.css`, ~28 имён). Плюс хелпер
`readThemeTokens(el: HTMLElement): CSSProperties` — проходит по `DRP_TOKENS`,
берёт `getComputedStyle(el).getPropertyValue(name).trim()`, собирает объект
`{ '--drp-accent': value, ... }`; пустые значения пропускает.

**`src/DateRangeInput.tsx`:**
- `rootRef = useRef<HTMLDivElement>(null)` навешивается на корневой `.drp-root` div.
- `popoverTokens` хранится в `useState<CSSProperties>({})`.
- `useLayoutEffect` с зависимостью `[open]`: когда `open === true` и
  `rootRef.current` есть — `setPopoverTokens(readThemeTokens(rootRef.current))`.
- `popoverTokens` передаётся в `Popover` новым пропом `style`.

**`src/components/Popover.tsx`:**
- Новый необязательный проп `style?: CSSProperties`.
- На плавающем `<div>`: `style={{ ...style, ...floatingStyles }}` — токены
  применяются как inline custom properties, `floatingStyles` (позиционирование)
  имеет приоритет и не конфликтует (наборы свойств не пересекаются).

## Обработка ошибок

Не требуется. Если токен не прочитался (пустая строка) — пропускается, панель
останется без этой переменной (как сейчас). В jsdom `getComputedStyle` для
custom properties возвращает пусто — хелпер вернёт `{}`, падений нет.

## Тестирование

Ограничение прежнее: jsdom не вычисляет каскад CSS и `var()`, поэтому
«панель покрасилась» проверяется не юнитами.

Автоматически:
- **`styles.test.ts`** — добавить проверку, что правила состояний дня содержат
  вложенный селектор `.drp-day` (например, строка
  `:where(.drp-day-selected) :where(.drp-day)` присутствует).
- **`tokens.test.ts`** (новый) — `DRP_TOKENS` непустой, все имена начинаются с
  `--drp-`; `readThemeTokens` на элементе без стилей возвращает объект (в jsdom
  возможно пустой) без исключений.
- **`Popover.test.tsx`** — при переданном пропе `style` плавающий `<div>` несёт
  эти inline-свойства; позиционирование `floatingStyles` не сломано.
- **`DateRangeInput`** — существующие тесты остаются зелёными; панель по-прежнему
  открывается по фокусу и содержит календарь.
- Существующие поведенческие тесты — без регрессий.

Визуальная проверка (playground, вручную): панель имеет фон/рамку/тень;
выделение диапазона, `today`, `disabled` видны; демо темизации через `--drp-*`
перекрашивает в т.ч. панель.

Прим.: набор `DRP_TOKENS` в `tokens.ts` дублирует список токенов из `styles.css`
по смыслу — это сознательная цена варианта Б1 (CSS не отдаёт список своих
переменных в JS). Тест на префикс `--drp-` ловит опечатки.

## Объём

Одна цельная правка: дефолтный вид всплывающей панели. Один спек, один план.
Публичный API (`Slot`, `classNames`, пропы `DateRangeInput`) не меняется;
`Popover` получает внутренний проп `style`.
