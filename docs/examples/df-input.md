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

## Props

In addition to [common props from InputBase](./input-base), this component supports:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| inputType | `'text'` \| `'password'` \| `'email'` \| `'url'` \| `'number'` | `'text'` | Input type |
| min | `number` | `undefined` | Minimum value (for number inputs) |
| max | `number` | `undefined` | Maximum value (for number inputs) |
| step | `number` | `undefined` | Step value (for number inputs) |
| precision | `number` \| `null` | `null` | Decimal precision (for number inputs) |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:
- `control` - DynamicForms field object
- `modelValue` - The input value (v-model)
- `label` - Input label
- `hint` - Hint text
- And more...

## Number Input Handling

When `inputType` is set to 'number', the component:

1. Applies min, max, and step controls
2. Validates for proper numeric format

The number input supports:
- Integer and decimal values
- Step controls for incrementing/decrementing
- Precision control for decimal places
- Min/max value restrictions

## Events

This component emits all [common events from InputBase](./input-base):
- `update:modelValue` - When the input value changes

## Examples

### Text Input

Length and format constraints are validators on the bound field, not props of the component: df-input accepts only
the props listed above, and anything else lands on the wrapper element as a plain attribute.

```vue
<template>
  <df-input
    :control="form.fields.username"
    label="Username"
    hint="3 to 20 characters, letters, digits and underscores"
    :passthrough-attrs="{ autocomplete: 'username' }"
  />
</template>

<script setup>
import { Field, Group, Validators } from '@dynamicforms/vue-forms';
import { DfInput } from '@dynamicforms/vuetify-inputs';

const form = new Group({
  username: new Field({
    value: '',
    validators: [
      new Validators.MinLength(3),
      new Validators.MaxLength(20),
      new Validators.Pattern(/^[a-zA-Z0-9_]+$/, 'Letters, digits and underscores only'),
    ],
  }),
});
</script>
```

Native DOM attributes that the input element itself should carry - `autocomplete`, `inputmode`, `maxlength` - go
through `passthroughAttrs`, which is forwarded to the Vuetify component.

### Number Input with DynamicForms

```vue
<template>
  <df-input
    :control="form.fields.quantity"
    input-type="number"
    label="Quantity"
    hint="Enter the desired quantity"
    :min="1"
    :max="100"
    :step="1"
    :precision="0"
  />
</template>

<script setup>
import { Group, Field } from '@dynamicforms/vue-forms';
import { DfInput } from '@dynamicforms/vuetify-inputs';

const form = new Group({
  quantity: new Field({ value: 1 }),
});
</script>
```

<script setup>
import InputBasic from '../components/input-basic.vue';
import InputNumber from '../components/input-number.vue';
</script>
