# Дизайн: `bp-mui-date-range-picker`

**Дата:** 2026-05-20
**Статус:** утверждён к реализации

## Цель

React-библиотека с компонентом `DateRangeInput` — API в духе Blueprint
`DateRangeInput`, но без зависимости от `@blueprintjs`. Стилизация — Tailwind
по слотам, полностью переопределяемая потребителем.

## Контекст

Blueprint `DateRangeInput` — это композиция: календарь на `react-day-picker`
(`mode="range"`), два текстовых поля, поповер и date-математика на `date-fns`.
Эта библиотека повторяет смысл и поведение того компонента на собственном коде.

## 1. Стек

- **React 19** — peer-dependency. **TypeScript.**
- **Зависимости:** `react-day-picker` v9 (календарь + range), `date-fns`
  (date-математика, парсинг, локали), `clsx` + `tailwind-merge` (слияние
  классов).
- **Сборка:** `tsup` → ESM + CJS + `.d.ts`.
- **Витрина:** отдельное Vite-приложение в `playground/`, импортирует из `src`.
- **Стили:** библиотека отдаёт «сырые» Tailwind-классы. Потребитель обязан
  иметь Tailwind и добавить путь библиотеки в источники сканирования
  (Tailwind v4: `@source "../node_modules/bp-mui-date-range-picker/dist/**/*.js"`).
  Документируется в README.

Примечание: «mui» в имени пакета — артефакт; MUI в проекте не участвует.

## 2. Работа с датами

- **Хранение / публичный API:** нативный `Date`. Наружу не протекают
  обёртки-объекты сторонних либ.
- **Математика и парсинг по умолчанию:** `date-fns` (`parse`, `addDays`,
  `startOfWeek`, `isWithinInterval`, `min`, `max`, `startOfDay` и т.д.).
  Выбран потому, что `react-day-picker` v9 уже зависит от `date-fns` — берём
  его же, получаем единое поведение локалей и нулевую дополнительную стоимость
  в дереве зависимостей.
- **Форматирование по умолчанию:** `date-fns` `format` — единая `Locale`-система
  и для парсинга, и для вывода.
- **Escape hatch:** props `formatDate` / `parseDate` позволяют подключить любую
  реализацию (включая `Intl.DateTimeFormat`). Ядро от конкретной либы не
  зависит — `date-fns` лишь дефолт, изолированный в `utils/dateRange.ts` и
  `hooks/useDateParsing.ts`.

Отклонены: только нативный `Date` + `Intl` (`Intl` не умеет парсить);
Luxon / Day.js (дублируют `date-fns`, который уже приходит с rdp); `Temporal`
(полифилл-риск для распространяемой библиотеки на май 2026).

## 3. Структура пакета

```
src/
  index.ts                    — публичные экспорты
  DateRangeInput.tsx          — главный компонент (композиция)
  components/
    DateInputField.tsx        — одно текстовое поле (start или end)
    RangeCalendar.tsx         — обёртка react-day-picker, mode="range"
    ShortcutsPanel.tsx        — боковая панель пресетов
    TimePicker.tsx            — выбор часов/минут
    Popover.tsx               — поповер (на @floating-ui/react)
  hooks/
    useDateRangeInput.ts      — ядро: машина состояний (controlled/uncontrolled)
    useDateParsing.ts         — парсинг/форматирование текста <-> Date
  utils/
    mergeClassNames.ts        — слияние слотов (clsx + tailwind-merge)
    dateRange.ts              — хелперы над date-fns (validate, clamp, swap)
    shortcuts.ts              — построение дефолтных пресетов
  styles/
    defaultClassNames.ts      — дефолтные Tailwind-классы по слотам
  types.ts                    — публичные типы (DateRange, Slot, props)
```

### Ответственность узлов

- **`DateRangeInput`** — только композиция: связывает хук состояния, два
  `DateInputField`, `Popover` с календарём. Date-логики не содержит.
