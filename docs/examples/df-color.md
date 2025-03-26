# df-color Component

The df-color component provides a color selection field that integrates with both Vuetify and DynamicForms. It offers 
a visual color picker interface with hex color input support.

## Basic Usage

Below is an example of the df-color-picker component used with DynamicForms:

<color-basic/>

## Features

- Integration with `@dynamicforms/vue-forms` for state management and validation
- Visual color picker interface
- Support for hex color input
- Visual color indicator preview
- Validation for proper hex color format
- Support for clearing the color value

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| control | `Field` | `undefined` | DynamicForms field object |
| modelValue | `string` | `''` | The color value in hex format (v-model) when used without control |
| label | `string` | `''` | Input label |
| hint | `string` | `''` | Hint text displayed below the input |
| helpText | `string` | `''` | Additional help text |
| allowNull | `boolean` | `false` | Whether to allow null (empty) values |
| enabled | `boolean` | `true` | Whether the input is enabled |
| visibility | `DisplayMode` | `FULL` | Component visibility mode |
| cssClass | `string` | `''` | Additional CSS classes |

## Color Format

The component accepts and outputs color values in hex format (e.g., `#FF0000` for red). It also supports the 
alpha channel (e.g., `#FF0000FF`).

## Validation

The component includes built-in validation for proper hex color format. The validation can be customized or 
extended as needed.

## Events

| Event | Arguments | Description |
|-------|-----------|-------------|
| update:modelValue | `value: string` | Emitted when the color value changes |

<script setup>
import ColorBasic from '../components/color-basic.vue';
</script>
