# df-select Component

The df-select component provides a versatile selection field that integrates with both Vuetify and DynamicForms. It supports single or multiple choice, along with "tags" (custom new value entry) and dynamic option loading.

## Basic Usage

Basic demo with a fixed options list:

<select-basic/>

## Advanced Features

df-select also supports dynamic options loading and icons:

<select-ajax/>

## Integration with DynamicForms

The main purpose of df-select is its integration with `@dynamicforms/vue-forms`. The demo below shows this integration:

<select-form/>

## Features

- Integration with `@dynamicforms/vue-forms` for state management
- Support for single and multiple selection modes
- Dynamic option loading via AJAX/fetch
- Support for custom value entry (tagging)
- Icon display in options
- Customizable display with chips
- Support for nullable selections
- Search functionality with filtering

## Props

In addition to [common props from InputBase](./input-base), this component supports:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| choices | `SelectChoice[]` | `undefined` | Static list of choice options |
| fetchChoices | `(query?: any, idValue?: any) => Promise<SelectChoice[]>` | `undefined` | Function to load choices dynamically |
| multiple | `boolean` | `false` | Whether multiple selection is allowed |
| allowTags | `boolean` | `false` | Whether custom values can be entered |
| allowNull | `boolean` | `true` | Whether null/empty selection is allowed |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:
- `control` - DynamicForms field object
- `modelValue` - The selected value(s)
- `label` - Input label
- `hint` - Hint text
- And more...

## SelectChoice Interface

The component works with options that follow this interface:

```typescript
interface SelectChoice {
  id: any;        // Unique identifier/value for the option
  text: any;      // Display text
  icon?: string;  // Optional icon name (Ionicons format)
}
```

## Value Format

The component handles values based on the `multiple` setting:

- When `multiple: false` (default):
  - Returns a single value (the `id` of the selected option)
  - Returns `null` when nothing is selected
  
- When `multiple: true`:
  - Returns an array of values (the `id`s of selected options)
  - Returns `null` when nothing is selected (not an empty array)

## Dynamic Option Loading

When using the `fetchChoices` prop instead of static `choices`, the component:

1. Calls the function when the component mounts
2. Calls the function when the user types in the search field
3. Uses the search text as the query parameter
4. Uses the current value(s) as the idValue parameter (for initial loading)

```typescript
const fetchChoices = async (query?: string, idValue?: any): Promise<SelectChoice[]> => {
  // Simulate API call
  const response = await apiCall('/api/options', { search: query, ids: idValue });
  return response.data.map(item => ({
    id: item.id,
    text: item.name,
    icon: item.icon
  }));
};
```

## Events

This component emits all [common events from InputBase](./input-base):
- `update:modelValue` - When the selected value(s) change

## Examples

### Basic Single Selection

```vue
<template>
  <df-select
    v-model="selectedFruit"
    :choices="fruits"
    label="Choose a fruit"
  />
</template>

<script setup>
import { ref } from 'vue';
import { DfSelect } from '@dynamicforms/vuetify-inputs';

const selectedFruit = ref('apple');
const fruits = [
  { id: 'apple', text: 'Apple' },
  { id: 'banana', text: 'Banana' },
  { id: 'cherry', text: 'Cherry' }
];
</script>
```

### Multiple Selection with DynamicForms

```vue
<template>
  <df-select
    :control="form.fields.categories"
    :choices="categories"
    :multiple="true"
    label="Select categories"
  />
</template>

<script setup>
import { Group, Field } from '@dynamicforms/vue-forms';
import { DfSelect } from '@dynamicforms/vuetify-inputs';

const categories = [
  { id: 1, text: 'Electronics', icon: 'flash-outline' },
  { id: 2, text: 'Books', icon: 'book-outline' },
  { id: 3, text: 'Clothing', icon: 'shirt-outline' }
];

const form = new Group({
  categories: Field.create({
    value: [1],
    validators: [
      {
        validate: (value) => {
          if (!value || value.length === 0) return 'Select at least one category';
          return null;
        }
      }
    ]
  })
});
</script>
```

<script setup>
import SelectBasic from '../components/select-basic.vue';
import SelectAjax from '../components/select-ajax.vue';
import SelectForm from '../components/select-form.vue';
</script>
