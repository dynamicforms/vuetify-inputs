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

## Props

In addition to [common props from InputBase](./input-base), this component supports:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| inputType | `'text'` \| `'password'` \| `'email'` \| `'url'` \| `'number'` | `'text'` | Input type |
| min | `number` | `undefined` | Minimum value (for number inputs) |
| max | `number` | `undefined` | Maximum value (for number inputs) |
| step | `number` | `undefined` | Step value (for number inputs) |
| precision | `number` | `undefined` | Decimal precision (for number inputs) |
| minLength | `number` | `undefined` | Minimum text length |
| maxLength | `number` | `undefined` | Maximum text length |
| pattern | `string` \| `RegExp` | `undefined` | Validation pattern for text |
| allowNull | `boolean` | `true` | Whether null values are allowed |

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
3. Provides specialized number validation rules

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

```vue
<template>
  <df-input
    v-model="username"
    label="Username"
    hint="Enter your username"
    :min-length="3"
    :max-length="20"
    pattern="^[a-zA-Z0-9_]+$"
  />
</template>

<script setup>
import { ref } from 'vue';
import { DfInput } from '@dynamicforms/vuetify-inputs';

const username = ref('');
</script>
```

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
  quantity: Field.create({
    value: 1,
    validators: [
      {
        validate: (value) => {
          if (value === null) return 'Quantity is required';
          if (value < 1) return 'Minimum quantity is 1';
          return null;
        }
      }
    ]
  })
});
</script>
```

<script setup>
import InputBasic from '../components/input-basic.vue';
import InputNumber from '../components/input-number.vue';
</script>
