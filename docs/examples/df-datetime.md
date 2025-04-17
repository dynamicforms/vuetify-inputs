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

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:
- `control` - DynamicForms field object
- `modelValue` - The date/time value as ISO string (v-model)
- `label` - Input field label
- `hint` - Hint text
- And more...

## Value Format

The component accepts and outputs values in the following formats:

- **datetime** mode: ISO 8601 format (`YYYY-MM-DDTHH:mm:ss`)
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

<script setup>
import DatetimeBasic from '../components/datetime-basic.vue';
</script>
