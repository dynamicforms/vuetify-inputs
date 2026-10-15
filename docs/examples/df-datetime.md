# df-date-time Component

`df-date-time` selects a date, a time or both, with Vuetify's date and time pickers.

## Basic Usage

`df-date-time` bound to a vue-forms field:

<datetime-basic/>

## Features

- Binds a `@dynamicforms/vue-forms` element, a `v-model`, or neither
- Date only, time only, or both
- Display formats as date-fns patterns
- Date and time pickers in a menu
- Typed dates and times, with short forms such as `1206` for 12 June and `1843` for 18:43
- Clearing the value

## Picking a value

A choice in a picker is written to the field when it is confirmed: with OK, or with a double-click on a day or on the
clock. Cancel and closing the menu leave the field as it was. For 600 ms after the picker changes its view - a chosen
hour switches the clock to the minutes, a chosen month or year switches to the days, a day of an adjacent month
switches the calendar to that month - a double-click does not confirm,
so the second click of a double-click that changed the view does not confirm a choice it landed on. A confirmed
choice and a clear mark the field touched.

::: warning
Keyboard support is minimal. `<space>` triggers the picker, but keyboard navigation within the picker is not fully
supported.
:::

## Typing a value

The date and the time are each typed into their own text field. The field holds the text as typed and reads it when
it loses focus or on Enter; once read, the field shows the value in its display format. Leading and trailing spaces
are ignored. A field emptied of its text clears the whole value: in `datetime` mode, emptying the date or the time
clears both.

Each text is read in two steps:

1. Text in the display format (`displayFormatDate`, `displayFormatTime`) is read with date-fns `parse()` against the
   component's locale. A date read this way with a year below 1000, such as `8/12/27` against `MM/dd/yyyy`, goes to
   step 2.
2. Any other text is read by the rules below.

### Time

A time is read in the 24-hour clock. It may end in `a` or `p`, written as `am`, `pm`, `a.m.` or `p.m.` in either
case; the hour is then 1–12, `12 am` is midnight and `12 pm` noon.

| Typed | Read as | Example |
|-------|---------|---------|
| 1 digit | whole hours | `9` = 9:00 |
| 2 digits up to 23 (up to 12 with `am`/`pm`) | whole hours | `18` = 18:00, `12a` = 0:00 |
| 2 digits above that | H:0M | `65` = 6:05, `24` = 2:04 |
| 3 digits | H:MM | `130` = 1:30, `930` = 9:30, `130pm` = 13:30 |
| 4 digits | HH:MM | `1843` = 18:43, `0005` = 0:05 |
| 2 or 3 parts of 1–2 digits, separated by spaces, `:`, `.`, `,` or `-` | hours, minutes and seconds; the seconds are dropped | `18.43`, `9 30`, `18:43:20` = 18:43 |

An hour above 23 or a minute above 59 is not read.

### Date

A date is read in the order of day, month and year of the display format in the component's locale. A display format
without a numeric day, month and year, such as `PPP`, gives the order of the locale's short date format `P`. Text
without a year keeps the order of the day and the month, and takes the current year.

| Typed | Read as | `sl` (day, month, year) | `ja` (year, month, day) |
|-------|---------|------|------|
| 1–2 digits | a day of the current month | `12` = 12th | `12` = 12th |
| 3 digits | first part 1 digit, second part 2 digits | `812` = 8 Dec | `812` = 12 Aug |
| 4 digits | two parts of 2 digits | `1206` = 12 Jun | `0812` = 12 Aug |
| 6 digits | three parts of 2 digits | `120627` = 12 Jun 2027 | `270812` = 12 Aug 2027 |
| 8 digits | a full date with a 4-digit year | `12062027` | `20270812` |
| 2 parts separated by spaces, `.`, `/`, `,` or `-` | a day and a month of 1–2 digits each | `12.6` | `8/12` |
| 3 parts separated the same way | a full date; the year has 2 or 4 digits | `12. 6. 27` | `2027/8/12` |

Trailing separators are ignored (`12.6.`). A two-digit year is the year ending in those digits from 50 years before
to 49 years after the current one, the year date-fns `parse()` reads for `yy`. A date that does not exist, such as
31 February or `sl` `131` (1st of month 31), is not read; 5 or 7 digits, or more than 8, are not read either.

### Text that is not read

Text that is not read stays in the field and the value is left as it is. The field holds an error of code
`invalid_date` or `invalid_time` with origin `'application'` until its text is read or the value changes: a bound
`control` holds the error in its `errors` and is invalid, and a field without a `control` shows it.

## Props

In addition to [common props from InputBase](./input-base), this component supports:

| Prop              | Type | Default      | Description                                         |
|-------------------|------|--------------|-----------------------------------------------------|
| inputType         | `'datetime'` \| `'date'` \| `'time'` | `'datetime'` | Input type - date and time, date only, or time only  |
| displayFormatDate | `string` | `'P'`        | Date display format (date-fns format)              |
| displayFormatTime | `string` | `'p'`        | Time display format (date-fns format)              |
| locale            | `Locale` | `undefined`  | date-fns locale object for formatting and parsing. Without it, the `dateTimeLocale` setting applies, and without that `DateTimeLocaleConfig` |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:
- `control` - DynamicForms field object
- `modelValue` - The date/time value as ISO string (v-model)
- `label` - Input field label
- `hint` - Hint text
- And more...

