# df-date-time Component

The df-date-time component enables date and time selection with a visual interface based on Vuetify's date and time 
picker components.

## Basic Usage

Below is an example of the df-date-time component used with DynamicForms:

<datetime-basic/>

## Features

- Integration with `@dynamicforms/vue-forms` for state management and validation
- Support for selecting date only, time only, or both
- Customizable display formats using date-fns patterns
- Interactive visual picker interface
- Support for easy value clearing

::: warning
Keyboard support is minimal. `<space>` triggers the picker, but keyboard navigation within the picker is not fully 
supported. Manual entry is provisionally supported.
:::

## Props

In addition to [common props from InputBase](./input-base), this component supports:

| Prop              | Type | Default      | Description                                         |
|-------------------|------|--------------|-----------------------------------------------------|
| inputType         | `'datetime'` \| `'date'` \| `'time'` | `'datetime'` | Input type - date and time, date only, or time only  |
| displayFormatDate | `string` | `'P'`        | Date display format (date-fns format)              |
| displayFormatTime | `string` | `'p'`        | Time display format (date-fns format)              |
| locale            | `Locale` | `undefined`  | date-fns locale object for formatting and parsing. Falls back to global `DateTimeLocaleConfig` if not provided |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:
- `control` - DynamicForms field object
- `modelValue` - The date/time value as ISO string (v-model)
- `label` - Input field label
- `hint` - Hint text
- And more...

## Value Format

The component accepts and outputs values in the following formats:

- **datetime** mode: ISO 8601 format (`YYYY-MM-DDTHH:mm:ssXXX`)
  :::info note that resulting value will always carry user's local timezone value
- **date** mode: ISO 8601 date format (`YYYY-MM-DD`)
- **time** mode: 24-hour time format (`HH:mm:ss`)

## Display Format

The component uses [date-fns format patterns](https://date-fns.org/v2.29.3/docs/format) for displaying dates and times:

- Default date format: `'P'` (locale-specific date representation)
- Default time format: `'p'` (locale-specific time representation)

Common format strings:
- `'yyyy-MM-dd'` - 2023-04-17
- `'dd.MM.yyyy'` - 17.04.2023
- `'HH:mm'` - 14:30
- `'HH:mm:ss'` - 14:30:45

## Locale Configuration

The component supports internationalization through date-fns locale objects. You can configure locales in two ways:

### 1. Global Locale Configuration

Use `DateTimeLocaleConfig` to set a global locale for all df-date-time components:

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

Override the global locale for specific components using the `locale` prop:

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

You can import any date-fns locale:

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

The locale affects:
- Display formatting (how dates/times appear)
- Parsing (how manual input is interpreted)
- First day of week in date picker
- Month and weekday names

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
  meetingTime: Field.create({ 
    value: new Date().toISOString()
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
