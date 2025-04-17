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

In addition to [common props from InputBase](./input-base), this component supports:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| allowNull | `boolean` | `false` | Whether to allow null (indeterminate) state |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:
- `control` - DynamicForms field object
- `modelValue` - The checkbox value (v-model)
- `label` - Checkbox label
- `hint` - Hint text
- `enabled` - Whether the input is enabled
- And more...

## State Cycling Behavior

When clicked, the checkbox cycles through states in the following order:

- With `allowNull: false`: true → false → true
- With `allowNull: true`: true → null → false → true

## Events

This component emits all [common events from InputBase](./input-base):
- `update:modelValue` - When the checkbox value changes

## Examples

### Basic Binary Checkbox

```vue
<template>
  <df-checkbox
    v-model="agreeToTerms"
    label="I agree to the terms and conditions"
  />
</template>

<script setup>
import { ref } from 'vue';
import { DfCheckbox } from '@dynamicforms/vuetify-inputs';

const agreeToTerms = ref(false);
</script>
```

### Ternary Checkbox with DynamicForms

```vue
<template>
  <df-checkbox
    :control="form.fields.isVerified"
    :allow-null="true"
    label="Verification status"
    hint="Check: verified, Indeterminate: pending, Unchecked: not verified"
  />
</template>

<script setup>
import { Group, Field } from '@dynamicforms/vue-forms';
import { DfCheckbox } from '@dynamicforms/vuetify-inputs';

const form = new Group({
  isVerified: Field.create({ value: null })
});
</script>
```

<script setup>
import CheckboxBasic from '../components/checkbox-basic.vue';
</script>