- **`useDateRangeInput`** — единственный держатель состояния диапазона:
  значение `[start, end]`, какой инпут в фокусе (`focusedBoundary`), какую
  границу редактируем, hover-превью диапазона. Поддерживает controlled и
  uncontrolled режимы. Тестируется изолированно.
- **`useDateParsing`** — чистая логика: строка -> `Date | null` и обратно,
  через `formatDate`/`parseDate` из props или дефолты на `date-fns`.
- **`RangeCalendar`** — обёртка `DayPicker` (`mode="range"`); маппит слоты
  библиотеки на `classNames` react-day-picker, прокидывает `min/maxDate`,
  `disabled`, `locale`. Реализует contiguous / non-contiguous режим (см. §5).
- **`Popover`** — позиционирование на `@floating-ui/react`, фокус-менеджмент,
  закрытие по клику вне и по `Esc`.
- **`ShortcutsPanel`**, **`TimePicker`** — изолированные UI-куски, общаются с
  ядром через колбэки.

## 4. Публичный API

```ts
type DateRange = [Date | null, Date | null];

interface Shortcut {
  label: string;
  range: DateRange;
}

interface DateRangeInputProps {
  // — Значение —
  value?: DateRange;                          // controlled
  defaultValue?: DateRange;                   // uncontrolled
  onChange?: (range: DateRange) => void;

  // — Парсинг / формат текста —
  formatDate?: (date: Date, locale?: Locale) => string;
  parseDate?: (str: string, locale?: Locale) => Date | null;
  locale?: Locale;                            // date-fns локаль

  // — Ограничения —
  minDate?: Date;
  maxDate?: Date;
  disabledDays?: Matcher | Matcher[];         // matcher react-day-picker
  allowSingleDayRange?: boolean;              // default false

  // — Календарь —
  contiguousCalendarMonths?: boolean;         // default true
  shortcuts?: boolean | Shortcut[];           // true = дефолтный набор
  timePrecision?: 'minute' | 'second';        // задан -> показывать TimePicker
  closeOnSelection?: boolean;                 // default true

  // — Поведение / состояние —
  disabled?: boolean;
  placeholder?: { start?: string; end?: string };

  // — Стилизация —
  classNames?: Partial<Record<Slot, string>>;
}
```

Отличия от Blueprint: `value` — кортеж `[Date|null, Date|null]` (не объект);
`classNames` по слотам вместо `className` + CSS-классов BP; типы собственные.

## 5. Календарь: contiguous / non-contiguous

`react-day-picker` при `numberOfMonths={2}` всегда показывает **смежные**
месяцы — независимая навигация левого и правого календаря в нём не
поддерживается. Поэтому `RangeCalendar`:

- `contiguousCalendarMonths={true}` (default) — рендерит **один** `DayPicker`
  с `numberOfMonths={2}`;
- `contiguousCalendarMonths={false}` — рендерит **два** независимых `DayPicker`
  (по одному месяцу), у каждого своё состояние видимого месяца, но общий
  `selected`-диапазон.

## 6. Слоты стилизации

Потребитель переопределяет стили через проп `classNames` — словарь
«слот -> Tailwind-классы».

```ts
type Slot =
  // Контейнер и поля ввода
  | 'root' | 'inputGroup' | 'input' | 'inputStart' | 'inputEnd'
  | 'inputInvalid' | 'separator'
  // Поповер
  | 'popover' | 'panel'
  // Шорткаты
  | 'shortcutsPanel' | 'shortcut' | 'shortcutActive'
  // Календарь
  | 'calendar' | 'month' | 'caption' | 'nav' | 'navButton'
  | 'weekday' | 'week' | 'day'
  | 'daySelected' | 'dayRangeStart' | 'dayRangeEnd' | 'dayRangeMiddle'
  | 'dayToday' | 'dayDisabled' | 'dayOutside'
  // TimePicker
  | 'timePicker' | 'timePickerInput';
```