## Value Format

The component accepts and outputs values in the following formats:

- **datetime** mode: ISO 8601 format (`YYYY-MM-DDTHH:mm:ssXXX`). The value written carries the offset of the user's
  local time zone in force on that date; in a zone with daylight saving time a January value carries the winter
  offset regardless of the date of editing.
- **date** mode: ISO 8601 date format (`YYYY-MM-DD`). A date without a time is read as that day in local time.
- **time** mode: 24-hour time format (`HH:mm:ss`)

The component writes a value only when the user edits the date or the time. A bound value is shown in the user's
local time and kept in the field as given, with its own offset (`Z` included), so displaying a record neither changes
the field nor marks it as changed.

## Display Format

Dates and times are displayed with [date-fns format patterns](https://date-fns.org/v2.29.3/docs/format):

- Default date format: `'P'` (locale-specific date representation)
- Default time format: `'p'` (locale-specific time representation)

Common format strings:
- `'yyyy-MM-dd'` - 2023-04-17
- `'dd.MM.yyyy'` - 17.04.2023
- `'HH:mm'` - 14:30
- `'HH:mm:ss'` - 14:30:45

## Locale Configuration

The locale is a date-fns locale object, set in one of two ways:

### 1. Global Locale Configuration

`DateTimeLocaleConfig` sets the locale of every `df-date-time` component whose app gives no `dateTimeLocale` setting
(see [Configuration](/examples/configuration)) and that has no `locale` prop:

```vue
<script setup>
import { DateTimeLocaleConfig } from '@dynamicforms/vuetify-inputs';
import { enUS, de, fr } from 'date-fns/locale';

// Set global locale (affects all df-date-time components)
DateTimeLocaleConfig.setDateTimeLocale(enUS);

// You can also use a reactive ref
import { ref } from 'vue';
const currentLocale = ref(de);
DateTimeLocaleConfig.setDateTimeLocale(currentLocale);

// Change locale dynamically
currentLocale.value = fr;
</script>
```

### 2. Component-specific Locale

The `locale` prop overrides the global locale for one component:

```vue
<template>
  <df-date-time
    v-model="selectedDate"
    :locale="germanLocale"
    display-format-date="dd.MM.yyyy"
    label="Deutsches Datum"
  />
</template>

<script setup>
import { ref } from 'vue';
import { de } from 'date-fns/locale';
import { DfDateTime } from '@dynamicforms/vuetify-inputs';

const germanLocale = de;
const selectedDate = ref('2023-04-17');
</script>
```

### Available Locales

Any date-fns locale can be used:

```typescript
import { 
  sl,     // Slovenian (default)
  enUS,   // English (US)
  de,     // German
  fr,     // French
  es,     // Spanish
  it,     // Italian
  // ... and many more
} from 'date-fns/locale';
```

The date-fns locale affects:
- Display formatting (how dates/times appear)
- Parsing (how manual input is interpreted)
- First day of week in date picker

The month and weekday names inside the picker are not: the component passes no locale to `<v-date-picker>`, so they
come from Vuetify's locale configuration. See [Localisation](/examples/localisation).

## Events

This component emits all [common events from InputBase](./input-base):
- `update:modelValue` - When the date/time value changes

## Examples

### Date Only Picker

```vue
<template>
  <df-date-time
    v-model="selectedDate"
    input-type="date"
    display-format-date="dd.MM.yyyy"
    label="Select Date"
    hint="Format: DD.MM.YYYY"
  />
</template>

<script setup>
import { ref } from 'vue';
import { DfDateTime } from '@dynamicforms/vuetify-inputs';

const selectedDate = ref('2023-04-17');
</script>
```

### Date and Time Picker with DynamicForms

```vue
<template>
  <df-date-time
    :control="form.fields.meetingTime"
    label="Meeting Time"
    hint="Select the date and time for your meeting"
  />
</template>

<script setup>
import { Group, Field } from '@dynamicforms/vue-forms';
import { DfDateTime } from '@dynamicforms/vuetify-inputs';

const form = new Group({
  meetingTime: new Field({ 
    value: '2026-03-15T09:30:00'
  })
});
</script>
```

### Multilingual Date Picker

```vue
<template>
  <div>
    <v-btn-toggle v-model="selectedLocaleIndex" mandatory>
      <v-btn value="0">Slovenščina</v-btn>
      <v-btn value="1">U.S. English</v-btn>
      <v-btn value="2">Deutsch</v-btn>
    </v-btn-toggle>
    
    <df-date-time
      v-model="selectedDate"
      :locale="locales[selectedLocaleIndex]"
      display-format-date="PP"
      display-format-time="pp"
      label="Izberite datum"
      hint="Datum se prikaže v izbrani lokali"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { sl, enUS, de } from 'date-fns/locale';
import { DfDateTime } from '@dynamicforms/vuetify-inputs';

const selectedLocaleIndex = ref(0);
const locales = [sl, enUS, de];
const selectedDate = ref('2023-04-17T14:30:00');
</script>
```

<script setup>
import DatetimeBasic from '../components/datetime-basic.vue';
</script>
