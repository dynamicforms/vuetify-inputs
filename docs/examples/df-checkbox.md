# df-checkbox Component

`df-checkbox` is a Vuetify checkbox with a binary (true/false) or ternary (true/false/null) value.

## Basic Usage

`df-checkbox` in different configurations:

<checkbox-basic/>

## Features

- Binary (true/false) and ternary (true/false/null) values
- A click cycles the value `false` → `true` → `null` → `false` with `allowNull`, and `false` ↔ `true` without it
- The indeterminate state renders `null`
- Labels and hints

## Props

In addition to [common props from InputBase](./input-base), this component supports:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| allowNull | `boolean` | `false` | Whether to allow null (indeterminate) state |

## Events

This component emits the [common events of InputBase](./input-base#events).

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
