# df-checkbox Component

`df-checkbox` is a Vuetify checkbox with a binary (true/false) or ternary (true/false/null) value.

## Basic Usage

`df-checkbox` in different configurations:

<checkbox-basic/>

## Features

- Binds a `@dynamicforms/vue-forms` element, a `v-model`, or neither
- Binary (true/false) and ternary (true/false/null) values
- A click cycles the value `false` → `true` → `null` → `false` with `allowNull`, and `false` ↔ `true` without it
- The indeterminate state renders `null`
- Labels and hints

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
  isVerified: new Field({ value: null })
});
</script>
```

<script setup>
import CheckboxBasic from '../components/checkbox-basic.vue';
</script>
