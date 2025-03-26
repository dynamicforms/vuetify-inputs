# df-checkbox Component

The df-checkbox component provides a checkbox input field that integrates with both Vuetify and DynamicForms. It offers 
support for both binary (true/false) and ternary (true/false/null) states.

## Basic Usage

Below is an example demonstrating different configurations of the df-checkbox component:

<checkbox-basic/>

## Features

- Integration with `@dynamicforms/vue-forms` for state management and validation
- Support for both binary (true/false) and ternary (true/false/null) states
- Automatic normalization of input values
- Clear visual indication of indeterminate (null) state
- Customizable labels and hints

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| control | `Field` | `undefined` | DynamicForms field object |
| modelValue | `boolean \| null` | `false` | The checkbox value (v-model) when used without control |
| label | `string` | `''` | Checkbox label |
| hint | `string` | `''` | Hint text displayed below the checkbox |
| helpText | `string` | `''` | Additional help text |
| allowNull | `boolean` | `false` | Whether to allow null (indeterminate) state |
| enabled | `boolean` | `true` | Whether the input is enabled |
| visibility | `DisplayMode` | `FULL` | Component visibility mode |
| cssClass | `string` | `''` | Additional CSS classes |

## State Cycling Behavior

When clicked, the checkbox cycles through states in the following order:

- With `allowNull: false`: true → false → true
- With `allowNull: true`: true → null → false → true

## Events

| Event | Arguments | Description |
|-------|-----------|-------------|
| update:modelValue | `value: boolean \| null` | Emitted when the checkbox value changes |

<script setup>
import CheckboxBasic from '../components/checkbox-basic.vue';
</script>