Механика:

1. **`styles/defaultClassNames.ts`** — словарь дефолтных Tailwind-классов на
   каждый слот («вид по умолчанию»).
2. **`utils/mergeClassNames.ts`** — для каждого слота:
   `twMerge(clsx(defaultClassNames[slot], classNames?.[slot]))`. `tailwind-merge`
   разрешает конфликты так, что класс потребителя выигрывает (не дублируется).
3. **`RangeCalendar`** маппит слоты библиотеки на проп `classNames` самого
   `react-day-picker` (ключи rdp v9: `day_button`, `range_start`, `selected`,
   `today` и т.д.). Маппинг — внутренняя деталь `RangeCalendar`.

Состояния (`:hover`, `:focus`) задаются Tailwind-вариантами прямо в строке
класса слота.

### Пример

```tsx
<DateRangeInput
  classNames={{
    input: 'rounded-lg border-zinc-300 focus:ring-2 focus:ring-indigo-500',
    daySelected: 'bg-indigo-600 text-white',
    dayRangeMiddle: 'bg-indigo-100',
    shortcutActive: 'font-semibold text-indigo-600',
  }}
/>
```

## 7. Поток данных

Единственный источник правды — `useDateRangeInput`. Все взаимодействия
сходятся в нём:

- **Ввод текста:** `DateInputField` -> `useDateParsing` превращает строку в
  `Date | null`. Валидный результат коммитится в ядро; невалидный — нет, поле
  получает слот `inputInvalid`.
- **Клик дня:** `RangeCalendar` (`rdp onSelect`) отдаёт обновлённый диапазон;
  ядро решает, какую границу обновить, исходя из `focusedBoundary`.
- **Пресет:** `ShortcutsPanel` задаёт сразу обе границы; при `closeOnSelection`
  закрывает поповер.
- **Время:** `TimePicker` мержит часы/минуты в `Date` соответствующей границы,
  не трогая дату.
- **Controlled/uncontrolled:** при наличии `value` ядро зеркалит проп и зовёт
  `onChange`; иначе хранит внутреннее состояние (инициализация из
  `defaultValue`).

## 8. Обработка ошибок

| Ситуация | Поведение |
|---|---|
| Невалидная строка в инпуте | не коммитится, слот `inputInvalid`, `onChange` не зовётся |
| Дата вне `minDate`/`maxDate` | отклоняется, `inputInvalid` |
| Дата в `disabledDays` | в календаре не кликабельна; при вводе текстом отклоняется |
| `start > end` | границы меняются местами (swap) перед коммитом |
| Диапазон в один день | разрешён только при `allowSingleDayRange={true}` |
| Пустое поле | граница = `null`; `[null, null]` валиден (сброс) |

Все правила — в `utils/dateRange.ts` (чистые функции `validate`, `clamp`,
`swapIfNeeded`), тестируются отдельно.

## 9. Тестирование

- **Инструмент:** Vitest + React Testing Library; разработка по TDD.
- **`utils/dateRange.ts`** — юнит-тесты: swap, clamp, валидация границ,
  single-day.
- **`useDateParsing`** — парсинг/формат, кастомные `formatDate`/`parseDate`,
  локали.
- **`useDateRangeInput`** — машина состояний: controlled vs uncontrolled,
  переключение фокуса границ, hover-превью.
- **`DateRangeInput`** (интеграционные) — ввод текстом, клик дней, пресеты,
  contiguous / non-contiguous режим, закрытие поповера, состояние ошибки.
- **Сборка:** smoke-проверка, что `tsup` отдаёт ESM + CJS + `.d.ts`, а
  `playground` собирается с импортом из пакета.

## Объём v1

В v1 входит: два инпута + поповер с календарём, controlled/uncontrolled,
шорткаты/пресеты, min/max и disabled-дни, выбор времени (`TimePicker`),
`contiguousCalendarMonths`, слотовая стилизация.
