# df-text-area Component

The df-text-area component provides a multi-line text input that fully integrates with both Vuetify and DynamicForms.

## Basic Usage

Below is an example of the df-text-area component used with DynamicForms:

<textarea-basic/>

## Features

- Integration with `@dynamicforms/vue-forms` for state management and validation
- Configurable number of rows
- Auto-growing height with configurable maximum rows
- Length validation with maxLength property
- Customizable labels, hints, and error messages

## Props

In addition to [common props from InputBase](./input-base), this component supports:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| rows | `number` | `undefined` | Number of visible text rows |
| maxRows | `number` | `undefined` | Maximum number of rows when auto-grow is enabled |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:
- `control` - DynamicForms field object
- `modelValue` - The textarea content (v-model)
- `label` - Input label
- `hint` - Hint text
- And more...

## Auto-Growing Behavior

The textarea will automatically grow when content exceeds the visible space, but only if `maxRows` is set to a positive
value. This prevents the textarea from growing indefinitely.

When auto-grow is enabled:
- The textarea starts with the height specified by `rows`
- It grows as content is added, up to the limit specified by `maxRows`
- A scrollbar appears if content exceeds the maximum height

## Events

This component emits all [common events from InputBase](./input-base):
- `update:modelValue` - When the textarea content changes

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
import { DfTextArea, Validators } from '@dynamicforms/vuetify-inputs';

const form = new Group({
  notes: Field.create({ 
    value: '',
    validators: [new Validators.LengthInRange(minLength, maxLength)]
  })
});
</script>
```

<script setup>
import TextareaBasic from '../components/textarea-basic.vue';
</script>
