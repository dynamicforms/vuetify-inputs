# df-input Component

`df-input` is a single-line input of type text, email, password, URL or number.

## Basic Usage

`df-input` with different input types:

<input-basic/>

## Number Input

With `input-type="number"`, `df-input` renders Vuetify's `v-number-input`:

<input-number/>

## Features

- Binds a `@dynamicforms/vue-forms` element, a `v-model`, or neither
- Input types text, email, password, URL and number
- `v-number-input` for the number type

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

1. Renders Vuetify's `v-number-input` with `min`, `max`, `precision` and `step`
2. Marks the field touched on blur

`v-number-input` keeps the value within `min` and `max`: a typed value outside them shows Vuetify's error state and
is not written while the user types, and is set to the nearest bound on blur. The field receives the value after
that. `min` and `max` do not validate the field; a range the field refuses is a `ValueInRange` validator.

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
the props listed above, and any other attribute is set on the wrapper element.

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
      new Validators.Pattern(/^[a-zA-Z0-9_]+$/, { code: 'username_chars', detail: 'Letters, digits and underscores only' }),
    ],
  }),
});
</script>
```

Native DOM attributes of the input element (`autocomplete`, `inputmode`, `maxlength`) are passed through
`passthroughAttrs`, which is forwarded to the Vuetify component.

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
