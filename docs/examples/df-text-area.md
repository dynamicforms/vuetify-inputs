# DfTextArea Component

The DfTextArea component provides a multi-line text input that fully integrates with both Vuetify and DynamicForms.

## Basic Usage

Below is an example of the DfTextArea component used with DynamicForms:

<textarea-basic/>

## Features

- Integration with `@dynamicforms/vue-forms` for state management and validation
- Configurable number of rows
- Auto-growing height with configurable maximum rows
- Length validation with maxLength property
- Customizable labels, hints, and error messages

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| control | `Field` | `undefined` | DynamicForms field object |
| modelValue | `string` | `''` | The input value (v-model) when used without control |
| label | `string` | `''` | Input label |
| hint | `string` | `''` | Hint text displayed below the input |
| helpText | `string` | `''` | Additional help text |
| rows | `number` | `undefined` | Number of visible text rows |
| maxRows | `number` | `undefined` | Maximum number of rows when auto-grow is enabled |
| enabled | `boolean` | `true` | Whether the input is enabled |
| visibility | `DisplayMode` | `FULL` | Visibility mode of the component |
| cssClass | `string` | `''` | Additional CSS classes |

## Auto-Growing Behavior

The textarea will automatically grow when content exceeds the visible space, but only if `maxRows` is set to a positive
value. This prevents the textarea from growing indefinitely.

## Length Validation

Setting `maxLength` adds a validation rule that ensures the text doesn't exceed the specified number of characters.
The validation message will be displayed if the text is too long.

## Events

| Event | Arguments | Description |
|-------|-----------|-------------|
| update:modelValue | `value: string` | Emitted when the input value changes (when used without control) |

<script setup>
import TextareaBasic from '../components/textarea-basic.vue';
</script>
