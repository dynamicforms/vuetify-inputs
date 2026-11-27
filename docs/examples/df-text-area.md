# df-text-area Component

`df-text-area` is a multi-line text input.

## Basic Usage

`df-text-area` bound to a vue-forms field:

<textarea-basic/>

## Features

- Configurable number of rows
- Auto-growing height with configurable maximum rows
- Length validation through vue-forms validators on the bound field
- Labels, hints and error messages

## Props

In addition to [common props from InputBase](./input-base), this component supports:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| rows | `number` | `undefined` | Number of visible text rows |
| maxRows | `number` | `undefined` | Maximum number of rows when auto-grow is enabled |

## Auto-Growing Behaviour

The textarea grows with its content only when `maxRows` is a positive value; the growth stops at `maxRows`.

When auto-grow is enabled:

- The textarea starts with the height specified by `rows`
- It grows as content is added, up to the limit specified by `maxRows`
- A scrollbar appears if content exceeds the maximum height

## Events

This component emits the [common events of InputBase](./input-base#events).

## Examples

### Basic Textarea

```vue
<template>
  <df-text-area
    v-model="description"
    label="Description"
    hint="Enter a detailed description"
    :rows="4"
    :max-rows="8"
  />
</template>

<script setup>
import { ref } from 'vue';
import { DfTextArea } from '@dynamicforms/vuetify-inputs';

const description = ref('');
</script>
```

### With DynamicForms Integration

```vue
<template>
  <df-text-area
    :control="form.fields.notes"
    label="Additional Notes"
    hint="Any extra information (optional)"
    :rows="3"
  />
</template>

<script setup>
import { Group, Field } from '@dynamicforms/vue-forms';
import { DfTextArea } from '@dynamicforms/vuetify-inputs';
import { Validators } from '@dynamicforms/vue-forms';

const form = new Group({
  notes: new Field({ 
    value: '',
    validators: [new Validators.LengthInRange(10, 500)]
  })
});
</script>
```

<script setup>
import TextareaBasic from '../components/textarea-basic.vue';
</script>
