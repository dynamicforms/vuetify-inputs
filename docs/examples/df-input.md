# df-input Component

The df-input component provides a versatile text input field that integrates with both Vuetify and DynamicForms. It 
supports various input types including text, email, password, URL, and number.

## Basic Usage

Below is an example of the df-input component with different text input types:

<input-basic/>

## Number Input

The df-input component provides specialized handling for number inputs, automatically switching to Vuetify's 
v-number-input component:

<input-number/>

## Features

- Integration with `@dynamicforms/vue-forms` for state management and validation
- Support for multiple input types: text, email, password, URL, and number
- Automatic use of specialized Vuetify number input for numerical fields
- Built-in validation for:
  - Pattern matching
  - Min/max length restrictions
  - Min/max value restrictions (for number inputs)
  - Number format validation
- Optional null value handling

### Number Input Handling

When `inputType` is set to 'number', the component:

1. Automatically uses Vuetify's `v-number-input` component
2. Applies min, max, and step controls
3. Validates for proper numeric format
4. Provides specialized number validation rules

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| control | `Field` | `undefined` | DynamicForms field object |
| modelValue | `any` | `''` | The input value (v-model) when used without control |
| inputType | `string` | `'text'` | Input type: 'text', 'password', 'email', 'url', or 'number' |
| label | `string` | `''` | Input label |
| hint | `string` | `''` | Hint text displayed below the input |
| helpText | `string` | `''` | Additional help text |
| min | `number` | `undefined` | Minimum value (for number inputs) |
| max | `number` | `undefined` | Maximum value (for number inputs) |
| step | `number` | `undefined` | Step value (for number inputs) |
| minLength | `number` | `undefined` | Minimum text length |
| maxLength | `number` | `undefined` | Maximum text length |
| pattern | `string\|RegExp` | `undefined` | Validation pattern for text |
| allowNull | `boolean` | `true` | Whether null values are allowed |
| enabled | `boolean` | `true` | Whether the input is enabled |
| visibility | `DisplayMode` | `FULL` | Visibility mode of the component |
| cssClass | `string` | `''` | Additional CSS classes |

## Events

| Event | Arguments | Description |
|-------|-----------|-------------|
| update:modelValue | `value: any` | Emitted when the input value changes |

<script setup>
import InputBasic from '../components/input-basic.vue';
import InputNumber from '../components/input-number.vue';
</script>
