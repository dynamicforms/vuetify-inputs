# df-date-time Component

The df-date-time component enables date and time selection with a visual interface based on the vue-datetime3 library.

## Basic Usage

Below is an example of the df-date-time component used with DynamicForms:

<datetime-basic/>

## Features

- Integration with `@dynamicforms/vue-forms` for state management and validation
- Support for selecting date only, time only, or both
- Customizable display formats
- Text localization
- Support for easy value clearing

::: warning
Keyboard support minimal. `<space>` triggers the picker, but navigation is not possible. Manual entry also only
provisionally supported.
:::

## Props

| Prop              | Type | Default      | Description                                         |
|-------------------|------|--------------|-----------------------------------------------------|
| control           | `Field` | `undefined`  | DynamicForms field object                           |
| modelValue        | `string` | `''`         | The field value (v-model) when used without control |
| label             | `string` | `''`         | Input field label                                   |
| hint              | `string` | `''`         | Hint text displayed below the input field           |
| helpText          | `string` | `''`         | Additional help text                                |
| inputType         | `'datetime'`, `'date'`, `'time'` | `'datetime'` | Input type - date and time, date only or time only  |
| displayFormatDate | `string` | `'P'`        | Date display format                                 |
| displayFormatTime | `string` | `'p'`        | Time display format                                 |
| enabled           | `boolean` | `true`       | Whether the input field is enabled                  |
| visibility        | `DisplayMode` | `FULL`       | Component visibility mode                           |
| cssClass          | `string` | `''`         | Additional CSS classes                              |

## Display Format

The component uses date-fns date and time display formats.

## Events

| Event | Arguments | Description |
|-------|-----------|-------------|
| update:modelValue | `value: string` | Triggered when the value changes (when used without control) |

<script setup>
import DatetimeBasic from '../components/datetime-basic.vue';
</script>
